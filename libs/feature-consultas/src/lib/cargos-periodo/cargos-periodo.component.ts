import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ConsultasReportService } from '../consultas-report.service';
import { ConsultaPeriodoComponent, PeriodoConsulta } from '../shared/consulta-periodo.component';
import { ColumnaTabla, ReporteTablaComponent, SeccionTabla } from '../shared/reporte-tabla.component';
import { CargosPeriodoData, FilaCargosPeriodo } from './cargos-periodo.models';

/**
 * Cargos por período (legacy: `frmCargoPeriodo.frm` → `generatecargos`).
 *
 * Lista los cargos activos del período por legajo con su dependencia y categoría. Es sólo
 * lectura: no borra cargos no liquidados como hacía la planilla original.
 */
@Component({
  selector: 'haberes-cargos-periodo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, ConsultaPeriodoComponent, ReporteTablaComponent],
  templateUrl: './cargos-periodo.component.html'
})
export class CargosPeriodoComponent {
  private readonly service = inject(ConsultasReportService);

  readonly anho = signal(new Date().getFullYear());
  readonly mes = signal(new Date().getMonth() + 1);
  readonly datos = signal<CargosPeriodoData | null>(null);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly descargando = signal<'pdf' | 'xlsx' | null>(null);

  readonly titulo = 'Cargos por Período';
  readonly subtitulo = computed(() => `${this.mes()}/${this.anho()}`);

  readonly columnas: readonly ColumnaTabla<FilaCargosPeriodo>[] = [
    { titulo: 'Legajo', valor: (fila) => fila.legajoId, tipo: 'entero' },
    { titulo: 'Apellido y Nombre', valor: (fila) => fila.apellidoNombre },
    { titulo: 'Período', valor: (fila) => fila.periodo, alineacion: 'centro' },
    { titulo: 'Dependencia', valor: (fila) => fila.dependenciaNombre },
    { titulo: 'Categoría', valor: (fila) => fila.categoriaNombre }
  ];

  readonly secciones = computed<readonly SeccionTabla<FilaCargosPeriodo>[]>(() => {
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
    this.service.data<CargosPeriodoData>('cargosPeriodo', [this.anho(), this.mes()]).subscribe({
      next: (datos) => {
        this.datos.set(datos);
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.error.set(this.service.mensajeDeError(error, 'No se pudieron obtener los cargos del período.'));
        this.cargando.set(false);
      }
    });
  }

  descargar(formato: 'pdf' | 'xlsx') {
    this.descargando.set(formato);
    this.error.set(null);
    this.service.descargar('cargosPeriodo', formato, [this.anho(), this.mes()]).subscribe({
      next: (blob) => {
        this.guardar(blob, `cargos-periodo-${this.anho()}-${this.mes()}.${formato}`);
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
