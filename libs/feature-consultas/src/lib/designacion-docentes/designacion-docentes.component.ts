import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ConsultasReportService } from '../consultas-report.service';
import { ConsultaPeriodoComponent, PeriodoConsulta } from '../shared/consulta-periodo.component';
import { ColumnaTabla, ReporteTablaComponent, SeccionTabla } from '../shared/reporte-tabla.component';
import {
  DesignacionesDocenteData,
  DocenteDesignaciones,
  FilaDesignacion
} from './designacion-docentes.models';

/**
 * Designación de docentes (legacy: `frmDocDesig.frm` → `rptDocDesig`).
 *
 * Un bloque por docente con sus designaciones del período. El formulario legado además pedía
 * "Horas referencia" y "Asignación extraordinaria" para la impresión; el reporte migrado no usa
 * esos valores, por eso no se piden.
 */
@Component({
  selector: 'haberes-designacion-docentes',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, ConsultaPeriodoComponent, ReporteTablaComponent],
  templateUrl: './designacion-docentes.component.html'
})
export class DesignacionDocentesComponent {
  private readonly service = inject(ConsultasReportService);

  readonly anho = signal(new Date().getFullYear());
  readonly mes = signal(new Date().getMonth() + 1);
  readonly datos = signal<DesignacionesDocenteData | null>(null);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly descargando = signal<'pdf' | 'xlsx' | null>(null);

  readonly titulo = 'Designación de Docentes';
  readonly subtitulo = computed(() => `${this.mes()}/${this.anho()}`);

  readonly columnas: readonly ColumnaTabla<FilaDesignacion>[] = [
    { titulo: 'Facultad', valor: (fila) => fila.facultad },
    { titulo: 'Sede', valor: (fila) => fila.sede },
    { titulo: 'Espacio', valor: (fila) => fila.espacio },
    { titulo: 'Horas', valor: (fila) => fila.horas, tipo: 'entero', alineacion: 'der' },
    { titulo: 'Cargo', valor: (fila) => fila.cargo },
    { titulo: 'Designación', valor: (fila) => fila.designacion },
    { titulo: 'Horas designación', valor: (fila) => fila.horasDesignacion, tipo: 'entero', alineacion: 'der' },
    { titulo: 'Dictado', valor: (fila) => fila.dictado }
  ];

  readonly secciones = computed<readonly SeccionTabla<FilaDesignacion>[]>(() =>
    (this.datos()?.docentes ?? []).map((docente: DocenteDesignaciones) => ({
      titulo: `${docente.legajoId} - ${docente.apellidoNombre}`,
      filas: docente.filas
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
    this.service.data<DesignacionesDocenteData>('designacionesDocente', [this.anho(), this.mes()])
      .subscribe({
        next: (datos) => {
          this.datos.set(datos);
          this.cargando.set(false);
        },
        error: (error: unknown) => {
          this.error.set(this.service.mensajeDeError(error, 'No se pudieron obtener las designaciones.'));
          this.cargando.set(false);
        }
      });
  }

  descargar(formato: 'pdf' | 'xlsx') {
    this.descargando.set(formato);
    this.error.set(null);
    this.service.descargar('designacionesDocente', formato, [this.anho(), this.mes()]).subscribe({
      next: (blob) => {
        this.guardar(blob, `designaciones-docente-${this.anho()}-${this.mes()}.${formato}`);
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
