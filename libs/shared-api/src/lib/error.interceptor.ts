import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AccesoDenegadoService } from './acceso-denegado.service';
import { AuthService } from './auth/auth.service';

/** El login y la validación de credenciales no deben destruir una sesión existente. */
const RUTAS_EXCLUIDAS = ['/login', '/isuservalid'];

function esRutaExcluida(url: string): boolean {
  const limpia = url.split('?')[0].replace(/\/+$/, '');
  return RUTAS_EXCLUIDAS.some(ruta => limpia.includes(ruta));
}

function mensajeDelCuerpo(error: HttpErrorResponse, fallback: string): string {
  const body: unknown = error.error;
  if (typeof body === 'string' && body.trim()) {
    return body.trim();
  }
  if (body && typeof body === 'object') {
    const { detail, message, error: titulo } = body as {
      detail?: unknown;
      message?: unknown;
      error?: unknown;
    };
    for (const valor of [detail, message, titulo]) {
      if (typeof valor === 'string' && valor.trim()) {
        return valor.trim();
      }
    }
  }
  return fallback;
}

/**
 * 401 → identidad inválida/expirada: cierra la sesión y vuelve al login.
 * 403 → el usuario está autenticado pero no autorizado: NO se toca la sesión.
 * Se publica el detalle y la pantalla lo explica (banner o `sin-acceso`).
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const accesoDenegado = inject(AccesoDenegadoService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const enLogin = esRutaExcluida(req.url);

      if (error.status === 401 && !enLogin) {
        const returnUrl = router.url;
        authService.clearSession();
        if (!returnUrl.startsWith('/login')) {
          void router.navigate(['/login'], {
            queryParams: { returnUrl, motivo: 'sesion-expirada' },
          });
        }
      }

      if (error.status === 403 && !enLogin) {
        accesoDenegado.reportar({
          tipo: 'permiso',
          mensaje: mensajeDelCuerpo(
            error,
            'No tenés autorización para realizar esta acción.',
          ),
          origen: req.url,
        });
      }

      return throwError(() => error);
    }),
  );
};
