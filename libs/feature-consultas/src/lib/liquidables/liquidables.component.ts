import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ConsultasReportService } from '../consultas-report.service';
import { ColumnaTabla, ReporteTablaComponent, SeccionTabla } from '../shared/reporte-tabla.component';
import { FilaLiquidables, LiquidablesData } from './liquidables.models';

/**
 * Planilla de liquidables (legacy: `frmLiquidables.frm` → `generateLiquidables`).
 *
 * No lleva filtros de período: la planilla sale del flag de liquidación vigente al momento de
 * la consulta. Al abrir la pantalla se consulta una vez y el botón permite actualizar.
 */
@Component({
  selector: 'haberes-liquidables',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, ReporteTablaComponent],
  templateUrl: './liquidables.component.html'
})
export class LiquidablesComponent implements OnInit {
  private readonly service = inject(ConsultasReportService);

  readonly datos = signal<LiquidablesData | null>(null);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly descargando = signal<'pdf' | 'xlsx' | null>(null);

  readonly titulo = 'Planilla de Liquidables';
  readonly subtitulo = computed(() => `${this.datos()?.filas.length ?? 0} legajos`);

  readonly columnas: readonly ColumnaTabla<FilaLiquidables>[] = [
    { titulo: 'Legajo', valor: (fila) => fila.legajoId, tipo: 'entero' },
    { titulo: 'Apellido y Nombre', valor: (fila) => fila.apellidoNombre },
    { titulo: 'Estado', valor: (fila) => fila.estado, tipo: 'entero', alineacion: 'der' },
    { titulo: 'Dependencia', valor: (fila) => fila.dependenciaNombre }
  ];

  readonly secciones = computed<readonly SeccionTabla<FilaLiquidables>[]>(() => {
    const filas = this.datos()?.filas ?? [];
    return filas.length > 0 ? [{ filas }] : [];
  });

  ngOnInit() {
    this.verDatos();
  }

  verDatos() {
    this.cargando.set(true);
    this.error.set(null);
    this.service.data<LiquidablesData>('liquidables', []).subscribe({
      next: (datos) => {
        this.datos.set(datos);
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.error.set(this.service.mensajeDeError(error, 'No se pudo obtener la planilla de liquidables.'));
        this.cargando.set(false);
      }
    });
  }

  descargar(formato: 'pdf' | 'xlsx') {
    this.descargando.set(formato);
    this.error.set(null);
    this.service.descargar('liquidables', formato, []).subscribe({
      next: (blob) => {
        this.guardar(blob, `liquidables.${formato}`);
        this.descargando.set(null);
      },
      error: (error: unknown) => {
        this.error.set(this.service.mensajeDeError(error, `No se pudo generar el ${formato.toUpperCase()}.`));
        this.descargando.set(null);
      }
    });
  }

  private guardar(blob: Blob, nombre: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nombre;
    document.body.appendChild(link);
    link.click();
    window.URL.revokeObjectURL(url);
    link.remove();
  }
}
