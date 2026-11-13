import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Observable, map } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * Exige que el Simulador Novedades tenga una facultad elegida.
 *
 * Las pantallas replican el módulo Novedades, así que no deben montarse con
 * `facultadId == null` (eso las haría trabajar en modo global y mostrar datos de
 * todas las facultades, que no es lo que ve un usuario de facultad). Si no hay
 * selección, se vuelve al directorio (`/inicio`), que tiene el prompt y el
 * selector de facultad; la sesión del administrador se mantiene intacta.
 */
export const facultadSimuladaGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.ensureSession().pipe(
    map((user): boolean | UrlTree => {
      if (!user) {
        void router.navigate(['/login']);
        return false;
      }

      return authService.simulandoFacultad() ? true : router.parseUrl('/inicio');
    }),
  ) as Observable<boolean | UrlTree>;
};
