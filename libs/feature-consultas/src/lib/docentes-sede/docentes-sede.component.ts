import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ConsultasCatalogosService, FacultadConsulta, SedeConsulta } from '../consultas-catalogos.service';
import { ConsultasReportService } from '../consultas-report.service';
import { ConsultaPeriodoComponent, PeriodoConsulta } from '../shared/consulta-periodo.component';
import { ColumnaTabla, ReporteTablaComponent, SeccionTabla } from '../shared/reporte-tabla.component';
import { CursoDocentesSede, DocentesSedeData, FilaDocentesSede } from './docentes-sede.models';

/**
 * Docentes por sede (legacy: `frmDocSede.frm` → `rptDocSede`).
 *
 * Requiere facultad y sede: el legado también las exigía para imprimir. Muestra un bloque por
 * curso con sus cargos docentes y contratados, y descarga el PDF o el XLSX del mismo contenido.
 */
@Component({
  selector: 'haberes-docentes-sede',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, FormsModule, ConsultaPeriodoComponent, ReporteTablaComponent],
  templateUrl: './docentes-sede.component.html'
})
export class DocentesSedeComponent implements OnInit {
  private readonly service = inject(ConsultasReportService);
  private readonly catalogos = inject(ConsultasCatalogosService);

  readonly anho = signal(new Date().getFullYear());
  readonly mes = signal(new Date().getMonth() + 1);
  readonly facultades = signal<FacultadConsulta[]>([]);
  readonly sedes = signal<SedeConsulta[]>([]);
  readonly facultadId = signal<number | null>(null);
  readonly sedeId = signal<number | null>(null);
  readonly datos = signal<DocentesSedeData | null>(null);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly descargando = signal<'pdf' | 'xlsx' | null>(null);

  readonly titulo = 'Docentes por Sede';
  readonly habilitado = computed(() => this.facultadId() !== null && this.sedeId() !== null);
  readonly subtitulo = computed(() => {
    const datos = this.datos();
    return datos ? `${datos.facultad} · ${datos.geografica} · ${datos.mes}/${datos.anho}` : `${this.mes()}/${this.anho()}`;
  });

  readonly columnas: readonly ColumnaTabla<FilaDocentesSede>[] = [
    { titulo: 'Cargo', valor: (fila) => fila.cargo },
    { titulo: 'Docente', valor: (fila) => fila.docente },
    { titulo: 'Designación', valor: (fila) => fila.designacion },
    { titulo: 'Horas', valor: (fila) => fila.horas, tipo: 'entero', alineacion: 'der' },
    { titulo: 'Desarraigo', valor: (fila) => fila.desarraigo, alineacion: 'centro' }
  ];

  readonly secciones = computed<readonly SeccionTabla<FilaDocentesSede>[]>(() =>
    (this.datos()?.cursos ?? []).map((curso: CursoDocentesSede) => ({
      titulo: curso.periodo ? `${curso.nombre} · ${curso.periodo}` : curso.nombre,
      filas: curso.filas
    }))
  );

  ngOnInit() {
    this.catalogos.facultades().subscribe({
      next: (facultades) => this.facultades.set(facultades),
      error: () => this.error.set('No se pudieron cargar las facultades.')
    });
    this.catalogos.sedes().subscribe({
      next: (sedes) => this.sedes.set(sedes),
      error: () => this.error.set('No se pudieron cargar las sedes.')
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

  cambiarSede(sedeId: number | null) {
    this.sedeId.set(sedeId);
    this.limpiar();
  }

  verDatos() {
    if (!this.habilitado()) {
      return;
    }
    this.cargando.set(true);
    this.error.set(null);
    this.service.data<DocentesSedeData>('docentesSede', this.parametros()).subscribe({
      next: (datos) => {
        this.datos.set(datos);
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.error.set(this.service.mensajeDeError(error, 'No se pudieron obtener los docentes de la sede.'));
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
    this.service.descargar('docentesSede', formato, this.parametros()).subscribe({
      next: (blob) => {
        this.guardar(blob, `docentes-sede-${this.anho()}-${this.mes()}.${formato}`);
        this.descargando.set(null);
      },
      error: (error: unknown) => {
        this.error.set(this.service.mensajeDeError(error, `No se pudo generar el ${formato.toUpperCase()}.`));
        this.descargando.set(null);
      }
    });
  }

  private parametros(): number[] {
    return [this.facultadId() as number, this.sedeId() as number, this.anho(), this.mes()];
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
