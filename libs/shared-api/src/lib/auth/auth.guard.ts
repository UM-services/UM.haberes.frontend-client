import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';
import { map } from 'rxjs';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // La sesión se valida contra haberes-core una vez por arranque: si el
  // almacenamiento local quedó viejo o manipulado, no alcanza para entrar.
  return authService.ensureSession().pipe(
    map((user) => {
      if (user) return true;
      router.navigate(['/login']);
      return false;
    }),
  );
};
