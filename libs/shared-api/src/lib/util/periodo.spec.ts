import { describe, expect, it } from 'vitest';
import { periodoTexto } from './periodo';

describe('periodoTexto', () => {
  it('convierte yyyymm a MM/AAAA', () => {
    expect(periodoTexto(202610)).toBe('10/2026');
    expect(periodoTexto(202601)).toBe('01/2026');
  });

  it('devuelve un guion cuando no hay período', () => {
    expect(periodoTexto(null)).toBe('—');
    expect(periodoTexto(undefined)).toBe('—');
    expect(periodoTexto(0)).toBe('—');
  });
});
