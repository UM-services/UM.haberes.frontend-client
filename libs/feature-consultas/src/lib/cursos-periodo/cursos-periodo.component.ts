import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ConsultasReportService } from '../consultas-report.service';
import { ConsultaPeriodoComponent, PeriodoConsulta } from '../shared/consulta-periodo.component';
import { ColumnaTabla, ReporteTablaComponent, SeccionTabla } from '../shared/reporte-tabla.component';
import { CursosPeriodoData, FilaCursosPeriodo } from './cursos-periodo.models';

/**
 * Cursos por período (legacy: `frmCursoPeriodo.frm` → `report/sheet/generatecursos`).
 *
 * Una fila por curso-cargo de cada legajo del período, con facultad, sede, curso, cargo, horas
 * y dictado. El XLSX es el mismo archivo del reporte existente; el PDF es nuevo.
 */
@Component({
  selector: 'haberes-cursos-periodo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, ConsultaPeriodoComponent, ReporteTablaComponent],
  templateUrl: './cursos-periodo.component.html'
})
export class CursosPeriodoComponent {
  private readonly service = inject(ConsultasReportService);

  readonly anho = signal(new Date().getFullYear());
  readonly mes = signal(new Date().getMonth() + 1);
  readonly datos = signal<CursosPeriodoData | null>(null);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly descargando = signal<'pdf' | 'xlsx' | null>(null);

  readonly titulo = 'Cursos por Período';
  readonly subtitulo = computed(() => `${this.mes()}/${this.anho()}`);

  readonly columnas: readonly ColumnaTabla<FilaCursosPeriodo>[] = [
    { titulo: 'Legajo', valor: (fila) => fila.legajoId, tipo: 'entero' },
    { titulo: 'Apellido y Nombre', valor: (fila) => fila.apellidoNombre },
    { titulo: 'Período', valor: (fila) => fila.periodo, alineacion: 'centro' },
    { titulo: 'Facultad', valor: (fila) => fila.facultad },
    { titulo: 'Sede', valor: (fila) => fila.sede },
    { titulo: 'Curso', valor: (fila) => fila.curso },
    { titulo: 'Cargo', valor: (fila) => fila.cargo },
    { titulo: 'Horas', valor: (fila) => fila.horas, tipo: 'importe', alineacion: 'der' },
    { titulo: 'Dictado', valor: (fila) => fila.dictado }
  ];

  readonly secciones = computed<readonly SeccionTabla<FilaCursosPeriodo>[]>(() => {
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
    this.service.data<CursosPeriodoData>('cursosPeriodo', [this.anho(), this.mes()]).subscribe({
      next: (datos) => {
        this.datos.set(datos);
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.error.set(this.service.mensajeDeError(error, 'No se pudieron obtener los cursos del período.'));
        this.cargando.set(false);
      }
    });
  }

  descargar(formato: 'pdf' | 'xlsx') {
    this.descargando.set(formato);
    this.error.set(null);
    this.service.descargar('cursosPeriodo', formato, [this.anho(), this.mes()]).subscribe({
      next: (blob) => {
        this.guardar(blob, `cursos-periodo-${this.anho()}-${this.mes()}.${formato}`);
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
