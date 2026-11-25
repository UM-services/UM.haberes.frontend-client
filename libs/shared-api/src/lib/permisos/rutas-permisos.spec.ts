import { permisoParaUrl, rutaHabilitada } from './rutas-permisos';

describe('rutas-permisos', () => {
  it('deja libres las rutas sin permiso', () => {
    expect(permisoParaUrl('/inicio')).toBeNull();
    expect(permisoParaUrl('/sin-acceso')).toBeNull();
  });

  it('mapea la ruta más específica primero', () => {
    expect(permisoParaUrl('/liquidacion/etec/asig-cargos')).toEqual([
      'liquidacion.etec.asignaciones.gestionar',
    ]);
    expect(permisoParaUrl('/liquidacion/asig-cargos')).toEqual([
      'liquidacion.asig_cargos.gestionar',
    ]);
    expect(permisoParaUrl('/designaciones/general')).toEqual([
      'designaciones.general.gestionar',
    ]);
    expect(permisoParaUrl('/designaciones')).toEqual(['novedades.designaciones.ver']);
  });

  it('ignora query string y barra final', () => {
    expect(permisoParaUrl('/seguridad/roles/?x=1')).toEqual(['seguridad.roles.administrar']);
  });

  it('rutaHabilitada usa OR entre claves', () => {
    expect(rutaHabilitada('/consultas/totales-generales', () => true)).toBe(true);
    expect(rutaHabilitada('/consultas/totales-generales', () => false)).toBe(false);
    expect(rutaHabilitada('/inicio', () => false)).toBe(true);
  });
});
