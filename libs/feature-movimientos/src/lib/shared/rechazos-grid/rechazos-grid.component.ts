import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { RechazoAcreditacion } from '../../movimientos.models';
import { descargarCsv } from '../descarga-archivo';

/**
 * Grilla de rechazos del archivo bancario.
 *
 * Santander muestra tres columnas (legajo, apellido, motivo); Otros Bancos agrega
 * importe y el subtotal acumulado, igual que `grdFaltantes` del legacy. Incluye la
 * exportación que reemplaza a `rptNoAsignado` (que no existe en el repositorio VB6).
 */
@Component({
  selector: 'lib-rechazos-grid',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule],
  template: `
    <div class="um-card p-0 overflow-hidden">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-um-border px-4 py-3">
        <div>
          <div class="um-eyebrow">Resultado</div>
          <div class="text-sm font-semibold text-um-text">
            {{ titulo }} ({{ rechazos.length }})
          </div>
        </div>
        @if (rechazos.length > 0) {
          <button type="button" class="um-btn-secondary" (click)="exportar()">Exportar CSV</button>
        }
      </div>

      @if (rechazos.length === 0) {
        <p class="px-4 py-6 text-sm text-um-muted">Sin legajos rechazados.</p>
      } @else {
        <div class="overflow-x-auto">
          <table class="um-table">
            <thead>
              <tr>
                <th>Legajo</th>
                <th>Apellido, Nombre</th>
                <th>Motivo</th>
                @if (conImporte) {
                  <th class="text-right">Importe</th>
                  <th class="text-right">Subtotal</th>
                }
              </tr>
            </thead>
            <tbody>
              @for (rechazo of rechazos; track $index) {
                <tr>
                  <td class="font-mono tabular-nums">{{ rechazo.legajoId }}</td>
                  <td>{{ rechazo.apellidoNombre }}</td>
                  <td>{{ rechazo.motivo }}</td>
                  @if (conImporte) {
                    <td class="text-right font-mono tabular-nums">{{ rechazo.importe | number: '1.2-2' }}</td>
                    <td class="text-right font-mono tabular-nums">{{ rechazo.subtotal | number: '1.2-2' }}</td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
})
export class RechazosGridComponent {
  @Input() rechazos: RechazoAcreditacion[] = [];
  @Input() conImporte = false;
  @Input() titulo = 'Legajos rechazados';
  @Input() nombreArchivo = 'no-asignados';

  exportar(): void {
    const filas: string[][] = [['Legajo', 'Apellido, Nombre', 'Motivo', 'Importe', 'Subtotal']];
    for (const rechazo of this.rechazos) {
      filas.push([
        String(rechazo.legajoId),
        rechazo.apellidoNombre,
        rechazo.motivo,
        rechazo.importe == null ? '' : Number(rechazo.importe).toFixed(2),
        rechazo.subtotal == null ? '' : Number(rechazo.subtotal).toFixed(2),
      ]);
    }
    descargarCsv(filas, `${this.nombreArchivo}.csv`);
  }
}
