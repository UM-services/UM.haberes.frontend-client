import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
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
 * La facultad se toma de `AuthService.ensureSession()`, que revalida contra
 * haberes-core una vez por arranque y cachea el resultado. Al aplicarse junto a
 * `authGuard` no genera llamadas HTTP adicionales ni toca los servicios de las
 * pantallas.
 */
export const moduloGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const requireFacultadId = route.data['requireFacultadId'] as unknown;

  return authService.ensureSession().pipe(
    map((user) => {
      if (!user) {
        router.navigate(['/login']);
        return false;
      }

      if (typeof requireFacultadId !== 'boolean') return true;

      const tieneFacultad = user.facultadId != null;
      if (tieneFacultad === requireFacultadId) return true;

      // Misma salida que el guard del módulo Administrador: se descarta la
      // sesión para que el login vuelva a evaluar la regla del módulo.
      authService.clearSession();
      router.navigate(['/login']);
      return false;
    }),
  );
};
