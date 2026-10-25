import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ConsultasReportService } from '../consultas-report.service';
import { ConsultaPeriodoComponent, PeriodoConsulta } from '../shared/consulta-periodo.component';
import { ColumnaTabla, ReporteTablaComponent, SeccionTabla } from '../shared/reporte-tabla.component';
import { FilaLibroSueldos, LibroSueldosData } from './libro-sueldos.models';

/**
 * Libro de sueldos (legacy: `frmLibroSueldo.frm` → `rptLibroSueldo`).
 *
 * Tabla, PDF propio y XLSX desde el mismo contenido. Se agrega la descarga del ZIP del Libro de
 * Sueldos Digital de AFIP para los legajos visibles, que genera haberes-core.
 */
@Component({
  selector: 'haberes-libro-sueldos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, ConsultaPeriodoComponent, ReporteTablaComponent],
  templateUrl: './libro-sueldos.component.html'
})
export class LibroSueldosComponent {
  private readonly service = inject(ConsultasReportService);

  readonly anho = signal(new Date().getFullYear());
  readonly mes = signal(new Date().getMonth() + 1);
  readonly datos = signal<LibroSueldosData | null>(null);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly descargando = signal<'pdf' | 'xlsx' | 'lsd' | null>(null);

  readonly titulo = 'Libro de Sueldos';
  readonly subtitulo = computed(() => `${this.mes()}/${this.anho()}`);
  readonly hayDatos = computed(() => (this.datos()?.filas.length ?? 0) > 0);

  readonly columnas: readonly ColumnaTabla<FilaLibroSueldos>[] = [
    { titulo: 'Legajo', valor: (fila) => fila.legajoId, tipo: 'entero' },
    { titulo: 'Apellido y Nombre', valor: (fila) => fila.apellidoNombre },
    { titulo: 'CUIL', valor: (fila) => fila.cuil, tipo: 'entero' },
    { titulo: 'Dependencia', valor: (fila) => fila.dependencia },
    { titulo: 'Remunerativo', valor: (fila) => fila.remunerativo, tipo: 'importe', alineacion: 'der' },
    { titulo: 'No remunerativo', valor: (fila) => fila.noRemunerativo, tipo: 'importe', alineacion: 'der' },
    { titulo: 'Deducciones', valor: (fila) => fila.deducciones, tipo: 'importe', alineacion: 'der' },
    { titulo: 'Neto', valor: (fila) => fila.neto, tipo: 'importe', alineacion: 'der' }
  ];

  readonly secciones = computed<readonly SeccionTabla<FilaLibroSueldos>[]>(() => {
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
    this.service.data<LibroSueldosData>('libroSueldos', [this.anho(), this.mes()]).subscribe({
      next: (datos) => {
        this.datos.set(datos);
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.error.set(this.service.mensajeDeError(error, 'No se pudo obtener el libro de sueldos del período.'));
        this.cargando.set(false);
      }
    });
  }

  descargar(formato: 'pdf' | 'xlsx') {
    this.descargando.set(formato);
    this.error.set(null);
    this.service.descargar('libroSueldos', formato, [this.anho(), this.mes()]).subscribe({
      next: (blob) => {
        this.guardar(blob, `libro-sueldos-${this.anho()}-${this.mes()}.${formato}`);
        this.descargando.set(null);
      },
      error: (error: unknown) => {
        this.error.set(this.service.mensajeDeError(error, `No se pudo generar el ${formato.toUpperCase()}.`));
        this.descargando.set(null);
      }
    });
  }

  descargarLsd() {
    const legajoIds = (this.datos()?.filas ?? [])
      .map((fila) => Number(fila.legajoId))
      .filter((legajoId) => Number.isFinite(legajoId));
    if (legajoIds.length === 0) {
      return;
    }
    this.descargando.set('lsd');
    this.error.set(null);
    this.service.descargarLibroSueldosDigital(this.anho(), this.mes(), legajoIds).subscribe({
      next: (blob) => {
        this.guardar(blob, `LSD-${this.anho()}-${this.mes()}.zip`);
        this.descargando.set(null);
      },
      error: (error: unknown) => {
        this.error.set(this.service.mensajeDeError(error, 'No se pudo generar el Libro de Sueldos Digital.'));
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
