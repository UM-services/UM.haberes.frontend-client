import { describe, expect, it } from 'vitest';
import { IMPORTE_VACIO, ImportePipe, formatearImporteUm } from './importe.pipe';

describe('formatearImporteUm', () => {
  it('formatea con separador de miles y dos decimales argentinos', () => {
    expect(formatearImporteUm(1234567.89)).toBe('1.234.567,89');
    expect(formatearImporteUm(120000)).toBe('120.000,00');
    expect(formatearImporteUm(16.5)).toBe('16,50');
    expect(formatearImporteUm(0)).toBe('0,00');
  });

  it('antepone el símbolo cuando el modo es simbolo', () => {
    expect(formatearImporteUm(1234567.89, 'simbolo')).toBe('$ 1.234.567,89');
    expect(formatearImporteUm(0, 'simbolo')).toBe('$ 0,00');
  });

  it('acepta números serializados como texto', () => {
    expect(formatearImporteUm('1234567.89')).toBe('1.234.567,89');
    expect(formatearImporteUm('-16.5')).toBe('-16,50');
  });

  it('devuelve el marcador para valores vacíos o inválidos', () => {
    expect(formatearImporteUm(null)).toBe(IMPORTE_VACIO);
    expect(formatearImporteUm(undefined)).toBe(IMPORTE_VACIO);
    expect(formatearImporteUm('')).toBe(IMPORTE_VACIO);
    expect(formatearImporteUm('no es un importe')).toBe(IMPORTE_VACIO);
    expect(formatearImporteUm(Number.NaN)).toBe(IMPORTE_VACIO);
  });
});

describe('ImportePipe', () => {
  it('delega en el formateador compartido', () => {
    const pipe = new ImportePipe();
    expect(pipe.transform(1234567.89)).toBe('1.234.567,89');
    expect(pipe.transform(120000, 'simbolo')).toBe('$ 120.000,00');
    expect(pipe.transform(undefined)).toBe(IMPORTE_VACIO);
  });
});
