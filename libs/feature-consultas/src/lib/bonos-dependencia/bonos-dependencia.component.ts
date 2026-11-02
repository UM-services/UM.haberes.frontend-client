import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@haberes/shared-api';
import { BonoReportService } from '@haberes/feature-bonos';
import { take } from 'rxjs';

import { ConsultasCatalogosService, DependenciaConsulta } from '../consultas-catalogos.service';
import { ConsultasReportService } from '../consultas-report.service';
import { ConsultaPeriodoComponent, PeriodoConsulta } from '../shared/consulta-periodo.component';
import {
  BonosDependenciaData,
  FilaBonoDependencia,
  ResultadoEnvioBono
} from './bonos-dependencia.models';

/**
 * Bonos por dependencia (legacy: `frmImprimir.frm`).
 *
 * Filtros Dependencia + Filtro A/D + período, grilla de legajos con mail institucional y marca
 * de enviado, PDF consolidado y envío masivo con progreso. La preparación de la actividad y la
 * auditoría de la impresión las resuelve el core (`print-prepare`), que conoce la IP del cliente:
 * esta pantalla nunca maneja la IP. El envío usa `send-prepare` (auditoría) + el envío del
 * report-service, igual que el bono individual.
 */
@Component({
  selector: 'haberes-bonos-dependencia',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, FormsModule, ConsultaPeriodoComponent],
  templateUrl: './bonos-dependencia.component.html'
})
export class BonosDependenciaComponent implements OnInit {
  private readonly service = inject(ConsultasReportService);
  private readonly catalogos = inject(ConsultasCatalogosService);
  private readonly bonoService = inject(BonoReportService);
  private readonly auth = inject(AuthService);

  readonly anho = signal(new Date().getFullYear());
  readonly mes = signal(new Date().getMonth() + 1);
  readonly dependencias = signal<DependenciaConsulta[]>([]);
  readonly dependenciaId = signal<number | null>(null);
  readonly filtro = signal<'A' | 'D'>('A');

  readonly datos = signal<BonosDependenciaData | null>(null);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  /** Legajos marcados como enviados (check de la grilla, igual que el formulario original). */
  readonly marcados = signal<ReadonlySet<string>>(new Set());

  readonly imprimiendo = signal(false);
  readonly enviando = signal(false);
  readonly progreso = signal<{ actual: number; total: number } | null>(null);
  readonly resultados = signal<readonly ResultadoEnvioBono[]>([]);
  readonly fallidos = signal<readonly { legajoId: number; motivo: string }[]>([]);

  private legajoSolicitante: number | null = null;

  readonly habilitado = computed(() => this.dependenciaId() !== null);
  readonly filas = computed<readonly FilaBonoDependencia[]>(() => this.datos()?.filas ?? []);
  readonly legajosAEnviar = computed(() =>
    this.filas().filter(
      (fila) => !this.marcados().has(fila.legajoId) && fila.mailInstitucional.includes('@')
    )
  );
  readonly puedeEnviar = computed(() => !this.enviando() && this.legajosAEnviar().length > 0);

  constructor() {
    this.auth.currentUser$.pipe(take(1)).subscribe((usuario) => {
      if (usuario) {
        this.legajoSolicitante = usuario.legajoId;
      }
    });
  }

  ngOnInit() {
    this.catalogos.dependencias().subscribe({
      next: (dependencias) => this.dependencias.set(dependencias),
      error: () => this.error.set('No se pudieron cargar las dependencias.')
    });
  }

  cambiarPeriodo(periodo: PeriodoConsulta) {
    this.anho.set(periodo.anho);
    this.mes.set(periodo.mes);
    this.limpiar();
  }

  cambiarDependencia(dependenciaId: number | null) {
    this.dependenciaId.set(dependenciaId);
    this.limpiar();
  }

  cambiarFiltro(filtro: 'A' | 'D') {
    this.filtro.set(filtro);
    this.limpiar();
  }

  verDatos(limpiarResultados = true) {
    if (!this.habilitado()) {
      return;
    }
    this.cargando.set(true);
    this.error.set(null);
    if (limpiarResultados) {
      this.resultados.set([]);
    }
    this.service.data<BonosDependenciaData>('bonoDependencia', this.parametros()).subscribe({
      next: (datos) => {
        this.datos.set(datos);
        this.marcados.set(new Set(datos.filas.filter((f) => f.bonoEnviado).map((f) => f.legajoId)));
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.error.set(this.service.mensajeDeError(error, 'No se pudieron obtener los legajos de la dependencia.'));
        this.cargando.set(false);
      }
    });
  }

  alternarMarcado(legajoId: string) {
    const marcados = new Set(this.marcados());
    if (marcados.has(legajoId)) {
      marcados.delete(legajoId);
    } else {
      marcados.add(legajoId);
    }
    this.marcados.set(marcados);
  }

  imprimir() {
    if (!this.habilitado()) {
      return;
    }
    if (!this.legajoSolicitante) {
      this.error.set('Error de sesión: no se pudo identificar al solicitante.');
      return;
    }
    this.imprimiendo.set(true);
    this.error.set(null);
    this.fallidos.set([]);
    this.bonoService
      .printPrepareDependencia(
        this.dependenciaId() as number,
        this.anho(),
        this.mes(),
        this.filtro(),
        this.legajoSolicitante
      )
      .subscribe({
        next: (resumen) => {
          if (resumen.fallidos.length > 0) {
            this.fallidos.set(resumen.fallidos);
            this.imprimiendo.set(false);
            return;
          }
          this.descargarPdf();
        },
        error: (error: unknown) => {
          this.error.set(
            this.service.mensajeDeError(error, 'No se pudo preparar la impresión de los bonos.')
          );
          this.imprimiendo.set(false);
        }
      });
  }

  descargarPdf() {
    if (!this.habilitado()) {
      return;
    }
    this.imprimiendo.set(true);
    this.error.set(null);
    this.service.descargar('bonoDependencia', 'pdf', this.parametros()).subscribe({
      next: (blob) => {
        this.guardar(blob, `bonos-${this.dependenciaId()}-${this.anho()}-${this.mes()}.pdf`);
        this.imprimiendo.set(false);
      },
      error: (error: unknown) => {
        this.error.set(this.service.mensajeDeError(error, 'No se pudo generar el PDF consolidado.'));
        this.imprimiendo.set(false);
      }
    });
  }

  enviar() {
    const pendientes = this.legajosAEnviar();
    if (pendientes.length === 0) {
      return;
    }
    this.enviando.set(true);
    this.error.set(null);
    this.resultados.set([]);
    this.progreso.set({ actual: 0, total: pendientes.length });
    this.enviarSiguiente(pendientes, 0);
  }

  private enviarSiguiente(pendientes: readonly FilaBonoDependencia[], indice: number) {
    if (indice >= pendientes.length) {
      this.enviando.set(false);
      this.progreso.set(null);
      this.verDatos(false);
      return;
    }
    const fila = pendientes[indice];
    const legajoId = Number(fila.legajoId);
    this.progreso.set({ actual: indice + 1, total: pendientes.length });
    this.bonoService
      .sendPrepare(legajoId, this.anho(), this.mes(), {
        mailInstitucional: fila.mailInstitucional,
        legajoIdSolicitud: this.legajoSolicitante ?? undefined
      })
      .subscribe({
        next: () => {
          this.service.enviarBonoDependencia(legajoId, this.anho(), this.mes()).subscribe({
            next: (mensaje) => {
              this.agregarResultado(fila, mensaje?.trim() || 'Enviado.', true);
              this.enviarSiguiente(pendientes, indice + 1);
            },
            error: (error: unknown) => {
              this.agregarResultado(
                fila,
                this.service.mensajeDeError(error, 'No se pudo enviar el bono.'),
                false
              );
              this.enviarSiguiente(pendientes, indice + 1);
            }
          });
        },
        error: (error: unknown) => {
          this.agregarResultado(
            fila,
            this.service.mensajeDeError(error, 'No se pudo preparar el envío del bono.'),
            false
          );
          this.enviarSiguiente(pendientes, indice + 1);
        }
      });
  }

  private agregarResultado(fila: FilaBonoDependencia, mensaje: string, ok: boolean) {
    this.resultados.update((resultados) => [
      ...resultados,
      { legajoId: fila.legajoId, apellidoNombre: fila.apellidoNombre, mensaje, ok }
    ]);
  }

  private parametros(): (string | number)[] {
    return [this.anho(), this.mes(), this.dependenciaId() as number, this.filtro()];
  }

  private limpiar() {
    this.datos.set(null);
    this.marcados.set(new Set());
    this.resultados.set([]);
    this.fallidos.set([]);
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
