import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';
import { map } from 'rxjs';

/**
 * Restringe el módulo Administrador a usuarios sin facultad asignada.
 *
 * La facultad se toma de la sesión validada contra haberes-core
 * (`AuthService.ensureSession`), nunca del `localStorage` directo.
 */
export const administradorGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.ensureSession().pipe(
    map((user) => {
      if (user && user.facultadId == null) return true;

      authService.clearSession();
      router.navigate(['/login']);
      return false;
    }),
  );
};
