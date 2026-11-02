import { HttpErrorResponse } from '@angular/common/http';

/**
 * Extrae el mensaje de negocio de una respuesta de haberes-core.
 * Spring devuelve ProblemDetail (`detail`) en los errores de negocio y texto
 * plano en algunos endpoints legacy.
 */
export function mensajeDeError(
  error: unknown,
  porDefecto = 'No se pudo completar la operación',
): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) return 'No se pudo conectar con el servidor.';

    const body: unknown = error.error;
    if (typeof body === 'string' && body.trim()) return body.trim();

    if (body && typeof body === 'object') {
      const detail = (body as { detail?: unknown }).detail;
      if (typeof detail === 'string' && detail.trim()) return detail.trim();

      const message = (body as { message?: unknown }).message;
      if (typeof message === 'string' && message.trim()) return message.trim();
    }
  }

  return porDefecto;
}
