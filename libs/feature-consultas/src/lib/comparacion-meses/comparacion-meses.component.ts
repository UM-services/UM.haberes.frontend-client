import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ConsultasReportService } from '../consultas-report.service';
import { ConsultaPeriodoComponent, PeriodoConsulta } from '../shared/consulta-periodo.component';
import { ColumnaTabla, ReporteTablaComponent, SeccionTabla } from '../shared/reporte-tabla.component';
import {
  ComparacionRemuneracionesData,
  DependenciaComparacion,
  FilaComparacionRemuneraciones
} from './comparacion-meses.models';

/**
 * Comparación entre meses consecutivos (legacy: `frmCompEntreMesesConsec.frm`).
 *
 * Compara brutos y netos del período elegido contra el mes anterior, agrupado por
 * dependencia. La comparación de designaciones del sistema anterior no forma parte
 * de esta versión (el reporte de origen no está disponible).
 */
@Component({
  selector: 'haberes-comparacion-meses',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, ConsultaPeriodoComponent, ReporteTablaComponent],
  templateUrl: './comparacion-meses.component.html'
})
export class ComparacionMesesComponent {
  private readonly service = inject(ConsultasReportService);

  readonly anho = signal(new Date().getFullYear());
  readonly mes = signal(new Date().getMonth() + 1);
  readonly datos = signal<ComparacionRemuneracionesData | null>(null);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly descargando = signal<'pdf' | 'xlsx' | null>(null);

  readonly titulo = 'Comparación de Remuneraciones';
  readonly anterior = computed(() =>
    this.mes() === 1
      ? { anho: this.anho() - 1, mes: 12 }
      : { anho: this.anho(), mes: this.mes() - 1 }
  );
  readonly subtitulo = computed(() => {
    const previo = this.anterior();
    return `${this.mes()}/${this.anho()} vs ${previo.mes}/${previo.anho}`;
  });

  readonly columnas: readonly ColumnaTabla<FilaComparacionRemuneraciones>[] = [
    { titulo: 'Legajo', valor: (fila) => fila.legajoId },
    { titulo: 'Apellido y Nombre', valor: (fila) => fila.apellidoNombre },
    { titulo: 'Bruto anterior', valor: (fila) => fila.brutoAnterior, tipo: 'importe', alineacion: 'der' },
    { titulo: 'Bruto actual', valor: (fila) => fila.brutoActual, tipo: 'importe', alineacion: 'der' },
    { titulo: 'Diferencia', valor: (fila) => fila.brutoDiferencia, tipo: 'importe', alineacion: 'der' },
    { titulo: '%', valor: (fila) => fila.brutoPorcentaje, tipo: 'entero', alineacion: 'der' },
    { titulo: 'Neto anterior', valor: (fila) => fila.netoAnterior, tipo: 'importe', alineacion: 'der' },
    { titulo: 'Neto actual', valor: (fila) => fila.netoActual, tipo: 'importe', alineacion: 'der' },
    { titulo: 'Diferencia neto', valor: (fila) => fila.netoDiferencia, tipo: 'importe', alineacion: 'der' }
  ];

  readonly secciones = computed<readonly SeccionTabla<FilaComparacionRemuneraciones>[]>(() =>
    (this.datos()?.dependencias ?? []).map((dependencia: DependenciaComparacion) => ({
      titulo: dependencia.nombre,
      filas: dependencia.filas
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
    this.service
      .data<ComparacionRemuneracionesData>('comparacionRemuneraciones', this.parametros())
      .subscribe({
        next: (datos) => {
          this.datos.set(datos);
          this.cargando.set(false);
        },
        error: (error: unknown) => {
          this.error.set(
            this.service.mensajeDeError(error, 'No se pudo obtener la comparación del período.')
          );
          this.cargando.set(false);
        }
      });
  }

  descargar(formato: 'pdf' | 'xlsx') {
    this.descargando.set(formato);
    this.error.set(null);
    this.service.descargar('comparacionRemuneraciones', formato, this.parametros()).subscribe({
      next: (blob) => {
        this.guardar(blob, `comparacion-remuneraciones-${this.anho()}-${this.mes()}.${formato}`);
        this.descargando.set(null);
      },
      error: (error: unknown) => {
        this.error.set(this.service.mensajeDeError(error, `No se pudo generar el ${formato.toUpperCase()}.`));
        this.descargando.set(null);
      }
    });
  }

  private parametros(): number[] {
    const previo = this.anterior();
    return [this.anho(), this.mes(), previo.anho, previo.mes];
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
