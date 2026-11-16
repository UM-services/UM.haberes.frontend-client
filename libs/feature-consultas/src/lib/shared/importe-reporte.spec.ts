import { IMPORTE_VACIO } from '@haberes/ui-layout';

import {
  formatearImporteReporte,
  formatearPorcentajeReporte,
  numeroDeReporte
} from './importe-reporte';

describe('importe-reporte', () => {
  it('formatea importes con $ y dos decimales fijos', () => {
    expect(formatearImporteReporte('1400000')).toBe('$ 1.400.000,00');
    expect(formatearImporteReporte('1.234.567,8')).toBe('$ 1.234.567,80');
    expect(formatearImporteReporte('1234567.89')).toBe('$ 1.234.567,89');
    expect(formatearImporteReporte(16.5)).toBe('$ 16,50');
  });

  it('antepone el signo al importe cuando es negativo', () => {
    expect(formatearImporteReporte('-16,5')).toBe('-$ 16,50');
    expect(formatearImporteReporte('-16.5')).toBe('-$ 16,50');
  });

  it('muestra el marcador de vacío cuando no hay importe válido', () => {
    expect(formatearImporteReporte(null)).toBe(IMPORTE_VACIO);
    expect(formatearImporteReporte(undefined)).toBe(IMPORTE_VACIO);
    expect(formatearImporteReporte('')).toBe(IMPORTE_VACIO);
    expect(formatearImporteReporte('sin datos')).toBe(IMPORTE_VACIO);
  });

  it('formatea porcentajes con dos decimales', () => {
    expect(formatearPorcentajeReporte('7,14%')).toBe('7,14%');
    expect(formatearPorcentajeReporte('12,345%')).toBe('12,35%');
    expect(formatearPorcentajeReporte('1.234,5%')).toBe('1.234,50%');
    expect(formatearPorcentajeReporte('-5')).toBe('-5,00%');
    expect(formatearPorcentajeReporte(null)).toBe(IMPORTE_VACIO);
  });

  it('interpreta agrupación de miles y separador decimal argentinos', () => {
    expect(numeroDeReporte('1.400.000')).toBe(1400000);
    expect(numeroDeReporte('1.234')).toBe(1234);
    expect(numeroDeReporte('1.234,56')).toBe(1234.56);
    expect(numeroDeReporte('1234.56')).toBe(1234.56);
    expect(numeroDeReporte('16.5')).toBe(16.5);
    expect(numeroDeReporte('-1.234,5')).toBe(-1234.5);
  });
});
