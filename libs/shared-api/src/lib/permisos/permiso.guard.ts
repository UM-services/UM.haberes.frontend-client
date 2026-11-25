import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { map, Observable } from 'rxjs';
import { AccesoDenegadoService } from '../acceso-denegado.service';
import { SIN_ACCESO_RUTA } from '../acceso.constants';
import { AuthService } from '../auth/auth.service';
import { PermisosService } from './permisos.service';
import { permisoParaUrl } from './rutas-permisos';

/**
 * Guard por claves explícitas (OR entre ellas):
 *
 *   canActivate: [authGuard, permisoGuard('seguridad.permisos.administrar')]
 */
export const permisoGuard = (claves: string | string[]): CanActivateFn => (_route, state) =>
  evaluar(Array.isArray(claves) ? claves : [claves], state.url);

/**
 * Guard que deduce el permiso de la URL con el mapa `rutas-permisos`.
 * Es el que se usa en las rutas de Novedades, Liquidación y Administrador:
 * no hace falta repetir la clave en cada `data`.
 */
export const permisoRutaGuard: CanActivateFn = (_route, state) => {
  const claves = permisoParaUrl(state.url);
  if (!claves || claves.length === 0) {
    return true;
  }
  return evaluar(claves, state.url);
};

function evaluar(claves: string[], url: string): boolean | UrlTree | Observable<boolean | UrlTree> {
  const auth = inject(AuthService);
  const permisos = inject(PermisosService);
  const router = inject(Router);
  const accesoDenegado = inject(AccesoDenegadoService);

  if (claves.some((clave) => permisos.hasPermiso(clave))) {
    return true;
  }

  const user = auth.currentUserValue;
  if (!user) {
    return router.parseUrl(`/login?returnUrl=${encodeURIComponent(url)}`);
  }

  const denegar = (): UrlTree => {
    accesoDenegado.reportar({
      tipo: 'permiso',
      mensaje: 'No tenés permiso para acceder a esta pantalla.',
      clave: claves.join(' | '),
      origen: url,
    });
    return router.parseUrl(`/${SIN_ACCESO_RUTA}`);
  };

  return permisos
    .ensureLoaded(user.legajoId)
    .pipe(map(() => (claves.some((clave) => permisos.hasPermiso(clave)) ? true : denegar())));
}
