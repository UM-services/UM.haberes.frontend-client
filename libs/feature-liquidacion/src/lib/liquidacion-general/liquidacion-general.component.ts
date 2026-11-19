import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { take } from 'rxjs';
import { switchMap, takeWhile, timer } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AuthService } from '@haberes/shared-api';

import { LiquidacionGeneralService } from './liquidacion-general.service';
import {
  FilaLiquidacionGeneral,
  InicioProcesoGeneralResponse,
  PadronLiquidacionGeneral,
  ProcesoGeneral,
  ResultadoLegajoGeneral
} from './liquidacion-general.models';

type OperacionGeneral = 'cargos' | 'liquidar' | 'eliminar';

/**
 * Liquidación general del período: padrón de todo el universo liquidable y procesos masivos.
 *
 * El backend concentra las reglas (control, bloqueo, elegibilidad, cálculo). La pantalla arma el
 * padrón, lanza los procesos asíncronos, sigue su avance y muestra los legajos omitidos o fallidos.
 */
@Component({
  selector: 'haberes-liquidacion-general',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, FormsModule],
  templateUrl: './liquidacion-general.component.html'
})
export class LiquidacionGeneralComponent {
  private readonly auth = inject(AuthService);
  private readonly liquidacion = inject(LiquidacionGeneralService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  anho = signal<number>(new Date().getFullYear());
  mes = signal<number>(new Date().getMonth() + 1);

  padron = signal<PadronLiquidacionGeneral | null>(null);
  proceso = signal<ProcesoGeneral | null>(null);
  omitidos = signal<ResultadoLegajoGeneral[]>([]);
  fallidos = signal<ResultadoLegajoGeneral[]>([]);

  forzar = signal<boolean>(false);
  filtroTexto = signal<string>('');
  soloBloqueados = signal<boolean>(false);
  soloNegativos = signal<boolean>(false);

  cargando = signal<boolean>(false);
  procesando = signal<boolean>(false);
  error = signal<string | null>(null);
  exito = signal<string | null>(null);

  legajoSolicitante = signal<number | null>(null);

  readonly acciones = computed(() => this.padron()?.acciones ?? null);
  readonly resumen = computed(() => this.padron()?.resumen ?? null);
  readonly enCurso = computed(() => this.proceso()?.estado === 'EN_CURSO');
  readonly puedeOperar = computed(() => !this.enCurso() && !this.procesando());

  readonly filasFiltradas = computed<FilaLiquidacionGeneral[]>(() => {
    const filas = this.padron()?.filas ?? [];
    const texto = this.filtroTexto().trim().toLowerCase();
    return filas.filter((fila) => {
      if (this.soloBloqueados() && !fila.bloqueado) {
        return false;
      }
      if (this.soloNegativos() && (fila.totalNeto ?? 0) >= 0) {
        return false;
      }
      if (texto === '') {
        return true;
      }
      const buscable = `${fila.legajoId} ${fila.apellido ?? ''} ${fila.nombre ?? ''}`.toLowerCase();
      return buscable.includes(texto);
    });
  });

  readonly tipoTexto = computed(() => this.textoTipo(this.proceso()?.tipo ?? null));

  constructor() {
    this.auth.currentUser$.pipe(take(1)).subscribe((usuario) => {
      if (usuario) {
        this.legajoSolicitante.set(usuario.legajoId);
      }
    });
    this.cargarPadron();
  }

  cargarPadron(limpiarMensajes = false): void {
    if (limpiarMensajes) {
      this.limpiarMensajes();
    }
    this.cargando.set(true);
    this.liquidacion.padron(this.anho(), this.mes()).subscribe({
      next: (padron) => {
        this.padron.set(padron);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.padron.set(null);
        this.error.set(this.mensajeHttp(err, 'No se pudo cargar el padrón del período.'));
        this.cargando.set(false);
      }
    });
  }

  cambiarMes(incremento: number): void {
    let mes = this.mes() + incremento;
    let anho = this.anho();
    if (mes > 12) {
      mes = 1;
      anho++;
    }
    if (mes < 1) {
      mes = 12;
      anho--;
    }
    this.mes.set(mes);
    this.anho.set(anho);
    this.proceso.set(null);
    this.omitidos.set([]);
    this.fallidos.set([]);
    this.cargarPadron(true);
  }

  refrescarPeriodo(): void {
    this.proceso.set(null);
    this.omitidos.set([]);
    this.fallidos.set([]);
    this.cargarPadron(true);
  }

  generarCargos(): void {
    this.iniciar('cargos');
  }

  liquidarPeriodo(): void {
    if (this.forzar() && !window.confirm(
      '¿Confirma liquidar todo el período forzando las liquidaciones bloqueadas?')) {
      return;
    }
    if (!this.forzar() && !window.confirm('¿Confirma liquidar todo el período?')) {
      return;
    }
    this.iniciar('liquidar');
  }

  eliminarPeriodo(): void {
    if (!window.confirm(
      '¿Confirma eliminar las liquidaciones de todo el período? Esta acción borra los cálculos del período.')) {
      return;
    }
    this.iniciar('eliminar');
  }

  descargarPersonales(): void {
    this.liquidacion.descargarPersonales().subscribe({
      next: (blob) => this.guardar(blob, 'datos-personales.xlsx'),
      error: (err: HttpErrorResponse) =>
        this.error.set(this.mensajeHttp(err, 'No se pudo generar la planilla de datos personales.'))
    });
  }

  descargarSalida(): void {
    this.liquidacion.descargarSalida(this.anho(), this.mes()).subscribe({
      next: (blob) => this.guardar(blob, `salida-${this.anho()}-${this.mes()}.xlsx`),
      error: (err: HttpErrorResponse) =>
        this.error.set(this.mensajeHttp(err, 'No se pudo generar la planilla de salida.'))
    });
  }

  salir(): void {
    void this.router.navigate(['/inicio']);
  }

  netoClase(fila: FilaLiquidacionGeneral): string {
    const neto = fila.totalNeto ?? 0;
    if (neto < 0) {
      return 'text-rose-700';
    }
    if (neto === 0) {
      return 'text-emerald-700';
    }
    return 'text-um-ink';
  }

  textoTipo(tipo: string | null): string {
    switch (tipo) {
      case 'CARGOS':
        return 'Generación de cargos';
      case 'LIQUIDAR':
        return 'Liquidación del período';
      case 'ELIMINAR':
        return 'Eliminación de liquidaciones';
      default:
        return '—';
    }
  }

  private iniciar(operacion: OperacionGeneral): void {
    if (this.procesando() || this.enCurso()) {
      return;
    }
    this.procesando.set(true);
    this.limpiarMensajes();
    this.omitidos.set([]);
    this.fallidos.set([]);

    const solicitud = operacion === 'cargos'
      ? this.liquidacion.generarCargos(this.anho(), this.mes(), this.legajoSolicitante())
      : operacion === 'liquidar'
        ? this.liquidacion.liquidar(this.anho(), this.mes(), this.forzar(), this.legajoSolicitante())
        : this.liquidacion.eliminar(this.anho(), this.mes(), this.forzar(), this.legajoSolicitante());

    solicitud.subscribe({
      next: (respuesta: InicioProcesoGeneralResponse) => {
        this.procesando.set(false);
        if (!respuesta.iniciado || !respuesta.proceso) {
          this.error.set(respuesta.mensaje ?? 'No se pudo iniciar el proceso del período.');
          return;
        }
        this.proceso.set(respuesta.proceso);
        this.exito.set(`Proceso iniciado sobre ${respuesta.proceso.total} legajo(s).`);
        this.seguirProceso(respuesta.proceso.procesoId);
      },
      error: (err: HttpErrorResponse) => {
        this.procesando.set(false);
        this.error.set(this.mensajeHttp(err, 'No se pudo iniciar el proceso del período.'));
      }
    });
  }

  private seguirProceso(procesoId: string): void {
    timer(0, 1500).pipe(
      switchMap(() => this.liquidacion.proceso(procesoId)),
      takeWhile((proceso) => proceso.estado === 'EN_CURSO', true),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (proceso) => {
        this.proceso.set(proceso);
        if (proceso.estado === 'EN_CURSO') {
          return;
        }
        this.procesando.set(false);
        if (proceso.estado === 'COMPLETADO') {
          this.exito.set(`Proceso completado: ${proceso.exitosos} con éxito, `
            + `${proceso.omitidos} omitido(s) y ${proceso.fallidos} fallido(s).`);
        } else {
          this.error.set(proceso.mensaje ?? 'El proceso no pudo completarse.');
        }
        this.cargarDetalle(proceso.procesoId);
        this.cargarPadron();
      },
      error: (err: HttpErrorResponse) => {
        this.procesando.set(false);
        this.error.set(this.mensajeHttp(err, 'Se perdió el estado del proceso del período.'));
      }
    });
  }

  private cargarDetalle(procesoId: string): void {
    this.liquidacion.detalle(procesoId, 'OMITIDO').subscribe({
      next: (resultados) => this.omitidos.set(resultados),
      error: () => this.omitidos.set([])
    });
    this.liquidacion.detalle(procesoId, 'FALLIDO').subscribe({
      next: (resultados) => this.fallidos.set(resultados),
      error: () => this.fallidos.set([])
    });
  }

  private guardar(blob: Blob, nombre: string): void {
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombre;
    enlace.click();
    URL.revokeObjectURL(url);
  }

  private limpiarMensajes(): void {
    this.error.set(null);
    this.exito.set(null);
  }

  private mensajeHttp(error: HttpErrorResponse, porDefecto: string): string {
    const detalle = typeof error.error?.message === 'string' ? error.error.message : null;
    if (error.status === 0) {
      return 'No hay conexión con el servicio de haberes.';
    }
    return detalle ?? porDefecto;
  }
}
