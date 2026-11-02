import { HttpErrorResponse } from '@angular/common/http';
import { describe, expect, it } from 'vitest';
import { mensajeDeError } from './api-error';

describe('mensajeDeError', () => {
  it('usa el detail del ProblemDetail', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: { type: 'about:blank', detail: 'ERROR: Clave NO Válida' },
    });

    expect(mensajeDeError(error)).toBe('ERROR: Clave NO Válida');
  });

  it('acepta un cuerpo en texto plano', () => {
    const error = new HttpErrorResponse({ status: 400, error: 'ERROR: Datos inválidos' });

    expect(mensajeDeError(error)).toBe('ERROR: Datos inválidos');
  });

  it('distingue la caída de conexión', () => {
    const error = new HttpErrorResponse({ status: 0 });

    expect(mensajeDeError(error)).toContain('conectar con el servidor');
  });

  it('cae al mensaje por defecto con errores desconocidos', () => {
    expect(mensajeDeError(new Error('boom'), 'Fallback')).toBe('Fallback');
  });
});
