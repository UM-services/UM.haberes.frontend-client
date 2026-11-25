import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '@haberes/shared-api';
import {
  Permiso,
  PermisoEfectivo,
  Rol,
  RolPermiso,
  SyncResultado,
  UsuarioPermiso,
  UsuarioRol,
} from './seguridad.models';

/**
 * Cliente de los endpoints RBAC de haberes-core. Todas las rutas cuelgan de la
 * base de la API propia (`/api/haberes`), por lo que el `authInterceptor`
 * agrega el Bearer automáticamente.
 */
@Injectable({ providedIn: 'root' })
export class SeguridadService {
  private readonly http = inject(HttpClient);
  private readonly base = (inject(API_URL, { optional: true }) || '/api/haberes') + '/core';

  catalogo(): Observable<Permiso[]> {
    return this.http.get<Permiso[]>(`${this.base}/permiso/`);
  }

  crearPermiso(permiso: Partial<Permiso>): Observable<Permiso> {
    return this.http.post<Permiso>(`${this.base}/permiso/`, permiso);
  }

  actualizarPermiso(permisoId: number, permiso: Partial<Permiso>): Observable<Permiso> {
    return this.http.put<Permiso>(`${this.base}/permiso/${permisoId}`, permiso);
  }

  retirarPermiso(permisoId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/permiso/${permisoId}`);
  }

  sync(dryRun: boolean): Observable<SyncResultado> {
    return this.http.post<SyncResultado>(`${this.base}/permiso/sync`, { dryRun });
  }

  roles(): Observable<Rol[]> {
    return this.http.get<Rol[]>(`${this.base}/rol/`);
  }

  crearRol(rol: Partial<Rol>): Observable<Rol> {
    return this.http.post<Rol>(`${this.base}/rol/`, rol);
  }

  actualizarRol(rolId: number, rol: Partial<Rol>): Observable<Rol> {
    return this.http.put<Rol>(`${this.base}/rol/${rolId}`, rol);
  }

  eliminarRol(rolId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/rol/${rolId}`);
  }

  permisosDeRol(rolId: number): Observable<RolPermiso[]> {
    return this.http.get<RolPermiso[]>(`${this.base}/rolPermiso/rol/${rolId}`);
  }

  asignarPermisoARol(rolId: number, permisoId: number): Observable<RolPermiso> {
    return this.http.post<RolPermiso>(`${this.base}/rolPermiso/`, { rolId, permisoId });
  }

  quitarPermisoDeRol(rolId: number, permisoId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/rolPermiso/rol/${rolId}/permiso/${permisoId}`);
  }

  rolesDeUsuario(legajoId: number): Observable<UsuarioRol[]> {
    return this.http.get<UsuarioRol[]>(`${this.base}/usuarioRol/usuario/${legajoId}`);
  }

  asignarRol(legajoId: number, rolId: number): Observable<UsuarioRol> {
    return this.http.post<UsuarioRol>(`${this.base}/usuarioRol/`, { legajoId, rolId });
  }

  quitarRol(legajoId: number, rolId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/usuarioRol/usuario/${legajoId}/rol/${rolId}`);
  }

  overridesDeUsuario(legajoId: number): Observable<UsuarioPermiso[]> {
    return this.http.get<UsuarioPermiso[]>(`${this.base}/usuarioPermiso/usuario/${legajoId}`);
  }

  setOverride(legajoId: number, permisoId: number, otorgado: number | null): Observable<UsuarioPermiso | null> {
    return this.http.put<UsuarioPermiso | null>(
      `${this.base}/usuarioPermiso/usuario/${legajoId}/permiso/${permisoId}`,
      { otorgado },
    );
  }

  permisosEfectivos(legajoId: number): Observable<PermisoEfectivo> {
    return this.http.get<PermisoEfectivo>(`${this.base}/permisoEfectivo/usuario/${legajoId}`);
  }
}
