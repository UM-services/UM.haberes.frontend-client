import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { periodoTexto } from '@haberes/shared-api';

import { ConsultasCatalogosService, FacultadConsulta } from '../consultas-catalogos.service';
import { ConsultasReportService } from '../consultas-report.service';
import { ConsultaPeriodoComponent, PeriodoConsulta } from '../shared/consulta-periodo.component';
import { ColumnaTabla, ReporteTablaComponent, SeccionTabla } from '../shared/reporte-tabla.component';
import {
  CargosClasePeriodoData,
  FilaCargoClase,
  SedeCargosClase
} from './cargos-clase-facultad.models';

/**
 * Cargos con clase por facultad (legacy: `frmRpCargoClase.frm` → `rptCargoClase`).
 *
 * Agrupa por sede los cargos con clase vigentes del período; los períodos desde/hasta se
 * muestran como MM/AAAA.
 */
@Component({
  selector: 'haberes-cargos-clase-facultad',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, FormsModule, ConsultaPeriodoComponent, ReporteTablaComponent],
  templateUrl: './cargos-clase-facultad.component.html'
})
export class CargosClaseFacultadComponent implements OnInit {
  private readonly service = inject(ConsultasReportService);
  private readonly catalogos = inject(ConsultasCatalogosService);

  readonly anho = signal(new Date().getFullYear());
  readonly mes = signal(new Date().getMonth() + 1);
  readonly facultades = signal<FacultadConsulta[]>([]);
  readonly facultadId = signal<number | null>(null);
  readonly datos = signal<CargosClasePeriodoData | null>(null);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly descargando = signal<'pdf' | 'xlsx' | null>(null);

  readonly titulo = 'Cargos con Clase por Facultad';
  readonly habilitado = computed(() => this.facultadId() !== null);
  readonly subtitulo = computed(() => {
    const datos = this.datos();
    return datos ? `${datos.facultad} · ${datos.mes}/${datos.anho}` : `${this.mes()}/${this.anho()}`;
  });

  readonly columnas: readonly ColumnaTabla<FilaCargoClase>[] = [
    { titulo: 'Legajo', valor: (fila) => String(fila.legajoId) },
    { titulo: 'Apellido y Nombre', valor: (fila) => fila.apellidoNombre },
    { titulo: 'Cargo', valor: (fila) => fila.cargo },
    { titulo: 'Descripción', valor: (fila) => fila.descripcion },
    { titulo: 'Desde', valor: (fila) => periodoTexto(fila.periodoDesde), alineacion: 'centro' },
    { titulo: 'Hasta', valor: (fila) => periodoTexto(fila.periodoHasta), alineacion: 'centro' },
    { titulo: 'Horas', valor: (fila) => (fila.horas === null ? '—' : String(fila.horas)), tipo: 'entero', alineacion: 'der' },
    { titulo: 'Clase', valor: (fila) => fila.clase }
  ];

  readonly secciones = computed<readonly SeccionTabla<FilaCargoClase>[]>(() =>
    (this.datos()?.sedes ?? []).map((sede: SedeCargosClase) => ({
      titulo: sede.nombre,
      filas: sede.filas
    }))
  );

  ngOnInit() {
    this.catalogos.facultades().subscribe({
      next: (facultades) => this.facultades.set(facultades),
      error: () => this.error.set('No se pudieron cargar las facultades.')
    });
  }

  cambiarPeriodo(periodo: PeriodoConsulta) {
    this.anho.set(periodo.anho);
    this.mes.set(periodo.mes);
    this.limpiar();
  }

  cambiarFacultad(facultadId: number | null) {
    this.facultadId.set(facultadId);
    this.limpiar();
  }

  verDatos() {
    if (!this.habilitado()) {
      return;
    }
    this.cargando.set(true);
    this.error.set(null);
    this.service.data<CargosClasePeriodoData>('cargosClasePeriodo', this.parametros()).subscribe({
      next: (datos) => {
        this.datos.set(datos);
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.error.set(this.service.mensajeDeError(error, 'No se pudieron obtener los cargos con clase.'));
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
    this.service.descargar('cargosClasePeriodo', formato, this.parametros()).subscribe({
      next: (blob) => {
        this.guardar(blob, `cargos-clase-${this.anho()}-${this.mes()}.${formato}`);
        this.descargando.set(null);
      },
      error: (error: unknown) => {
        this.error.set(this.service.mensajeDeError(error, `No se pudo generar el ${formato.toUpperCase()}.`));
        this.descargando.set(null);
      }
    });
  }

  private parametros(): number[] {
    return [this.facultadId() as number, this.anho(), this.mes()];
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
