import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, concatMap, finalize, forkJoin, from, of, take, tap } from 'rxjs';

import { AuthService, Persona, mensajeDeError } from '@haberes/shared-api';

import { TransferirNovedadesService } from './transferir-novedades.service';
import {
  AcreditacionPeriodo,
  AnotacionFacultad,
  CargoNovedad,
  FilaTransferenciaError,
  ProcesoTransferencia,
  ProgresoTransferencia,
  ResumenTransferencia
} from './transferir-novedades.models';

/**
 * Transferencia de novedades entre períodos.
 *
 * Dos procesos independientes, ambos con origen en el mes anterior al
 * seleccionado:
 * - Anotaciones de facultades: se mueven al período destino (`transferido = 1`).
 * - Cargos: se clonan, salteando las claves que ya existen en el destino.
 *
 * El período destino acreditado bloquea las acciones. El origen acreditado se
 * advierte porque mover registros altera un período ya cerrado.
 */
@Component({
  selector: 'haberes-transferir-novedades',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, FormsModule],
  templateUrl: './transferir-novedades.component.html'
})
export class TransferirNovedadesComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly servicio = inject(TransferirNovedadesService);

  readonly anho = signal<number>(new Date().getFullYear());
  readonly mes = signal<number>(new Date().getMonth() + 1);

  readonly anotacionesOrigen = signal<AnotacionFacultad[]>([]);
  readonly cargosOrigen = signal<CargoNovedad[]>([]);
  readonly cargosDestino = signal<CargoNovedad[]>([]);
  readonly anotacionesDestino = signal<AnotacionFacultad[]>([]);

  readonly acreditacionDestino = signal<AcreditacionPeriodo | null>(null);
  readonly acreditacionOrigen = signal<AcreditacionPeriodo | null>(null);
  readonly acreditacionVerificada = signal<boolean>(false);
  readonly acreditacionError = signal<boolean>(false);
  readonly cargaError = signal<boolean>(false);

  readonly cargando = signal<boolean>(false);
  readonly procesando = signal<ProcesoTransferencia | null>(null);
  readonly progreso = signal<ProgresoTransferencia | null>(null);
  readonly resumen = signal<ResumenTransferencia | null>(null);
  readonly error = signal<string | null>(null);
  readonly exito = signal<string | null>(null);
  readonly legajoSolicitante = signal<number | null>(null);

  /** Período de origen: mes anterior al seleccionado, con cruce de año. */
  readonly origen = computed<{ anho: number; mes: number }>(() => {
    let mes = this.mes() - 1;
    let anho = this.anho();
    if (mes < 1) {
      mes = 12;
      anho--;
    }
    return { anho, mes };
  });

  readonly textoOrigen = computed(() => this.periodoTexto(this.origen().mes, this.origen().anho));
  readonly textoDestino = computed(() => this.periodoTexto(this.mes(), this.anho()));

  readonly periodoCerrado = computed(() => this.acreditacionDestino()?.acreditado === 1);
  readonly origenCerrado = computed(() => this.acreditacionOrigen()?.acreditado === 1);

  /** Las escrituras sólo se habilitan con el estado del período verificado. */
  readonly habilitado = computed(() =>
    this.acreditacionVerificada()
    && !this.acreditacionError()
    && !this.cargaError()
    && !this.periodoCerrado()
    && this.procesando() === null
  );

  readonly puedeAnotador = computed(() => this.habilitado() && this.anotacionesOrigen().length > 0);
  readonly puedeCargos = computed(() => this.habilitado() && this.cargosNuevos().length > 0);

  readonly motivoCierre = computed(() => {
    if (this.acreditacionError()) {
      return 'No se pudo verificar el estado de los períodos: las transferencias están deshabilitadas.';
    }
    if (this.periodoCerrado()) {
      return 'El período destino está acreditado: no se pueden transferir novedades.';
    }
    return null;
  });

  readonly avisoOrigenCerrado = computed(() => {
    if (!this.origenCerrado() || this.periodoCerrado()) {
      return null;
    }
    return `El período de origen ${this.textoOrigen()} está acreditado. `
      + 'Mover anotaciones modifica un período ya cerrado.';
  });

  readonly cargosClavesDestino = computed<ReadonlySet<string>>(() =>
    new Set(this.cargosDestino().map((cargo) => this.claveCargo(cargo)))
  );

  readonly cargosNuevos = computed<CargoNovedad[]>(() => {
    const claves = this.cargosClavesDestino();
    return this.cargosOrigen().filter((cargo) => !claves.has(this.claveCargo(cargo)));
  });

  readonly cargosExistentes = computed(() => this.cargosOrigen().length - this.cargosNuevos().length);

  readonly legajosDestino = computed<ReadonlySet<number>>(() =>
    new Set(this.anotacionesDestino().map((anotacion) => anotacion.legajoId))
  );

  /** Anotaciones del origen cuyo legajo ya tiene una anotación pendiente en el destino. */
  readonly duplicadosAnotador = computed(() => {
    const legajos = this.legajosDestino();
    return this.anotacionesOrigen().filter((anotacion) => legajos.has(anotacion.legajoId)).length;
  });

  readonly porcentaje = computed(() => {
    const avance = this.progreso();
    if (!avance || avance.total === 0) {
      return 0;
    }
    return Math.round((avance.procesados / avance.total) * 100);
  });

  constructor() {
    this.auth.currentUser$.pipe(take(1)).subscribe((usuario) => {
      if (usuario) {
        this.legajoSolicitante.set(usuario.legajoId);
      }
    });
  }

  ngOnInit(): void {
    this.cargarPeriodo();
  }

  // --- Período -------------------------------------------------------------------------

  onMesChange(valor: number): void {
    this.mes.set(Number(valor));
  }

  onAnhoChange(valor: number): void {
    this.anho.set(Number(valor));
  }

  aplicarPeriodo(): void {
    const mes = Math.trunc(Number(this.mes()));
    const anho = Math.trunc(Number(this.anho()));
    if (!Number.isFinite(mes) || mes < 1 || mes > 12
      || !Number.isFinite(anho) || anho < 2000 || anho > 2100) {
      this.error.set('Ingrese un mes entre 1 y 12 y un año entre 2000 y 2100.');
      return;
    }
    this.mes.set(mes);
    this.anho.set(anho);
    this.limpiarResultado();
    this.cargarPeriodo();
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
    this.limpiarResultado();
    this.cargarPeriodo();
  }

  // --- Transferir anotaciones ----------------------------------------------------------

  transferirAnotador(): void {
    if (!this.puedeAnotador()) {
      return;
    }
    const total = this.anotacionesOrigen().length;
    const origen = this.textoOrigen();
    const destino = this.textoDestino();

    const confirmado = window.confirm(
      `Se moverán ${total} ${total === 1 ? 'anotación' : 'anotaciones'} de ${origen} a ${destino}.\n`
      + 'Las anotaciones dejarán de pertenecer al período de origen.\n\n¿Continuar?'
    );
    if (!confirmado) {
      return;
    }

    const confirmacion = window.prompt(
      `Operación destructiva sobre ${origen}.\nEscriba ${origen} para confirmar:`
    );
    if (confirmacion === null) {
      return;
    }
    if (confirmacion.trim() !== origen) {
      this.error.set(`La confirmación no coincide con ${origen}: no se movió ninguna anotación.`);
      return;
    }

    const errores: FilaTransferenciaError[] = [];
    let exitosos = 0;
    let procesados = 0;

    this.iniciar('anotador', total);
    from([...this.anotacionesOrigen()]).pipe(
      concatMap((anotacion) => this.servicio
        .moverAnotacion(anotacion, this.anho(), this.mes(), this.legajoSolicitante())
        .pipe(
          tap(() => exitosos++),
          catchError((err) => {
            errores.push({
              legajoId: anotacion.legajoId,
              referencia: this.nombreFacultad(anotacion),
              mensaje: mensajeDeError(err, 'No se pudo mover la anotación.')
            });
            return of(null);
          }),
          finalize(() => {
            procesados++;
            this.progreso.set({ procesados, total });
          })
        )
      )
    ).subscribe({
      complete: () => this.finalizar('anotador', total, exitosos, 0, errores)
    });
  }

  // --- Transferir cargos ---------------------------------------------------------------

  transferirCargos(): void {
    if (!this.puedeCargos()) {
      return;
    }
    const nuevos = this.cargosNuevos();
    const existentes = this.cargosExistentes();
    const destino = this.textoDestino();

    const detalleExistentes = existentes > 0
      ? `\n${existentes} ${existentes === 1 ? 'cargo ya existe' : 'cargos ya existen'} en el período y se saltearán.`
      : '';
    const confirmado = window.confirm(
      `Se crearán ${nuevos.length} ${nuevos.length === 1 ? 'cargo' : 'cargos'} en ${destino} `
      + `a partir de los pendientes de ${this.textoOrigen()}.${detalleExistentes}\n\n¿Continuar?`
    );
    if (!confirmado) {
      return;
    }

    const errores: FilaTransferenciaError[] = [];
    let exitosos = 0;
    let procesados = 0;

    this.iniciar('cargos', nuevos.length);
    from(nuevos).pipe(
      concatMap((cargo) => this.servicio
        .crearCargo(cargo, this.anho(), this.mes(), this.legajoSolicitante())
        .pipe(
          tap(() => exitosos++),
          catchError((err) => {
            errores.push({
              legajoId: cargo.legajoId,
              referencia: this.descripcionCargo(cargo),
              mensaje: mensajeDeError(err, 'No se pudo crear el cargo.')
            });
            return of(null);
          }),
          finalize(() => {
            procesados++;
            this.progreso.set({ procesados, total: nuevos.length });
          })
        )
      )
    ).subscribe({
      complete: () => this.finalizar('cargos', nuevos.length, exitosos, existentes, errores)
    });
  }

  // --- Carga y presentación ------------------------------------------------------------

  private cargarPeriodo(): void {
    const destinoAnho = this.anho();
    const destinoMes = this.mes();
    const origen = this.origen();

    this.cargando.set(true);
    this.cargaError.set(false);
    this.acreditacionError.set(false);
    this.acreditacionVerificada.set(false);

    const acreditacion = (anho: number, mes: number) =>
      this.servicio.acreditacionDelPeriodo(anho, mes).pipe(
        catchError(() => {
          this.acreditacionError.set(true);
          return of(null);
        })
      );

    forkJoin({
      anotacionesOrigen: this.servicio.anotacionesPendientes(origen.anho, origen.mes),
      cargosOrigen: this.servicio.cargosPendientes(origen.anho, origen.mes),
      cargosDestino: this.servicio.cargosDelPeriodo(destinoAnho, destinoMes),
      anotacionesDestino: this.servicio.anotacionesPendientes(destinoAnho, destinoMes),
      acreditacionDestino: acreditacion(destinoAnho, destinoMes),
      acreditacionOrigen: acreditacion(origen.anho, origen.mes)
    }).subscribe({
      next: (resultado) => {
        this.anotacionesOrigen.set(resultado.anotacionesOrigen);
        this.cargosOrigen.set(resultado.cargosOrigen);
        this.cargosDestino.set(resultado.cargosDestino);
        this.anotacionesDestino.set(resultado.anotacionesDestino);
        this.acreditacionDestino.set(resultado.acreditacionDestino);
        this.acreditacionOrigen.set(resultado.acreditacionOrigen);
        this.acreditacionVerificada.set(true);
        this.cargando.set(false);
      },
      error: (err) => {
        this.anotacionesOrigen.set([]);
        this.cargosOrigen.set([]);
        this.cargosDestino.set([]);
        this.anotacionesDestino.set([]);
        this.acreditacionDestino.set(null);
        this.acreditacionOrigen.set(null);
        this.cargaError.set(true);
        this.acreditacionVerificada.set(true);
        this.cargando.set(false);
        this.error.set(mensajeDeError(err, 'No se pudieron cargar las novedades de los períodos.'));
      }
    });
  }

  private iniciar(proceso: ProcesoTransferencia, total: number): void {
    this.procesando.set(proceso);
    this.progreso.set({ procesados: 0, total });
    this.resumen.set(null);
    this.error.set(null);
    this.exito.set(null);
  }

  private finalizar(proceso: ProcesoTransferencia, total: number, exitosos: number,
                     salteados: number, errores: FilaTransferenciaError[]): void {
    this.resumen.set({ total, exitosos, salteados, errores });
    this.procesando.set(null);
    this.progreso.set(null);

    const objeto = proceso === 'anotador'
      ? (exitosos === 1 ? 'anotación' : 'anotaciones')
      : (exitosos === 1 ? 'cargo' : 'cargos');
    const verbo = proceso === 'anotador'
      ? (exitosos === 1 ? 'movió' : 'movieron')
      : (exitosos === 1 ? 'creó' : 'crearon');

    if (errores.length === 0) {
      this.exito.set(`Se ${verbo} ${exitosos} ${objeto} correctamente.`);
    } else {
      this.error.set(`Se ${verbo} ${exitosos} de ${total} ${objeto}. `
        + `${errores.length} ${errores.length === 1 ? 'fila no se pudo procesar' : 'filas no se pudieron procesar'}.`);
    }
    this.cargarPeriodo();
  }

  private limpiarResultado(): void {
    this.error.set(null);
    this.exito.set(null);
    this.resumen.set(null);
    this.progreso.set(null);
  }

  claveCargo(cargo: CargoNovedad): string {
    return `${cargo.cursoId}|${cargo.cargoTipoId}|${cargo.legajoId}`;
  }

  nombrePersona(persona: Persona | null | undefined, legajoId: number): string {
    if (!persona) {
      return `Legajo ${legajoId}`;
    }
    return `${persona.apellido}, ${persona.nombre}`;
  }

  nombreFacultad(anotacion: AnotacionFacultad): string {
    return anotacion.facultad?.nombre
      ?? anotacion.facultad?.reducido
      ?? (anotacion.facultadId === null ? 'Sin facultad' : `Facultad ${anotacion.facultadId}`);
  }

  descripcionCargo(cargo: CargoNovedad): string {
    const curso = cargo.curso?.nombre ?? `Curso ${cargo.cursoId}`;
    const tipo = cargo.cargoTipo?.nombre ?? `Cargo ${cargo.cargoTipoId}`;
    return `${curso} · ${tipo}`;
  }

  tipoCargo(cargo: CargoNovedad): string {
    if (cargo.alta === 1) {
      return 'Alta';
    }
    if (cargo.baja === 1) {
      return 'Baja';
    }
    if (cargo.cambio === 1) {
      return 'Cambio';
    }
    return 'Novedad';
  }

  private periodoTexto(mes: number, anho: number): string {
    return `${String(mes).padStart(2, '0')}/${anho}`;
  }
}
