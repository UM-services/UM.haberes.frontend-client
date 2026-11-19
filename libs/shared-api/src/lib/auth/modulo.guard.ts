import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Observable, map } from 'rxjs';
import { AccesoDenegadoService } from '../acceso-denegado.service';
import { SIN_ACCESO_RUTA } from '../acceso.constants';
import { AuthService } from './auth.service';

/**
 * Restringe una ruta según la asignación de facultad de la sesión.
 *
 * Lee `data.requireFacultadId` de la ruta, con la misma semántica que el login:
 * - `true`  → sólo usuarios con facultad asignada (`facultadId != null`). Es
 *   el caso del módulo Novedades, que trabaja siempre dentro de una facultad.
 * - `false` → sólo usuarios sin facultad asignada (`facultadId == null`). Es el
 *   caso de los módulos globales Liquidación y Administrador.
 * - ausente → no agrega restricción; sólo exige sesión (igual que `authGuard`).
 *
 * Denegar ya NO destruye la sesión: se explica la regla en `sin-acceso` y el
 * usuario puede volver o cerrar sesión por decisión propia.
 */
export const moduloGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const accesoDenegado = inject(AccesoDenegadoService);
  const requireFacultadId = route.data['requireFacultadId'] as unknown;

  return authService.ensureSession().pipe(
    map((user): boolean | UrlTree => {
      if (!user) {
        void router.navigate(['/login']);
        return false;
      }

      if (typeof requireFacultadId !== 'boolean') return true;

      const tieneFacultad = user.facultadId != null;
      if (tieneFacultad === requireFacultadId) return true;

      accesoDenegado.reportar({
        tipo: 'modulo',
        mensaje: requireFacultadId
          ? 'Este módulo requiere un usuario con facultad asignada.'
          : 'Este módulo es global y no está disponible para usuarios con facultad asignada.',
      });
      return router.parseUrl(`/${SIN_ACCESO_RUTA}`);
    }),
  ) as Observable<boolean | UrlTree>;
};
