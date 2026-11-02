import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ConsultasReportService } from '../consultas-report.service';
import { ConsultaPeriodoComponent, PeriodoConsulta } from '../shared/consulta-periodo.component';
import { ColumnaTabla, ReporteTablaComponent, SeccionTabla } from '../shared/reporte-tabla.component';
import { ComparacionCodigosData, FilaComparacionCodigos } from './comparacion-codigos.models';
import { FilaTotalesCodigo, TotalesCodigoData } from './totales-codigo.models';

type VistaCodigos = 'totales' | 'comparacion';
type FilaCodigoVista = FilaTotalesCodigo | FilaComparacionCodigos;

/**
 * Totales generales por código (legacy: `frmRpTotCodigo.frm`).
 *
 * Reproduce las dos salidas del formulario: **Totales** (sólo códigos con novedad,
 * `rptTotalCodigo`) y **Comparación** (todos los códigos con su diferencia,
 * `rptCodigoComparativo`). Cada vista tiene su tabla y sus descargas PDF/XLSX.
 */
@Component({
  selector: 'haberes-totales-codigo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, ConsultaPeriodoComponent, ReporteTablaComponent],
  templateUrl: './totales-codigo.component.html'
})
export class TotalesCodigoComponent {
  private readonly service = inject(ConsultasReportService);

  readonly anho = signal(new Date().getFullYear());
  readonly mes = signal(new Date().getMonth() + 1);
  readonly vista = signal<VistaCodigos>('totales');
  readonly datos = signal<TotalesCodigoData | ComparacionCodigosData | null>(null);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly descargando = signal<'pdf' | 'xlsx' | null>(null);

  readonly titulo = 'Totales Generales por Código';
  readonly reporte = computed(() =>
    this.vista() === 'totales' ? 'totalesCodigo' : 'comparacionCodigos'
  );
  readonly subtitulo = computed(() => {
    const nombreVista = this.vista() === 'totales' ? 'Totales' : 'Comparación';
    return `${this.mes()}/${this.anho()} · ${nombreVista}`;
  });

  readonly columnas: readonly ColumnaTabla<FilaCodigoVista>[] = [
    { titulo: 'Código', valor: (fila) => String(fila.codigoId) },
    { titulo: 'Descripción', valor: (fila) => fila.nombre },
    { titulo: 'Novedades', valor: (fila) => fila.novedades, tipo: 'importe', alineacion: 'der' },
    { titulo: 'Liquidado', valor: (fila) => fila.liquidado, tipo: 'importe', alineacion: 'der' },
    { titulo: 'Diferencia', valor: (fila) => fila.diferencia, tipo: 'importe', alineacion: 'der' }
  ];

  readonly secciones = computed<readonly SeccionTabla<FilaCodigoVista>[]>(() => {
    const filas: readonly FilaCodigoVista[] = this.datos()?.filas ?? [];
    return filas.length > 0 ? [{ filas }] : [];
  });

  cambiarPeriodo(periodo: PeriodoConsulta) {
    this.anho.set(periodo.anho);
    this.mes.set(periodo.mes);
    this.limpiar();
  }

  cambiarVista(vista: VistaCodigos) {
    if (this.vista() === vista) {
      return;
    }
    this.vista.set(vista);
    this.limpiar();
  }

  verDatos() {
    this.cargando.set(true);
    this.error.set(null);
    this.service
      .data<TotalesCodigoData | ComparacionCodigosData>(this.reporte(), [this.anho(), this.mes()])
      .subscribe({
        next: (datos) => {
          this.datos.set(datos);
          this.cargando.set(false);
        },
        error: (error: unknown) => {
          this.error.set(this.service.mensajeDeError(error, 'No se pudieron obtener los totales por código.'));
          this.cargando.set(false);
        }
      });
  }

  descargar(formato: 'pdf' | 'xlsx') {
    this.descargando.set(formato);
    this.error.set(null);
    this.service.descargar(this.reporte(), formato, [this.anho(), this.mes()]).subscribe({
      next: (blob) => {
        this.guardar(blob, `${this.reporte()}-${this.anho()}-${this.mes()}.${formato}`);
        this.descargando.set(null);
      },
      error: (error: unknown) => {
        this.error.set(this.service.mensajeDeError(error, `No se pudo generar el ${formato.toUpperCase()}.`));
        this.descargando.set(null);
      }
    });
  }

  private limpiar() {
    this.datos.set(null);
    this.error.set(null);
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
