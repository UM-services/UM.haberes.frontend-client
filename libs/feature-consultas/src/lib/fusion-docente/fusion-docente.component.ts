import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ConsultasReportService } from '../consultas-report.service';
import { ConsultaPeriodoComponent, PeriodoConsulta } from '../shared/consulta-periodo.component';
import { ColumnaTabla, ReporteTablaComponent, SeccionTabla } from '../shared/reporte-tabla.component';
import { FilaFusion, FusionDocenteData } from './fusion-docente.models';

/**
 * Fusión por docente (legacy: `frmFusDocente.frm` → `rptFusDocente`).
 *
 * Una fila por curso fusionado del docente, con facultad, sede, categoría y básico.
 */
@Component({
  selector: 'haberes-fusion-docente',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, ConsultaPeriodoComponent, ReporteTablaComponent],
  templateUrl: './fusion-docente.component.html'
})
export class FusionDocenteComponent {
  private readonly service = inject(ConsultasReportService);

  readonly anho = signal(new Date().getFullYear());
  readonly mes = signal(new Date().getMonth() + 1);
  readonly datos = signal<FusionDocenteData | null>(null);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly descargando = signal<'pdf' | 'xlsx' | null>(null);

  readonly titulo = 'Fusión por Docente';
  readonly subtitulo = computed(() => `${this.mes()}/${this.anho()}`);

  readonly columnas: readonly ColumnaTabla<FilaFusion>[] = [
    { titulo: 'Legajo', valor: (fila) => fila.legajoId },
    { titulo: 'Apellido y Nombre', valor: (fila) => fila.apellidoNombre },
    { titulo: 'Facultad', valor: (fila) => fila.facultad },
    { titulo: 'Sede', valor: (fila) => fila.sede },
    { titulo: 'Cargo', valor: (fila) => fila.cargo },
    { titulo: 'Básico', valor: (fila) => fila.basico, tipo: 'importe', alineacion: 'der' }
  ];

  readonly secciones = computed<readonly SeccionTabla<FilaFusion>[]>(() => {
    const filas = this.datos()?.filas ?? [];
    return filas.length > 0 ? [{ filas }] : [];
  });

  cambiarPeriodo(periodo: PeriodoConsulta) {
    this.anho.set(periodo.anho);
    this.mes.set(periodo.mes);
    this.datos.set(null);
    this.error.set(null);
  }

  verDatos() {
    this.cargando.set(true);
    this.error.set(null);
    this.service.data<FusionDocenteData>('fusionDocente', [this.anho(), this.mes()]).subscribe({
      next: (datos) => {
        this.datos.set(datos);
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.error.set(this.service.mensajeDeError(error, 'No se pudieron obtener las fusiones del período.'));
        this.cargando.set(false);
      }
    });
  }

  descargar(formato: 'pdf' | 'xlsx') {
    this.descargando.set(formato);
    this.error.set(null);
    this.service.descargar('fusionDocente', formato, [this.anho(), this.mes()]).subscribe({
      next: (blob) => {
        this.guardar(blob, `fusion-docente-${this.anho()}-${this.mes()}.${formato}`);
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
