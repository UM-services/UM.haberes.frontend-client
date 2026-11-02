import { expect, test } from '@playwright/test';

const SESSION_KEY = 'haberes_user';

const persona = {
  legajoId: 123,
  apellido: 'García',
  nombre: 'Ana',
  apellidoNombre: 'García, Ana',
};

/**
 * Simula una sesión persistida (sólo `legajoId`) y las respuestas de
 * haberes-core que usa `AuthService.ensureSession()` en el arranque.
 */
async function prepararSesion(
  page: import('@playwright/test').Page,
  facultadId: number | null,
): Promise<void> {
  await page.route('**/api/haberes/core/persona/**', (route) =>
    route.fulfill({ json: persona }),
  );
  await page.route('**/api/haberes/core/usuario/**', (route) =>
    route.fulfill({ json: { legajoId: persona.legajoId, usuarioId: 7, facultadId } }),
  );
  if (facultadId != null) {
    await page.route('**/api/haberes/core/facultad/**', (route) =>
      route.fulfill({ json: { nombre: 'Ingeniería' } }),
    );
  }

  await page.addInitScript(
    ([key, value]) => localStorage.setItem(key, value),
    [SESSION_KEY, JSON.stringify({ version: 2, legajoId: persona.legajoId })],
  );
}

test('un usuario sin facultad es rechazado del módulo Novedades', async ({ page }) => {
  await prepararSesion(page, null);

  await page.goto('/inicio');

  await expect(page).toHaveURL(/\/login$/);
  expect(await page.evaluate((key) => localStorage.getItem(key), SESSION_KEY)).toBeNull();
});

test('un usuario con facultad entra al módulo Novedades', async ({ page }) => {
  await prepararSesion(page, 3);

  await page.goto('/inicio');

  await expect(page).toHaveURL(/\/inicio$/);
  await expect(page.getByText('Directorio de Operaciones')).toBeVisible();
});
