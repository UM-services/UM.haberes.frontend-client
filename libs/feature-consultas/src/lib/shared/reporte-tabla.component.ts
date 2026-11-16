import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { formatearImporteReporte, formatearPorcentajeReporte } from './importe-reporte';

/**
 * Cómo se presenta la celda:
 * - `texto`: tal cual lo entrega el reporte.
 * - `entero`: cifra sin decimales (horas, cantidades), en monoespaciada.
 * - `importe`: cifra numérica sin símbolo de moneda, en monoespaciada.
 * - `moneda`: importe con `$` y dos decimales fijos (`$ 1.234,56`).
 * - `porcentaje`: dos decimales y signo `%` (`7,14%`).
 */
export type TipoColumna = 'texto' | 'importe' | 'entero' | 'moneda' | 'porcentaje';
export type AlineacionColumna = 'izq' | 'der' | 'centro';

const TIPOS_NUMERICOS: readonly TipoColumna[] = ['importe', 'entero', 'moneda', 'porcentaje'];

/**
 * Columna tipada contra el DTO del reporte: cada pantalla declara cómo leer
 * el valor de su propia fila. La tabla no conoce ningún reporte.
 */
export interface ColumnaTabla<T> {
  titulo: string;
  valor: (fila: T) => string;
  tipo?: TipoColumna;
  alineacion?: AlineacionColumna;
}

export interface SeccionTabla<T> {
  titulo?: string;
  filas: readonly T[];
  subtotal?: string;
}

/**
 * Tabla presentacional compartida por las consultas: recibe columnas y secciones
 * ya tipadas y sólo se ocupa del markup, el estado vacío y la alineación de los
 * importes. No interpreta datos ni conoce el backend.
 */
@Component({
  selector: 'haberes-reporte-tabla',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule],
  template: `
    <div class="um-card p-0 overflow-hidden">
      <div class="flex items-center justify-between gap-4 border-b border-um-border bg-um-surface px-4 py-3">
        <div class="flex items-center gap-2">
          <span class="h-2 w-2 rounded-full bg-um-primary"></span>
          <h3 class="text-xs font-bold uppercase tracking-wider text-um-ink">{{ titulo }}</h3>
        </div>
        @if (subtitulo) {
          <span class="text-[11px] font-semibold uppercase tracking-wider text-um-muted">{{ subtitulo }}</span>
        }
      </div>

      @if (cargando) {
        <p class="px-4 py-6 text-sm text-um-muted">Consultando datos del período...</p>
      } @else if (!hayDatos()) {
        <p class="px-4 py-6 text-sm text-um-muted">Sin datos para el período.</p>
      } @else {
        @for (seccion of secciones; track $index) {
          @if (seccion.titulo) {
            <div class="border-b border-um-border bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-um-primary">
              {{ seccion.titulo }}
            </div>
          }
          <div class="overflow-x-auto">
            <table class="um-table">
              <thead>
                <tr>
                  @for (columna of columnas; track columna.titulo) {
                    <th [class.text-right]="columna.alineacion === 'der'"
                        [class.text-center]="columna.alineacion === 'centro'">
                      {{ columna.titulo }}
                    </th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (fila of seccion.filas; track $index) {
                  <tr>
                    @for (columna of columnas; track columna.titulo) {
                      <td [class.text-right]="columna.alineacion === 'der'"
                          [class.text-center]="columna.alineacion === 'centro'"
                          [class.font-mono]="esNumerica(columna)"
                          [class.tabular-nums]="esNumerica(columna)">
                        {{ valorCelda(columna, fila) }}
                      </td>
                    }
                  </tr>
                }
                @if (seccion.subtotal) {
                  <tr class="bg-um-surface font-semibold">
                    <td [attr.colspan]="columnas.length - 1" class="text-right">
                      Subtotal {{ seccion.titulo }}
                    </td>
                    <td class="text-right font-mono tabular-nums">{{ subtotalCelda(seccion) }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      }
    </div>
  `
})
export class ReporteTablaComponent<T> {
  @Input({ required: true }) columnas: readonly ColumnaTabla<T>[] = [];
  @Input({ required: true }) secciones: readonly SeccionTabla<T>[] = [];
  @Input() titulo = '';
  @Input() subtitulo = '';
  @Input() cargando = false;

  hayDatos(): boolean {
    return this.secciones.some((seccion) => seccion.filas.length > 0);
  }

  esNumerica(columna: ColumnaTabla<T>): boolean {
    return TIPOS_NUMERICOS.includes(columna.tipo ?? 'texto');
  }

  /** Valor de la celda ya presentado según el tipo de columna. */
  valorCelda(columna: ColumnaTabla<T>, fila: T): string {
    const valor = columna.valor(fila);
    if (columna.tipo === 'moneda') {
      return formatearImporteReporte(valor);
    }
    if (columna.tipo === 'porcentaje') {
      return formatearPorcentajeReporte(valor);
    }
    return valor;
  }

  /** El subtotal sigue el formato de la última columna (la que totaliza). */
  subtotalCelda(seccion: SeccionTabla<T>): string {
    const subtotal = seccion.subtotal ?? '';
    const ultima = this.columnas[this.columnas.length - 1];
    return ultima?.tipo === 'moneda' ? formatearImporteReporte(subtotal) : subtotal;
  }
}
