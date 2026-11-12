import { Pipe, PipeTransform } from '@angular/core';

/** Marcador que se muestra cuando el valor es nulo, vacío o no es un número. */
export const IMPORTE_VACIO = '—';

/**
 * Cómo se muestra el importe:
 * - `numero` (default): sólo el número (`1.234.567,89`), para tablas donde el
 *   encabezado ya dice qué representa.
 * - `simbolo`: antepone `$` (`$ 1.234.567,89`), para vistas previas de campos
 *   editables donde hay que dejar claro que el dato es un importe.
 */
export type ImporteModo = 'numero' | 'simbolo';

/** Valor aceptado por {@link ImportePipe}: número o texto numérico del backend. */
export type ImporteValor = number | string | null | undefined;

const FORMATO = new Intl.NumberFormat('es-AR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useGrouping: true,
});

/**
 * Formatea un importe con el formato argentino fijo (`1.234.567,89`).
 *
 * No depende del `LOCALE_ID`: el separador de miles es `.` y el decimal `,`,
 * siempre con dos decimales, igual que los reportes del sistema legacy.
 *
 * ```ts
 * formatearImporteUm(1234567.89);              // '1.234.567,89'
 * formatearImporteUm(16.5, 'simbolo');         // '$ 16,50'
 * formatearImporteUm(null);                    // '—'
 * ```
 */
export function formatearImporteUm(valor: ImporteValor, modo: ImporteModo = 'numero'): string {
  const numero = aNumero(valor);
  if (numero == null) {
    return IMPORTE_VACIO;
  }
  const texto = FORMATO.format(numero);
  return modo === 'simbolo' ? `$ ${texto}` : texto;
}

function aNumero(valor: ImporteValor): number | null {
  if (valor === null || valor === undefined) {
    return null;
  }
  if (typeof valor === 'number') {
    return Number.isFinite(valor) ? valor : null;
  }
  const texto = valor.trim();
  if (!texto) {
    return null;
  }
  const numero = Number(texto);
  return Number.isFinite(numero) ? numero : null;
}

/**
 * Pipe del design system para mostrar importes en formato argentino.
 *
 * ```html
 * {{ categoria.basico | umImporte }}           <!-- 1.234.567,89 -->
 * {{ form.importes.doctorado | umImporte: 'simbolo' }} <!-- $ 120.000,00 -->
 * ```
 */
@Pipe({ name: 'umImporte' })
export class ImportePipe implements PipeTransform {
  transform(valor: ImporteValor, modo: ImporteModo = 'numero'): string {
    return formatearImporteUm(valor, modo);
  }
}
