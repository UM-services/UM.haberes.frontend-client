import { authGuard, moduloGuard, unauthGuard } from '@haberes/shared-api';

import { appRoutes } from './app.routes';

describe('rutas del módulo Novedades', () => {
  const login = appRoutes.find((ruta) => ruta.path === 'login');
  // Toda ruta con componente (no redirects ni login) debe estar protegida.
  const protegidas = appRoutes.filter(
    (ruta) => ruta.path !== 'login' && ruta.redirectTo === undefined,
  );

  it('el login evalúa la regla de facultad del módulo', () => {
    expect(login?.canActivate).toContain(unauthGuard);
    expect(login?.data?.['requireFacultadId']).toBe(true);
  });

  it('todas las rutas exigen sesión y el guard de facultad', () => {
    expect(protegidas.length).toBeGreaterThan(0);

    const sinGuard = protegidas.filter(
      (ruta) => !ruta.canActivate?.includes(authGuard) || !ruta.canActivate?.includes(moduloGuard),
    );
    expect(sinGuard.map((ruta) => ruta.path)).toEqual([]);
  });

  it('todas las rutas declaran requireFacultadId true', () => {
    const conDatosIncorrectos = protegidas.filter(
      (ruta) => ruta.data?.['requireFacultadId'] !== true,
    );
    expect(conDatosIncorrectos.map((ruta) => ruta.path)).toEqual([]);
  });
});
