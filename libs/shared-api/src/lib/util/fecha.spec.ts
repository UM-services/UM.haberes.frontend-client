import { describe, expect, it } from 'vitest';
import { fechaInput, fechaPayload } from './fecha';

describe('fechaInput', () => {
  it('recorta la fecha ISO al valor del input', () => {
    expect(fechaInput('2026-11-30T00:00:00-03:00')).toBe('2026-11-30');
  });

  it('devuelve vacío cuando no hay fecha', () => {
    expect(fechaInput(null)).toBe('');
    expect(fechaInput(undefined)).toBe('');
  });
});

describe('fechaPayload', () => {
  it('conserva el horario y el offset del backend', () => {
    expect(fechaPayload('2026-10-31T00:00:00-03:00', '2026-11-30')).toBe(
      '2026-11-30T00:00:00-0300',
    );
    expect(fechaPayload('2026-10-31T12:30:45+00:00', '2026-11-01')).toBe(
      '2026-11-01T12:30:45+0000',
    );
  });

  it('conserva el sufijo Z', () => {
    expect(fechaPayload('2026-10-31T00:00:00Z', '2026-11-30')).toBe('2026-11-30T00:00:00Z');
  });

  it('usa medianoche UTC cuando la fecha es nueva', () => {
    expect(fechaPayload(null, '2026-11-01')).toBe('2026-11-01T00:00:00+0000');
  });

  it('devuelve vacío sin fecha', () => {
    expect(fechaPayload('2026-10-31T00:00:00-03:00', '')).toBe('');
  });
});
