import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, take } from 'rxjs';

import {
  AuthService,
  Persona,
  PersonaSearchService,
  fechaInput,
  fechaPayload,
  mensajeDeError
} from '@haberes/shared-api';
import { FechaPipe, ImportePipe, InputFechaComponent, PersonaSearchComponent } from '@haberes/ui-layout';

import { AsignacionesEtecService } from './asignaciones-etec.service';
import {
  AcreditacionPeriodo,
  AsignacionEtec,
  AsignacionEtecRequest,
  CategoriaEtec,
  Dependencia,
  Periodo,
  PresentismoEtec,
  PresentismoEtecRequest,
  PresentismoHorasEtec,
  PresentismoHorasRequest,
  estadoAsignacion,
  fechaHoy,
  periodoActual,
  puntosDe,
  sumarMes,
  textoPeriodo
} from './asignaciones-etec.models';

/**
 * Asignación de Cargos ETEC (cargo por puntos).
 *
 * El cargo ETEC no lleva jornada, horas ni presentismo: su importe es
 * `puntos × valorPuntoEtec + montoFijoCargo` del período. La asignación se persiste en
 * `etec_asignacion_cargo` a través de `haberes-etec`, que valida cargo, fechas y solape.
 */
@Component({
  selector: 'haberes-asignaciones-etec',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, FormsModule, PersonaSearchComponent, FechaPipe, ImportePipe, InputFechaComponent],
  templateUrl: './asignaciones-etec.component.html'
})
export class AsignacionesEtecComponent {
  private readonly auth = inject(AuthService);
  private readonly personas = inject(PersonaSearchService);
  private readonly service = inject(AsignacionesEtecService);

  readonly persona = signal<Persona | null>(null);
  readonly legajoInput = signal<string>('');
  readonly documentoInput = signal<string>('');

  readonly asignaciones = signal<AsignacionEtec[]>([]);
  readonly cargos = signal<CategoriaEtec[]>([]);
  readonly dependencias = signal<Dependencia[]>([]);

  readonly seleccionado = signal<AsignacionEtec | null>(null);

  readonly fechaAlta = signal<string>(fechaHoy());
  readonly fechaBaja = signal<string>('');
  readonly categoriaId = signal<number | null>(null);
  readonly dependenciaId = signal<number | null>(null);
  readonly observaciones = signal<string>('');

  readonly periodo = signal<Periodo>(periodoActual());
  readonly valorPunto = signal<number | null>(null);
  readonly montoFijo = signal<number | null>(null);
  readonly valorPuntoListo = signal<boolean>(false);

  readonly presentismos = signal<PresentismoEtec[]>([]);
  readonly acreditacion = signal<AcreditacionPeriodo | null>(null);
  readonly acreditacionVerificada = signal<boolean>(false);
  readonly acreditacionError = signal<boolean>(false);
  readonly pierdePresentismo = signal<boolean>(false);
  readonly motivoPresentismo = signal<string>('');
  readonly guardandoPresentismo = signal<boolean>(false);

  readonly presentismoHoras = signal<PresentismoHorasEtec | null>(null);
  readonly pierdePresentismoHoras = signal<boolean>(false);
  readonly motivoPresentismoHoras = signal<string>('');
  readonly guardandoPresentismoHoras = signal<boolean>(false);

  readonly cargando = signal<boolean>(false);
  readonly guardando = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly exito = signal<string | null>(null);

  readonly legajoSolicitante = signal<number | null>(null);

  readonly hayPersona = computed(() => this.persona() !== null);
  readonly editando = computed(() => this.seleccionado() !== null);
  readonly periodoTexto = computed(() => textoPeriodo(this.periodo()));

  readonly cargoSeleccionado = computed<CategoriaEtec | null>(() => {
    const categoriaId = this.categoriaId();
    if (categoriaId === null) {
      return null;
    }
    return this.cargos().find((cargo) => cargo.categoriaId === categoriaId) ?? null;
  });

  readonly puntos = computed(() => puntosDe(this.cargoSeleccionado()));

  readonly importe = computed<number | null>(() => {
    const puntos = this.puntos();
    const valor = this.valorPunto();
    if (puntos === null || valor === null) {
      return null;
    }
    return puntos * valor + (this.montoFijo() ?? 0);
  });

  readonly sinValorPunto = computed(() => {
    if (!this.valorPuntoListo()) {
      return false;
    }
    const valor = this.valorPunto();
    return valor === null || valor <= 0;
  });

  readonly puedeGuardar = computed(() =>
    this.hayPersona()
    && !this.guardando()
    && this.fechaAlta().length > 0
    && this.categoriaId() !== null
    && this.dependenciaId() !== null
  );

  readonly periodoCerrado = computed(() => this.acreditacion()?.acreditado === 1);

  /** La acreditación se pudo verificar y el período sigue abierto. */
  readonly puedeEscribirPresentismo = computed(() =>
    this.acreditacionVerificada() && !this.acreditacionError() && !this.periodoCerrado()
  );

  readonly presentismoSeleccionado = computed<PresentismoEtec | null>(() => {
    const asignacion = this.seleccionado();
    if (!asignacion) {
      return null;
    }
    return this.presentismos().find(
      (item) => item.asignacionCargoId === asignacion.asignacionCargoId
    ) ?? null;
  });

  readonly puedeGuardarPresentismo = computed(() => {
    if (!this.seleccionado() || !this.puedeEscribirPresentismo() || this.guardandoPresentismo()) {
      return false;
    }
    if (this.pierdePresentismo()) {
      return this.motivoPresentismo().trim().length > 0;
    }
    return this.presentismoSeleccionado() !== null;
  });

  readonly tieneCargosHoras = computed(() => this.presentismoHoras()?.tieneCargosHoras === true);

  readonly puedeEscribirPresentismoHoras = computed(() =>
    this.hayPersona()
    && this.puedeEscribirPresentismo()
    && (this.tieneCargosHoras() || this.presentismoHoras()?.presentismoHorasId != null)
  );

  readonly puedeGuardarPresentismoHoras = computed(() => {
    if (!this.puedeEscribirPresentismoHoras() || this.guardandoPresentismoHoras()) {
      return false;
    }
    if (this.pierdePresentismoHoras()) {
      if (!this.tieneCargosHoras() && this.presentismoHoras()?.presentismoHorasId == null) {
        return false;
      }
      return this.motivoPresentismoHoras().trim().length > 0;
    }
    return this.presentismoHoras()?.presentismoHorasId != null;
  });

  constructor() {
    this.auth.currentUser$.pipe(take(1)).subscribe((usuario) => {
      if (usuario) {
        this.legajoSolicitante.set(usuario.legajoId);
      }
    });
    this.cargarCatalogos();
    this.cargarValorPunto();
    this.cargarAcreditacion();
  }

  // --- Persona -------------------------------------------------------------

  onPersonaSeleccionada(persona: Persona | null): void {
    if (!persona) {
      this.limpiarPersona();
      return;
    }
    this.seleccionarPersona(persona);
  }

  buscarPorLegajo(): void {
    const texto = this.legajoInput().trim();
    if (!/^\d+$/.test(texto)) {
      return;
    }
    if (this.persona()?.legajoId === Number(texto) && this.hayPersona()) {
      return;
    }
    this.personas.getPersonaByLegajo(Number(texto)).subscribe({
      next: (persona) => this.seleccionarPersona(persona),
      error: (err: HttpErrorResponse) =>
        this.error.set(this.mensajeHttp(err, `No se encontró un legajo con el número ${texto}.`))
    });
  }

  buscarPorDocumento(): void {
    const texto = this.documentoInput().trim();
    if (!/^\d+$/.test(texto)) {
      return;
    }
    const documentoActual = this.persona()?.documento;
    if (documentoActual !== undefined && documentoActual !== null && String(documentoActual) === texto) {
      return;
    }
    this.personas.getPersonaByDocumento(texto).subscribe({
      next: (persona) => this.seleccionarPersona(persona),
      error: (err: HttpErrorResponse) =>
        this.error.set(this.mensajeHttp(err, `No se encontró una persona con el documento ${texto}.`))
    });
  }

  private seleccionarPersona(persona: Persona): void {
    this.persona.set(persona);
    this.legajoInput.set(String(persona.legajoId));
    this.documentoInput.set(
      persona.documento === null || persona.documento === undefined ? '' : String(persona.documento)
    );
    this.limpiarMensajes();
    this.resetFormulario();
    this.cargarAsignaciones();
    this.cargarPresentismos();
    this.cargarPresentismoHoras();
  }

  private limpiarPersona(): void {
    this.persona.set(null);
    this.legajoInput.set('');
    this.documentoInput.set('');
    this.asignaciones.set([]);
    this.presentismos.set([]);
    this.presentismoHoras.set(null);
    this.sincronizarPresentismoHoras();
    this.limpiarMensajes();
    this.resetFormulario();
  }

  // --- Catálogos, período y datos ------------------------------------------

  private cargarCatalogos(): void {
    const { anho, mes } = this.periodo();
    this.service.catalogos(anho, mes).subscribe({
      next: (catalogos) => {
        this.cargos.set(catalogos.cargos);
        this.dependencias.set(catalogos.dependencias);
      },
      error: (err: HttpErrorResponse) =>
        this.error.set(this.mensajeHttp(err, 'No se pudieron cargar los catálogos del formulario.'))
    });
  }

  private cargarValorPunto(): void {
    const { anho, mes } = this.periodo();
    this.valorPuntoListo.set(false);
    this.service.valorPunto(anho, mes).subscribe({
      next: (control) => {
        this.valorPunto.set(control?.valorPuntoEtec ?? null);
        this.montoFijo.set(control?.montoFijoCargo ?? null);
        this.valorPuntoListo.set(true);
      },
      error: (err: HttpErrorResponse) => {
        this.valorPunto.set(null);
        this.montoFijo.set(null);
        this.valorPuntoListo.set(true);
        this.error.set(this.mensajeHttp(err, 'No se pudo obtener el valor del punto del período.'));
      }
    });
  }

  cambiarPeriodo(delta: number): void {
    this.periodo.set(sumarMes(this.periodo(), delta));
    this.cargarCatalogos();
    this.cargarValorPunto();
    this.cargarAcreditacion();
    this.cargarPresentismos();
    this.cargarPresentismoHoras();
  }

  private cargarAcreditacion(): void {
    const { anho, mes } = this.periodo();
    this.acreditacionVerificada.set(false);
    this.acreditacionError.set(false);
    this.service.acreditacionDelPeriodo(anho, mes).subscribe({
      next: (acreditacion) => {
        this.acreditacion.set(acreditacion);
        this.acreditacionVerificada.set(true);
      },
      error: () => {
        this.acreditacion.set(null);
        this.acreditacionVerificada.set(true);
        this.acreditacionError.set(true);
      }
    });
  }

  private cargarPresentismos(): void {
    const persona = this.persona();
    if (!persona) {
      this.presentismos.set([]);
      this.sincronizarPresentismo();
      return;
    }
    const { anho, mes } = this.periodo();
    this.service.presentismos(persona.legajoId, anho, mes).subscribe({
      next: (presentismos) => {
        this.presentismos.set(presentismos);
        this.sincronizarPresentismo();
      },
      error: (err: HttpErrorResponse) => {
        this.presentismos.set([]);
        this.sincronizarPresentismo();
        this.error.set(this.mensajeHttp(err, 'No se pudo cargar el presentismo del período.'));
      }
    });
  }

  private sincronizarPresentismo(): void {
    const actual = this.presentismoSeleccionado();
    this.pierdePresentismo.set(actual !== null);
    this.motivoPresentismo.set(actual?.motivo ?? '');
  }

  private cargarPresentismoHoras(): void {
    const persona = this.persona();
    if (!persona) {
      this.presentismoHoras.set(null);
      this.sincronizarPresentismoHoras();
      return;
    }
    this.presentismoHoras.set(null);
    this.sincronizarPresentismoHoras();
    const { anho, mes } = this.periodo();
    this.service.presentismoHoras(persona.legajoId, anho, mes).subscribe({
      next: (presentismo) => {
        this.presentismoHoras.set(presentismo);
        this.sincronizarPresentismoHoras();
      },
      error: (err: HttpErrorResponse) => {
        this.presentismoHoras.set(null);
        this.sincronizarPresentismoHoras();
        this.error.set(this.mensajeHttp(err, 'No se pudo cargar el presentismo por horas del período.'));
      }
    });
  }

  private sincronizarPresentismoHoras(): void {
    const actual = this.presentismoHoras();
    this.pierdePresentismoHoras.set(actual?.presentismoHorasId != null);
    this.motivoPresentismoHoras.set(actual?.motivo ?? '');
  }

  private cargarAsignaciones(): void {
    const persona = this.persona();
    if (!persona) {
      return;
    }
    this.cargando.set(true);
    this.service.asignaciones(persona.legajoId).subscribe({
      next: (asignaciones) => {
        this.asignaciones.set(asignaciones);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.asignaciones.set([]);
        this.error.set(this.mensajeHttp(err, 'No se pudieron cargar los cargos ETEC del legajo.'));
        this.cargando.set(false);
      }
    });
  }

  // --- Formulario ----------------------------------------------------------

  seleccionar(asignacion: AsignacionEtec): void {
    this.seleccionado.set(asignacion);
    this.fechaAlta.set(fechaInput(asignacion.fechaAlta));
    this.fechaBaja.set(fechaInput(asignacion.fechaBaja));
    this.categoriaId.set(asignacion.categoriaId);
    this.dependenciaId.set(asignacion.dependenciaId);
    this.observaciones.set(asignacion.observaciones ?? '');
    this.limpiarMensajes();
    this.sincronizarPresentismo();
  }

  resetFormulario(): void {
    this.seleccionado.set(null);
    this.fechaAlta.set(fechaHoy());
    this.fechaBaja.set('');
    this.categoriaId.set(null);
    this.dependenciaId.set(null);
    this.observaciones.set('');
    this.sincronizarPresentismo();
  }

  guardar(): void {
    const persona = this.persona();
    if (!persona || !this.puedeGuardar()) {
      return;
    }
    const actual = this.seleccionado();
    const observaciones = this.observaciones().trim();
    const body: AsignacionEtecRequest = {
      legajoId: persona.legajoId,
      categoriaId: this.categoriaId() as number,
      dependenciaId: this.dependenciaId() as number,
      fechaAlta: fechaPayload(actual?.fechaAlta, this.fechaAlta()),
      fechaBaja: this.fechaBaja() ? fechaPayload(actual?.fechaBaja, this.fechaBaja()) : null,
      observaciones: observaciones.length > 0 ? observaciones : null
    };

    this.guardando.set(true);
    this.limpiarMensajes();
    const operacion = actual
      ? this.service.actualizar(actual.asignacionCargoId, body, this.legajoSolicitante())
      : this.service.crear(body, this.legajoSolicitante());

    operacion.subscribe({
      next: () => {
        this.exito.set(actual ? 'Cargo ETEC actualizado.' : 'Cargo ETEC asignado.');
        this.guardando.set(false);
        this.resetFormulario();
        this.cargarAsignaciones();
        this.cargarPresentismos();
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(
          err.status === 409
            ? 'Ya existe una asignación vigente de ese cargo ETEC para el legajo.'
            : this.mensajeHttp(err, 'No se pudo guardar el cargo ETEC.')
        );
        this.guardando.set(false);
      }
    });
  }

  eliminar(): void {
    const actual = this.seleccionado();
    const persona = this.persona();
    if (!actual || !persona) {
      return;
    }
    const cargo = this.nombreCargoDe(actual);
    if (!window.confirm(`¿Eliminar el cargo ETEC ${cargo} del legajo ${persona.legajoId}?`)) {
      return;
    }
    this.guardando.set(true);
    this.limpiarMensajes();
    this.service.eliminar(actual.asignacionCargoId, this.legajoSolicitante()).subscribe({
      next: () => {
        this.exito.set('Cargo ETEC eliminado.');
        this.guardando.set(false);
        this.resetFormulario();
        this.cargarAsignaciones();
        this.cargarPresentismos();
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(this.mensajeHttp(err, 'No se pudo eliminar el cargo ETEC.'));
        this.guardando.set(false);
      }
    });
  }

  // --- Presentismo del período ---------------------------------------------

  guardarPresentismo(): void {
    const actual = this.seleccionado();
    const persona = this.persona();
    if (!actual || !persona || !this.puedeGuardarPresentismo()) {
      return;
    }
    const existente = this.presentismoSeleccionado();
    const motivo = this.motivoPresentismo().trim();
    const { anho, mes } = this.periodo();
    const solicitante = this.legajoSolicitante();

    this.guardandoPresentismo.set(true);
    this.limpiarMensajes();

    let operacion: Observable<unknown>;
    if (this.pierdePresentismo()) {
      if (existente) {
        operacion = this.service.actualizarPresentismo(existente.presentismoId, { motivo }, solicitante);
      } else {
        const body: PresentismoEtecRequest = {
          asignacionCargoId: actual.asignacionCargoId,
          anho,
          mes,
          motivo
        };
        operacion = this.service.crearPresentismo(body, solicitante);
      }
    } else if (existente) {
      operacion = this.service.eliminarPresentismo(existente.presentismoId, solicitante);
    } else {
      this.guardandoPresentismo.set(false);
      return;
    }

    operacion.subscribe({
      next: () => {
        this.exito.set(
          this.pierdePresentismo()
            ? 'Pérdida de presentismo registrada para el período.'
            : 'Presentismo restituido para el período.'
        );
        this.guardandoPresentismo.set(false);
        this.cargarPresentismos();
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(this.mensajeHttp(err, 'No se pudo guardar el presentismo del período.'));
        this.guardandoPresentismo.set(false);
      }
    });
  }

  // --- Presentismo por horas ------------------------------------------------

  guardarPresentismoHoras(): void {
    const persona = this.persona();
    if (!persona || !this.puedeGuardarPresentismoHoras()) {
      return;
    }
    const actual = this.presentismoHoras();
    const motivo = this.motivoPresentismoHoras().trim();
    const { anho, mes } = this.periodo();
    const solicitante = this.legajoSolicitante();

    this.guardandoPresentismoHoras.set(true);
    this.limpiarMensajes();

    let operacion: Observable<unknown>;
    if (this.pierdePresentismoHoras()) {
      if (actual?.presentismoHorasId != null) {
        operacion = this.service.actualizarPresentismoHoras(
          actual.presentismoHorasId, { motivo }, solicitante);
      } else {
        const body: PresentismoHorasRequest = {
          legajoId: persona.legajoId,
          anho,
          mes,
          motivo
        };
        operacion = this.service.crearPresentismoHoras(body, solicitante);
      }
    } else if (actual?.presentismoHorasId != null) {
      operacion = this.service.eliminarPresentismoHoras(actual.presentismoHorasId, solicitante);
    } else {
      this.guardandoPresentismoHoras.set(false);
      return;
    }

    operacion.subscribe({
      next: () => {
        this.exito.set(
          this.pierdePresentismoHoras()
            ? 'Pérdida de presentismo por horas registrada para el período.'
            : 'Presentismo por horas restituido para el período.'
        );
        this.guardandoPresentismoHoras.set(false);
        this.cargarPresentismoHoras();
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(this.mensajeHttp(err, 'No se pudo guardar el presentismo por horas del período.'));
        this.guardandoPresentismoHoras.set(false);
      }
    });
  }

  // --- Presentación -------------------------------------------------------

  nombreCargoDe(asignacion: AsignacionEtec): string {
    if (asignacion.categoriaNombre) {
      return asignacion.categoriaNombre;
    }
    const cargo = this.cargos().find((item) => item.categoriaId === asignacion.categoriaId);
    return cargo?.nombre ?? `Cargo ${asignacion.categoriaId}`;
  }

  nombreDependenciaDe(asignacion: AsignacionEtec): string {
    if (asignacion.dependenciaNombre) {
      return asignacion.dependenciaNombre;
    }
    const dependencia = this.dependencias().find((item) => item.dependenciaId === asignacion.dependenciaId);
    return dependencia?.acronimo || dependencia?.nombre || '—';
  }

  puntosDeAsignacion(asignacion: AsignacionEtec): number | null {
    const cargo = this.cargos().find((item) => item.categoriaId === asignacion.categoriaId);
    return puntosDe(cargo);
  }

  importeDe(asignacion: AsignacionEtec): number | null {
    const puntos = this.puntosDeAsignacion(asignacion);
    const valor = this.valorPunto();
    if (puntos === null || valor === null) {
      return null;
    }
    return puntos * valor + (this.montoFijo() ?? 0);
  }

  estadoDe(asignacion: AsignacionEtec): string {
    return estadoAsignacion(asignacion);
  }

  tienePerdidaPresentismo(asignacion: AsignacionEtec): boolean {
    return this.presentismos().some(
      (item) => item.asignacionCargoId === asignacion.asignacionCargoId
    );
  }

  private limpiarMensajes(): void {
    this.error.set(null);
    this.exito.set(null);
  }

  private mensajeHttp(error: unknown, porDefecto: string): string {
    return mensajeDeError(error, porDefecto);
  }
}
