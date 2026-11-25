import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { API_URL } from './tokens';
import { AuthService } from './auth/auth.service';

/**
 * Agrega `Authorization: Bearer <token>` a las llamadas a haberes-core cuando
 * hay una sesión con token. Sólo aplica a la base de la API propia: no filtra
 * el token a backends de otros módulos (por ejemplo Contabilidad).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const apiBase = inject(API_URL, { optional: true }) || '/api/haberes';

  const token = auth.token;
  if (!token || !req.url.startsWith(apiBase)) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    }),
  );
};
