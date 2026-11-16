import { formatearImporteUm, IMPORTE_VACIO } from '@haberes/ui-layout';

/**
 * Valor monetario tal como lo entrega `haberes-report`: puede ser un número plano
 * (`1234.56`), o un texto ya formateado por el backend en es-AR (`1.234,56`,
 * `1.400.000`, `7,14%`), con una cantidad de decimales variable.
 */
export type ValorReporte = string | number | null | undefined;

/**
 * Formatea un importe de reporte con el formato institucional: dos decimales fijos,
 * separador de miles y signo `$` (`$ 1.234.567,89`, `-$ 16,50`).
 */
export function formatearImporteReporte(valor: ValorReporte): string {
  const numero = numeroDeReporte(valor);
  if (numero === null) {
    return IMPORTE_VACIO;
  }
  const texto = formatearImporteUm(Math.abs(numero), 'simbolo');
  return numero < 0 ? `-${texto}` : texto;
}

/** Formatea un porcentaje de reporte con dos decimales (`7,14%`). */
export function formatearPorcentajeReporte(valor: ValorReporte): string {
  const numero = numeroDeReporte(valor);
  return numero === null ? IMPORTE_VACIO : `${formatearImporteUm(numero)}%`;
}

/**
 * Interpreta el valor numérico de un reporte, tolerando tanto el número plano
 * del API como el texto ya formateado en es-AR por el backend.
 */
export function numeroDeReporte(valor: ValorReporte): number | null {
  if (valor === null || valor === undefined) {
    return null;
  }
  if (typeof valor === 'number') {
    return Number.isFinite(valor) ? valor : null;
  }
  const texto = valor.trim().replace(/%$/, '');
  if (!texto) {
    return null;
  }
  const numero = Number(normalizarNumero(texto));
  return Number.isFinite(numero) ? numero : null;
}

function normalizarNumero(texto: string): string {
  if (texto.includes(',')) {
    // es-AR: '.' agrupa los miles y ',' es el separador decimal.
    return texto.replace(/\./g, '').replace(',', '.');
  }
  const puntos = texto.split('.').length - 1;
  const esAgrupacion = puntos > 1 || (puntos === 1 && /^-?\d{1,3}(\.\d{3})+$/.test(texto));
  // '1.400.000' y '1.234' agrupan miles; '1234.56' es el número plano del API.
  return esAgrupacion ? texto.replace(/\./g, '') : texto;
}
