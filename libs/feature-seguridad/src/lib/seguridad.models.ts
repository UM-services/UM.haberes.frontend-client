export interface Permiso {
  permisoId: number;
  clave: string;
  descripcion: string;
  modulo: string;
  aplicacion: string;
  activo: number;
}

export interface Rol {
  rolId: number;
  nombre: string;
  descripcion: string | null;
  aplicacion: string;
  activo: number;
  protegido: boolean;
}

export interface RolPermiso {
  rolPermisoId: number;
  rolId: number;
  permisoId: number;
}

export interface UsuarioRol {
  usuarioRolId: number;
  legajoId: number;
  rolId: number;
}

export interface UsuarioPermiso {
  usuarioPermisoId: number;
  legajoId: number;
  permisoId: number;
  otorgado: number;
}

export interface PermisoEfectivo {
  legajoId: number;
  permisos: string[];
  administrador: boolean;
}

export interface SyncResultado {
  creados: string[];
  actualizados: string[];
  retirados: string[];
  asignacionesAgregadas: string[];
  asignacionesQuitadas: string[];
  warnings: string[];
  totalCambios: number;
}

export interface GrupoPermisos {
  modulo: string;
  permisos: Permiso[];
}

/** Fila calculada para la grilla de permisos por usuario. */
export interface PermisoFila {
  permiso: Permiso;
  heredado: boolean;
  /** 1 = otorgado, 0 = revocado, null = sin excepción (hereda del rol). */
  override: number | null;
  efectivo: boolean;
}

export interface ModuloGrupo {
  modulo: string;
  filas: PermisoFila[];
  asignados: number;
}
