import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CategoriaConsulta, ConsultasCatalogosService } from '../consultas-catalogos.service';
import { ConsultasReportService } from '../consultas-report.service';
import { HistoricoCargosData } from './historico-cargos.models';

/**
 * Histórico de asignación de cargos (legacy: `frmCargoHist.frm` → `rptCargoHist`).
 *
 * El reporte original nunca implementó el cuerpo: sólo emite el encabezado con la categoría.
 * La pantalla lo dice explícitamente en lugar de mostrar una tabla vacía y sólo ofrece el PDF.
 */
@Component({
  selector: 'haberes-historico-cargos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, FormsModule],
  templateUrl: './historico-cargos.component.html'
})
export class HistoricoCargosComponent implements OnInit {
  private readonly service = inject(ConsultasReportService);
  private readonly catalogos = inject(ConsultasCatalogosService);

  readonly categorias = signal<CategoriaConsulta[]>([]);
  readonly categoriaId = signal<number | null>(null);
  readonly datos = signal<HistoricoCargosData | null>(null);
  readonly consultando = signal(false);
  readonly error = signal<string | null>(null);
  readonly descargando = signal(false);

  readonly titulo = 'Histórico de Asignación de Cargos';
  readonly habilitado = computed(() => this.categoriaId() !== null);
  readonly aviso = computed(
    () =>
      this.datos()?.aviso ??
      'El reporte no tiene cuerpo implementado; se descarga únicamente el encabezado.'
  );

  ngOnInit() {
    this.catalogos.categorias().subscribe({
      next: (categorias) => this.categorias.set(categorias),
      error: () => this.error.set('No se pudieron cargar las categorías.')
    });
  }

  cambiarCategoria(categoriaId: number | null) {
    this.categoriaId.set(categoriaId);
    this.datos.set(null);
    this.error.set(null);
    if (categoriaId !== null) {
      this.consultarAviso();
    }
  }

  descargarPdf() {
    if (!this.habilitado()) {
      return;
    }
    this.descargando.set(true);
    this.error.set(null);
    this.service.descargar('historicoCargos', 'pdf', [this.categoriaId() as number]).subscribe({
      next: (blob) => {
        this.guardar(blob, `historico-cargos-${this.categoriaId()}.pdf`);
        this.descargando.set(false);
      },
      error: (error: unknown) => {
        this.error.set(this.service.mensajeDeError(error, 'No se pudo generar el PDF.'));
        this.descargando.set(false);
      }
    });
  }

  private consultarAviso() {
    this.consultando.set(true);
    this.service.data<HistoricoCargosData>('historicoCargos', [this.categoriaId() as number]).subscribe({
      next: (datos) => {
        this.datos.set(datos);
        this.consultando.set(false);
      },
      error: (error: unknown) => {
        this.error.set(this.service.mensajeDeError(error, 'No se pudo consultar el reporte.'));
        this.consultando.set(false);
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
