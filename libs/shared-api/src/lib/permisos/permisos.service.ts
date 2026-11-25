import { computed, inject, Injectable, Signal, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, finalize, map, Observable, of, shareReplay, tap } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { API_URL } from '../tokens';
import { PermisoEfectivo } from './permisos.models';
import { rutaHabilitada } from './rutas-permisos';

/**
 * Bundle de permisos efectivos del usuario en sesión. Se carga al iniciar sesión
 * (`GET /core/permisoEfectivo/usuario/{legajoId}`) y se limpia al cerrar sesión.
 *
 * Es la base del gating de UX (menú, rutas y acciones). La clave sigue la
 * convención `modulo.pantalla.accion`. Si el endpoint falla o no hay sesión, el
 * bundle queda vacío (fail-closed): los ítems/acciones que declaren permiso no
 * se muestran.
 *
 * No hay bypass de administrador en el frontend: el backend devuelve todas las
 * claves para un administrador (rol ADMIN_HABERES con comodín `*`).
 */
@Injectable({ providedIn: 'root' })
export class PermisosService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly apiBase = inject(API_URL, { optional: true }) || '/api/haberes';

  private readonly permisos = signal<ReadonlySet<string>>(new Set<string>());
  private readonly cargado = signal(false);
  private readonly pendientes = new Map<number, Observable<void>>();

  readonly permisosSignal = this.permisos.asReadonly();
  readonly cargadoSignal = this.cargado.asReadonly();

  constructor() {
    this.auth.currentUser$.subscribe((user) => {
      if (user?.legajoId) {
        this.cargar(user.legajoId).subscribe();
      } else {
        this.permisos.set(new Set<string>());
        this.cargado.set(false);
        this.pendientes.clear();
      }
    });
  }

  hasPermiso(clave: string): boolean {
    return this.permisos().has(clave);
  }

  hasPermisoSignal(clave: string): Signal<boolean> {
    return computed(() => this.permisos().has(clave));
  }

  /** true si la ruta no declara permiso o si el usuario tiene alguna de sus claves. */
  tieneAcceso(url: string): boolean {
    return rutaHabilitada(url, (clave) => this.hasPermiso(clave));
  }

  /** Carga el bundle si aún no se cargó. Pensado para guards (evita decidir antes de tiempo). */
  ensureLoaded(legajoId: number): Observable<void> {
    if (this.cargado()) {
      return of(void 0);
    }
    return this.cargar(legajoId);
  }

  /** Fuerza una recarga (p. ej. tras cambiar permisos en la pantalla de seguridad). */
  recargar(): void {
    const user = this.auth.currentUserValue;
    if (user?.legajoId) {
      this.permisos.set(new Set<string>());
      this.cargado.set(false);
      this.pendientes.delete(user.legajoId);
      this.cargar(user.legajoId).subscribe();
    }
  }

  private cargar(legajoId: number): Observable<void> {
    if (this.cargado()) {
      return of(void 0);
    }
    const pendiente = this.pendientes.get(legajoId);
    if (pendiente) {
      return pendiente;
    }

    const peticion = this.http
      .get<PermisoEfectivo>(`${this.apiBase}/core/permisoEfectivo/usuario/${legajoId}`)
      .pipe(
        tap((respuesta) => {
          this.permisos.set(new Set(respuesta?.permisos ?? []));
          this.cargado.set(true);
        }),
        map(() => void 0),
        catchError(() => {
          this.permisos.set(new Set<string>());
          this.cargado.set(true);
          return of(void 0);
        }),
        finalize(() => this.pendientes.delete(legajoId)),
        shareReplay(1),
      );

    this.pendientes.set(legajoId, peticion);
    return peticion;
  }
}
