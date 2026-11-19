import { expect, test, type Page } from '@playwright/test';

const SESSION_KEY = 'haberes_user';

const persona = {
  legajoId: 725,
  apellido: 'Admin',
  nombre: 'Haberes',
  apellidoNombre: 'Admin, Haberes',
};

const facultades = [
  { facultadId: 3, nombre: 'Facultad de Ingeniería', reducido: 'Ingeniería' },
  { facultadId: 4, nombre: 'Facultad de Derecho', reducido: 'Derecho' },
];

interface SesionSimulada {
  facultadId: number | null;
  administrador: 0 | 1;
}

/**
 * Simula una sesión persistida (sólo `legajoId`) y las respuestas de
 * haberes-core que usa `AuthService.ensureSession()` en el arranque, más el
 * catálogo de facultades que consume la barra del simulador.
 */
async function prepararSesion(page: Page, sesion: SesionSimulada): Promise<void> {
  await page.route('**/api/haberes/core/persona/**', (route) =>
    route.fulfill({ json: persona }),
  );
  await page.route('**/api/haberes/core/usuario/**', (route) =>
    route.fulfill({
      json: {
        legajoId: persona.legajoId,
        usuarioId: 7,
        facultadId: sesion.facultadId,
        administrador: sesion.administrador,
      },
    }),
  );
  await page.route(/\/api\/haberes\/core\/facultad\//, (route) => {
    const porId = route.request().url().match(/facultad\/(\d+)$/);
    return route.fulfill({
      json: porId ? facultades[0] : facultades,
    });
  });

  await page.addInitScript(
    ([key, value]) => localStorage.setItem(key, value),
    [SESSION_KEY, JSON.stringify({ version: 2, legajoId: persona.legajoId })],
  );
}

test('un usuario con facultad es rechazado del simulador', async ({ page }) => {
  await prepararSesion(page, { facultadId: 3, administrador: 0 });

  await page.goto('/inicio');

  await expect(page).toHaveURL(/\/sin-acceso$/);
  // La denegación no destruye la sesión: es un módulo distinto, no un 401.
  expect(await page.evaluate((key) => localStorage.getItem(key), SESSION_KEY)).not.toBeNull();
});

test('un usuario sin el flag administrador es rechazado', async ({ page }) => {
  await prepararSesion(page, { facultadId: null, administrador: 0 });

  await page.goto('/inicio');

  await expect(page).toHaveURL(/\/sin-acceso$/);
});

test('un administrador entra y el simulador le pide una facultad', async ({ page }) => {
  await prepararSesion(page, { facultadId: null, administrador: 1 });

  await page.goto('/inicio');

  await expect(page).toHaveURL(/\/inicio$/);
  await expect(page.getByText('Elegí una facultad', { exact: true })).toBeVisible();
  await expect(page.getByText('Simulador', { exact: true })).toBeVisible();
});

test('al elegir facultad se habilita el directorio y aparece el aviso de simulación', async ({
  page,
}) => {
  await prepararSesion(page, { facultadId: null, administrador: 1 });

  await page.goto('/inicio');
  await expect(page.getByText('Elegí una facultad', { exact: true })).toBeVisible();

  await page.selectOption('app-facultad-bar select', '3');

  const barra = page.locator('app-facultad-bar');
  await expect(barra).toContainText('Simulando como');
  await expect(barra).toContainText('Facultad de Ingeniería');
  await expect(page.getByText('Directorio de Operaciones')).toBeVisible();
});

test('sin facultad elegida una pantalla vuelve al directorio', async ({ page }) => {
  await prepararSesion(page, { facultadId: null, administrador: 1 });

  await page.goto('/anotador');

  await expect(page).toHaveURL(/\/inicio$/);
  await expect(page.getByText('Elegí una facultad', { exact: true })).toBeVisible();
});
