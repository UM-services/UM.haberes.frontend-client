import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type TipoColumna = 'texto' | 'importe' | 'entero';
export type AlineacionColumna = 'izq' | 'der' | 'centro';

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
                          [class.font-mono]="columna.tipo === 'importe' || columna.tipo === 'entero'"
                          [class.tabular-nums]="columna.tipo === 'importe' || columna.tipo === 'entero'">
                        {{ columna.valor(fila) }}
                      </td>
                    }
                  </tr>
                }
                @if (seccion.subtotal) {
                  <tr class="bg-um-surface font-semibold">
                    <td [attr.colspan]="columnas.length - 1" class="text-right">
                      Subtotal {{ seccion.titulo }}
                    </td>
                    <td class="text-right font-mono tabular-nums">{{ seccion.subtotal }}</td>
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
}
