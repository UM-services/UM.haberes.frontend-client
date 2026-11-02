import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ConsultasReportService } from '../consultas-report.service';
import { ConsultaPeriodoComponent, PeriodoConsulta } from '../shared/consulta-periodo.component';
import { ColumnaTabla, ReporteTablaComponent, SeccionTabla } from '../shared/reporte-tabla.component';
import { CursosDocenteData, DocenteCursos, FilaCursoDocente } from './cursos-docente.models';

/**
 * Cursos por docente (legacy: `frmCurDocente.frm` → `rptCurDocente`).
 *
 * Un bloque por docente con los cursos cargo del período, su categoría, básico y dictado.
 */
@Component({
  selector: 'haberes-cursos-docente',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, ConsultaPeriodoComponent, ReporteTablaComponent],
  templateUrl: './cursos-docente.component.html'
})
export class CursosDocenteComponent {
  private readonly service = inject(ConsultasReportService);

  readonly anho = signal(new Date().getFullYear());
  readonly mes = signal(new Date().getMonth() + 1);
  readonly datos = signal<CursosDocenteData | null>(null);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly descargando = signal<'pdf' | 'xlsx' | null>(null);

  readonly titulo = 'Cursos por Docente';
  readonly subtitulo = computed(() => `${this.mes()}/${this.anho()}`);

  readonly columnas: readonly ColumnaTabla<FilaCursoDocente>[] = [
    { titulo: 'Facultad', valor: (fila) => fila.facultad },
    { titulo: 'Sede', valor: (fila) => fila.sede },
    { titulo: 'Espacio', valor: (fila) => fila.espacio },
    { titulo: 'Horas', valor: (fila) => fila.horas, tipo: 'entero', alineacion: 'der' },
    { titulo: 'Cargo', valor: (fila) => fila.cargo },
    { titulo: 'Básico', valor: (fila) => fila.basico, tipo: 'importe', alineacion: 'der' },
    { titulo: 'Anual', valor: (fila) => fila.anual, alineacion: 'centro' },
    { titulo: 'Semestre 1', valor: (fila) => fila.semestre1, alineacion: 'centro' },
    { titulo: 'Semestre 2', valor: (fila) => fila.semestre2, alineacion: 'centro' }
  ];

  readonly secciones = computed<readonly SeccionTabla<FilaCursoDocente>[]>(() =>
    (this.datos()?.docentes ?? []).map((docente: DocenteCursos) => ({
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
    this.service.data<CursosDocenteData>('cursoDocente', [this.anho(), this.mes()]).subscribe({
      next: (datos) => {
        this.datos.set(datos);
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.error.set(this.service.mensajeDeError(error, 'No se pudieron obtener los cursos por docente.'));
        this.cargando.set(false);
      }
    });
  }

  descargar(formato: 'pdf' | 'xlsx') {
    this.descargando.set(formato);
    this.error.set(null);
    this.service.descargar('cursoDocente', formato, [this.anho(), this.mes()]).subscribe({
      next: (blob) => {
        this.guardar(blob, `cursos-docente-${this.anho()}-${this.mes()}.${formato}`);
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
