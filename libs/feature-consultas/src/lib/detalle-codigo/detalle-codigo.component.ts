import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CodigoConsulta, ConsultasCatalogosService } from '../consultas-catalogos.service';
import { ConsultasReportService } from '../consultas-report.service';
import { ConsultaPeriodoComponent, PeriodoConsulta } from '../shared/consulta-periodo.component';
import { ColumnaTabla, ReporteTablaComponent, SeccionTabla } from '../shared/reporte-tabla.component';
import { DetalleCodigoData, FilaDetalleCodigo } from './detalle-codigo.models';

/**
 * Detalle por código (legacy: `frmRpDetCodigo.frm` → `comparativocodigo`).
 *
 * Requiere código, mes y año: el legado también exigía el código para imprimir. Por cada
 * legajo liquidado muestra el importe liquidado del código y el acumulado de novedades.
 */
@Component({
  selector: 'haberes-detalle-codigo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, FormsModule, ConsultaPeriodoComponent, ReporteTablaComponent],
  templateUrl: './detalle-codigo.component.html'
})
export class DetalleCodigoComponent implements OnInit {
  private readonly service = inject(ConsultasReportService);
  private readonly catalogos = inject(ConsultasCatalogosService);

  readonly anho = signal(new Date().getFullYear());
  readonly mes = signal(new Date().getMonth() + 1);
  readonly codigos = signal<CodigoConsulta[]>([]);
  readonly codigoId = signal<number | null>(null);
  readonly datos = signal<DetalleCodigoData | null>(null);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly descargando = signal<'pdf' | 'xlsx' | null>(null);

  readonly titulo = 'Detalle por Código';
  readonly habilitado = computed(() => this.codigoId() !== null);
  readonly subtitulo = computed(() => {
    const datos = this.datos();
    return datos ? `Código ${datos.codigoId} · ${datos.codigoNombre} · ${this.mes()}/${this.anho()}` : `${this.mes()}/${this.anho()}`;
  });

  readonly columnas: readonly ColumnaTabla<FilaDetalleCodigo>[] = [
    { titulo: 'Legajo', valor: (fila) => fila.legajoId, tipo: 'entero' },
    { titulo: 'Apellido y Nombre', valor: (fila) => fila.apellidoNombre },
    { titulo: 'Liquidado', valor: (fila) => fila.liquidado, tipo: 'importe', alineacion: 'der' },
    { titulo: 'Novedad', valor: (fila) => fila.novedad, tipo: 'importe', alineacion: 'der' },
    { titulo: 'Cantidad', valor: (fila) => fila.cantidad, tipo: 'entero', alineacion: 'der' }
  ];

  readonly secciones = computed<readonly SeccionTabla<FilaDetalleCodigo>[]>(() => {
    const filas = this.datos()?.filas ?? [];
    return filas.length > 0 ? [{ filas }] : [];
  });

  ngOnInit() {
    this.catalogos.codigos().subscribe({
      next: (codigos) => this.codigos.set(codigos),
      error: () => this.error.set('No se pudieron cargar los códigos.')
    });
  }

  cambiarPeriodo(periodo: PeriodoConsulta) {
    this.anho.set(periodo.anho);
    this.mes.set(periodo.mes);
    this.limpiar();
  }

  cambiarCodigo(codigoId: number | null) {
    this.codigoId.set(codigoId);
    this.limpiar();
  }

  verDatos() {
    if (!this.habilitado()) {
      return;
    }
    this.cargando.set(true);
    this.error.set(null);
    this.service.data<DetalleCodigoData>('detalleCodigo', this.parametros()).subscribe({
      next: (datos) => {
        this.datos.set(datos);
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.error.set(this.service.mensajeDeError(error, 'No se pudo obtener el detalle del código.'));
        this.cargando.set(false);
      }
    });
  }

  descargar(formato: 'pdf' | 'xlsx') {
    if (!this.habilitado()) {
      return;
    }
    this.descargando.set(formato);
    this.error.set(null);
    this.service.descargar('detalleCodigo', formato, this.parametros()).subscribe({
      next: (blob) => {
        this.guardar(blob, `detalle-codigo-${this.codigoId()}-${this.anho()}-${this.mes()}.${formato}`);
        this.descargando.set(null);
      },
      error: (error: unknown) => {
        this.error.set(this.service.mensajeDeError(error, `No se pudo generar el ${formato.toUpperCase()}.`));
        this.descargando.set(null);
      }
    });
  }

  private parametros(): number[] {
    return [this.codigoId() as number, this.anho(), this.mes()];
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
