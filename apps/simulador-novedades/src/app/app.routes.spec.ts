import { NOVEDADES_MENU_ITEMS } from '@haberes/novedades-menu';
import {
  SIN_ACCESO_RUTA,
  administradorGuard,
  authGuard,
  facultadSimuladaGuard,
  moduloGuard,
  unauthGuard,
} from '@haberes/shared-api';

import { appRoutes } from './app.routes';

describe('rutas del módulo Simulador Novedades', () => {
  const login = appRoutes.find((ruta) => ruta.path === 'login');
  const inicio = appRoutes.find((ruta) => ruta.path === 'inicio');
  // Toda ruta con componente (no redirects, login ni la pantalla pública).
  const protegidas = appRoutes.filter(
    (ruta) => ruta.path !== 'login' && ruta.path !== SIN_ACCESO_RUTA && ruta.redirectTo === undefined,
  );
  const pantallas = protegidas.filter((ruta) => ruta.path !== 'inicio');

  it('el login exige usuario sin facultad y con el flag administrador', () => {
    expect(login?.canActivate).toContain(unauthGuard);
    expect(login?.data?.['requireFacultadId']).toBe(false);
    expect(login?.data?.['requireAdministrador']).toBe(true);
  });

  it('expone una pantalla pública para explicar el acceso restringido', () => {
    const sinAcceso = appRoutes.find((ruta) => ruta.path === SIN_ACCESO_RUTA);
    expect(sinAcceso).toBeDefined();
    expect(sinAcceso?.canActivate).toBeUndefined();
  });

  it('todas las rutas exigen sesión, módulo global y flag administrador', () => {
    expect(protegidas.length).toBeGreaterThan(0);

    const sinGuard = protegidas.filter(
      (ruta) =>
        !ruta.canActivate?.includes(authGuard) ||
        !ruta.canActivate?.includes(moduloGuard) ||
        !ruta.canActivate?.includes(administradorGuard),
    );
    expect(sinGuard.map((ruta) => ruta.path)).toEqual([]);
  });

  it('todas las rutas declaran requireFacultadId false', () => {
    const conDatosIncorrectos = protegidas.filter(
      (ruta) => ruta.data?.['requireFacultadId'] !== false,
    );
    expect(conDatosIncorrectos.map((ruta) => ruta.path)).toEqual([]);
  });

  it('el inicio no exige facultad simulada: es donde se elige', () => {
    expect(inicio?.canActivate).not.toContain(facultadSimuladaGuard);
  });

  it('todas las pantallas exigen una facultad simulada', () => {
    expect(pantallas.length).toBeGreaterThan(0);

    const sinGuard = pantallas.filter(
      (ruta) => !ruta.canActivate?.includes(facultadSimuladaGuard),
    );
    expect(sinGuard.map((ruta) => ruta.path)).toEqual([]);
  });

  it('replica exactamente las pantallas del menú de Novedades', () => {
    const pathsPantallas = pantallas.map((ruta) => `/${ruta.path}`).sort();
    const pathsMenu = NOVEDADES_MENU_ITEMS.map((item) => item.path)
      .filter((path) => path !== '/inicio')
      .sort();

    expect(pathsPantallas).toEqual(pathsMenu);
  });
});
