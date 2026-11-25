export interface PermisoEfectivo {
  legajoId: number;
  permisos: string[];
  administrador: boolean;
}

/** Claves de permiso conocidas por el frontend (espejo de permisos.yaml). */
export const PERMISOS = {
  seguridadPermisos: 'seguridad.permisos.administrar',
  seguridadRoles: 'seguridad.roles.administrar',
  seguridadCatalogo: 'seguridad.catalogo.administrar',
  seguridadSimulador: 'seguridad.simulador.consultar',
} as const;
