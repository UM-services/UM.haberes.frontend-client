import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { take } from 'rxjs';

import {
  AuthService,
  Persona,
  PersonaSearchService,
  fechaInput,
  fechaPayload,
  mensajeDeError
} from '@haberes/shared-api';
import { ImportePipe, PersonaSearchComponent } from '@haberes/ui-layout';

import { AsignacionesEtecService } from './asignaciones-etec.service';
import {
  AsignacionEtec,
  AsignacionEtecRequest,
  CategoriaEtec,
  Dependencia,
  Periodo,
  estadoAsignacion,
  fechaHoy,
  periodoActual,
  puntosDe,
  sumarMes,
  textoFecha,
  textoPeriodo
} from './asignaciones-etec.models';

/**
 * Asignación de Cargos ETEC (cargo por puntos).
 *
 * El cargo ETEC no lleva jornada, horas ni presentismo: su importe es
 * `puntos × valorPuntoEtec` del período. La asignación se persiste en
 * `etec_asignacion_cargo` a través de `haberes-etec`, que valida cargo, fechas y solape.
 */
@Component({
  selector: 'haberes-asignaciones-etec',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, FormsModule, PersonaSearchComponent, ImportePipe],
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
  readonly valorPuntoListo = signal<boolean>(false);

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
    return puntos * valor;
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

  constructor() {
    this.auth.currentUser$.pipe(take(1)).subscribe((usuario) => {
      if (usuario) {
        this.legajoSolicitante.set(usuario.legajoId);
      }
    });
    this.cargarCatalogos();
    this.cargarValorPunto();
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
  }

  private limpiarPersona(): void {
    this.persona.set(null);
    this.legajoInput.set('');
    this.documentoInput.set('');
    this.asignaciones.set([]);
    this.limpiarMensajes();
    this.resetFormulario();
  }

  // --- Catálogos, período y datos ------------------------------------------

  private cargarCatalogos(): void {
    this.service.catalogos().subscribe({
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
        this.valorPuntoListo.set(true);
      },
      error: (err: HttpErrorResponse) => {
        this.valorPunto.set(null);
        this.valorPuntoListo.set(true);
        this.error.set(this.mensajeHttp(err, 'No se pudo obtener el valor del punto del período.'));
      }
    });
  }

  cambiarPeriodo(delta: number): void {
    this.periodo.set(sumarMes(this.periodo(), delta));
    this.cargarValorPunto();
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
        this.error.set(this.mensajeHttp(err, 'No se pudieron cargar los cargos ETEC del agente.'));
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
  }

  resetFormulario(): void {
    this.seleccionado.set(null);
    this.fechaAlta.set(fechaHoy());
    this.fechaBaja.set('');
    this.categoriaId.set(null);
    this.dependenciaId.set(null);
    this.observaciones.set('');
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
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(
          err.status === 409
            ? 'Ya existe una asignación vigente de ese cargo ETEC para el agente.'
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
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(this.mensajeHttp(err, 'No se pudo eliminar el cargo ETEC.'));
        this.guardando.set(false);
      }
    });
  }

  // --- Presentación -------------------------------------------------------

  textoFechaValor(valor: string | null | undefined): string {
    return textoFecha(valor);
  }

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
    return puntos * valor;
  }

  estadoDe(asignacion: AsignacionEtec): string {
    return estadoAsignacion(asignacion);
  }

  private limpiarMensajes(): void {
    this.error.set(null);
    this.exito.set(null);
  }

  private mensajeHttp(error: unknown, porDefecto: string): string {
    return mensajeDeError(error, porDefecto);
  }
}
