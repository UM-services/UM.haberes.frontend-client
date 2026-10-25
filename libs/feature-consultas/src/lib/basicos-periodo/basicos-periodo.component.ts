import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ConsultasReportService } from '../consultas-report.service';
import { ConsultaPeriodoComponent, PeriodoConsulta } from '../shared/consulta-periodo.component';
import { ColumnaTabla, ReporteTablaComponent, SeccionTabla } from '../shared/reporte-tabla.component';
import { BasicosPeriodoData, FilaBasicosPeriodo } from './basicos-periodo.models';

/**
 * Básicos por período (legacy: `frmBasicoPeriodo.frm` → `generateBasicos`).
 *
 * Una fila por cargo liquidado, cargo con clase y adicional del legajo, con la dependencia, la
 * clase o código, la categoría o cargo, el básico o valor hora y las horas de la jornada.
 */
@Component({
  selector: 'haberes-basicos-periodo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, ConsultaPeriodoComponent, ReporteTablaComponent],
  templateUrl: './basicos-periodo.component.html'
})
export class BasicosPeriodoComponent {
  private readonly service = inject(ConsultasReportService);

  readonly anho = signal(new Date().getFullYear());
  readonly mes = signal(new Date().getMonth() + 1);
  readonly datos = signal<BasicosPeriodoData | null>(null);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly descargando = signal<'pdf' | 'xlsx' | null>(null);

  readonly titulo = 'Básicos por Período';
  readonly subtitulo = computed(() => `${this.mes()}/${this.anho()}`);

  readonly columnas: readonly ColumnaTabla<FilaBasicosPeriodo>[] = [
    { titulo: 'Legajo', valor: (fila) => fila.legajoId, tipo: 'entero' },
    { titulo: 'Apellido y Nombre', valor: (fila) => fila.apellidoNombre },
    { titulo: 'Dependencia', valor: (fila) => fila.dependencia },
    { titulo: 'Clase / Código', valor: (fila) => fila.claseCodigo },
    { titulo: 'Categoría / Cargo', valor: (fila) => fila.categoriaCargo },
    { titulo: 'Básico / Valor hora', valor: (fila) => fila.basico, tipo: 'importe', alineacion: 'der' },
    { titulo: 'Horas jornada', valor: (fila) => fila.horasJornada, tipo: 'entero', alineacion: 'der' },
    { titulo: 'Jornada / Horas', valor: (fila) => fila.jornada, tipo: 'entero', alineacion: 'der' }
  ];

  readonly secciones = computed<readonly SeccionTabla<FilaBasicosPeriodo>[]>(() => {
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
    this.service.data<BasicosPeriodoData>('basicosPeriodo', [this.anho(), this.mes()]).subscribe({
      next: (datos) => {
        this.datos.set(datos);
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.error.set(this.service.mensajeDeError(error, 'No se pudieron obtener los básicos del período.'));
        this.cargando.set(false);
      }
    });
  }

  descargar(formato: 'pdf' | 'xlsx') {
    this.descargando.set(formato);
    this.error.set(null);
    this.service.descargar('basicosPeriodo', formato, [this.anho(), this.mes()]).subscribe({
      next: (blob) => {
        this.guardar(blob, `basicos-periodo-${this.anho()}-${this.mes()}.${formato}`);
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
