import { inject } from '@angular/core';
import { Router, CanActivateFn, UrlTree } from '@angular/router';
import { Observable, map } from 'rxjs';
import { AccesoDenegadoService } from '../acceso-denegado.service';
import { SIN_ACCESO_RUTA } from '../acceso.constants';
import { AuthService } from './auth.service';

/**
 * Restringe el módulo Administrador a usuarios administradores.
 *
 * Regla vigente (PLANIFICACION_CAMPO_ADMINISTRADOR_USUARIO_HABERES.md, D1:
 * aditivo estricto): la sesión debe tener `facultadId == null` **y**
 * `usuario.administrador == 1`. La sesión se toma de
 * `AuthService.ensureSession()` (revalidada contra haberes-core), nunca del
 * `localStorage` directo. Denegar redirige a `sin-acceso` sin borrar la sesión.
 */
export const administradorGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const accesoDenegado = inject(AccesoDenegadoService);

  return authService.ensureSession().pipe(
    map((user): boolean | UrlTree => {
      if (user && user.facultadId == null && user.administrador === 1) return true;

      accesoDenegado.reportar({
        tipo: 'modulo',
        mensaje: 'Este módulo requiere un usuario administrador global de Haberes.',
      });
      return router.parseUrl(`/${SIN_ACCESO_RUTA}`);
    }),
  ) as Observable<boolean | UrlTree>;
};
