import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ConsultasReportService } from '../consultas-report.service';
import { ConsultaPeriodoComponent, PeriodoConsulta } from '../shared/consulta-periodo.component';
import { ColumnaTabla, ReporteTablaComponent, SeccionTabla } from '../shared/reporte-tabla.component';
import { FilaTotales, GrupoTotales, TotalesGeneralesData } from './totales-generales.models';

/**
 * Totales generales del período (legacy: `frmRpTotGeneral.frm` → `rptTotalGeneral`).
 *
 * Muestra los mismos grupos y subtotales que el PDF (Remunerativo, No Remunerativo,
 * Deducción y Total) y permite descargar el PDF y el XLSX del mismo contenido.
 */
@Component({
  selector: 'haberes-totales-generales',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, ConsultaPeriodoComponent, ReporteTablaComponent],
  templateUrl: './totales-generales.component.html'
})
export class TotalesGeneralesComponent {
  private readonly service = inject(ConsultasReportService);

  readonly anho = signal(new Date().getFullYear());
  readonly mes = signal(new Date().getMonth() + 1);
  readonly datos = signal<TotalesGeneralesData | null>(null);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly descargando = signal<'pdf' | 'xlsx' | null>(null);

  readonly titulo = 'Totales Generales';
  readonly subtitulo = computed(() => `${this.mes()}/${this.anho()}`);

  readonly columnas: readonly ColumnaTabla<FilaTotales>[] = [
    { titulo: 'Código', valor: (fila) => fila.codigoId },
    { titulo: 'Descripción', valor: (fila) => fila.nombre },
    { titulo: 'Total', valor: (fila) => fila.total, tipo: 'importe', alineacion: 'der' }
  ];

  readonly secciones = computed<readonly SeccionTabla<FilaTotales>[]>(() =>
    (this.datos()?.grupos ?? []).map((grupo: GrupoTotales) => ({
      titulo: grupo.nombre,
      filas: grupo.filas,
      subtotal: grupo.subtotal
    }))
  );

  cambiarPeriodo(periodo: PeriodoConsulta) {
    this.anho.set(periodo.anho);
    this.mes.set(periodo.mes);
    this.datos.set(null);
    this.error.set(null);
  }

  verDatos() {
    this.cargando.set(true);
    this.error.set(null);
    this.service.data<TotalesGeneralesData>('totalesGenerales', [this.anho(), this.mes()]).subscribe({
      next: (datos) => {
        this.datos.set(datos);
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.error.set(this.service.mensajeDeError(error, 'No se pudieron obtener los totales del período.'));
        this.cargando.set(false);
      }
    });
  }

  descargar(formato: 'pdf' | 'xlsx') {
    this.descargando.set(formato);
    this.error.set(null);
    this.service.descargar('totalesGenerales', formato, [this.anho(), this.mes()]).subscribe({
      next: (blob) => {
        this.guardar(blob, `totales-generales-${this.anho()}-${this.mes()}.${formato}`);
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
