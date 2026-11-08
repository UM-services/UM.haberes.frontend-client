import { inject } from '@angular/core';
import { Router, CanActivateFn, UrlTree } from '@angular/router';
import { Observable, map } from 'rxjs';
import { AccesoDenegadoService } from '../acceso-denegado.service';
import { SIN_ACCESO_RUTA } from '../acceso.constants';
import { AuthService } from './auth.service';

/**
 * Restringe el módulo Administrador a usuarios sin facultad asignada.
 *
 * La facultad se toma de la sesión validada contra haberes-core
 * (`AuthService.ensureSession`), nunca del `localStorage` directo. Denegar
 * redirige a `sin-acceso` sin borrar la sesión.
 */
export const administradorGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const accesoDenegado = inject(AccesoDenegadoService);

  return authService.ensureSession().pipe(
    map((user): boolean | UrlTree => {
      if (user && user.facultadId == null) return true;

      accesoDenegado.reportar({
        tipo: 'modulo',
        mensaje: 'Este módulo es global y no está disponible para usuarios con facultad asignada.',
      });
      return router.parseUrl(`/${SIN_ACCESO_RUTA}`);
    }),
  ) as Observable<boolean | UrlTree>;
};
