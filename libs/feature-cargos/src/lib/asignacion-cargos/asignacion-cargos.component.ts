import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { take } from 'rxjs';

import { AuthService, Persona, PersonaSearchService, mensajeDeError } from '@haberes/shared-api';
import { PersonaSearchComponent } from '@haberes/ui-layout';

import { AsignacionCargosService } from './asignacion-cargos.service';
import {
  Cargo,
  CargoRequest,
  Categoria,
  Dependencia,
  Facultad,
  PersonaFacultad,
  fechaHoy,
  fechaInput,
  fechaPayload,
  textoFecha,
  textoJornada
} from './asignacion-cargos.models';

/**
 * Asignación de Cargos No Docentes de un agente.
 *
 * Misma operación que el formulario legado: alta, actualización y baja de
 * cargos del legajo y habilitación/remoción de sus facultades. Las reglas de
 * jornada y horas según `liquidaPorHora` se aplican en la pantalla; el backend
 * valida el resto. Los cargos con puntos (ETEC) tienen su propia pantalla.
 */
@Component({
  selector: 'haberes-asignacion-cargos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, FormsModule, PersonaSearchComponent],
  templateUrl: './asignacion-cargos.component.html'
})
export class AsignacionCargosComponent {
  private readonly auth = inject(AuthService);
  private readonly personas = inject(PersonaSearchService);
  private readonly service = inject(AsignacionCargosService);

  readonly persona = signal<Persona | null>(null);
  readonly legajoInput = signal<string>('');
  readonly documentoInput = signal<string>('');

  readonly cargos = signal<Cargo[]>([]);
  readonly facultadesHabilitadas = signal<PersonaFacultad[]>([]);

  readonly categorias = signal<Categoria[]>([]);
  readonly dependencias = signal<Dependencia[]>([]);
  readonly facultades = signal<Facultad[]>([]);

  readonly seleccionado = signal<Cargo | null>(null);

  readonly fechaAlta = signal<string>(fechaHoy());
  readonly fechaBaja = signal<string>('');
  readonly categoriaId = signal<number | null>(null);
  readonly dependenciaId = signal<number | null>(null);
  readonly jornada = signal<number>(1);
  readonly horasJornada = signal<number>(0);
  readonly presentismo = signal<number>(0);

  readonly facultadSeleccionada = signal<number | null>(null);

  readonly cargando = signal<boolean>(false);
  readonly guardandoCargo = signal<boolean>(false);
  readonly guardandoFacultad = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly exito = signal<string | null>(null);

  readonly legajoSolicitante = signal<number | null>(null);

  readonly hayPersona = computed(() => this.persona() !== null);
  readonly editando = computed(() => this.seleccionado() !== null);

  readonly categoriaSeleccionada = computed<Categoria | null>(() => {
    const categoriaId = this.categoriaId();
    if (categoriaId === null) {
      return null;
    }
    return this.categorias().find((categoria) => categoria.categoriaId === categoriaId) ?? null;
  });

  readonly liquidaPorHora = computed(() => this.categoriaSeleccionada()?.liquidaPorHora === 1);

  readonly facultadesDisponibles = computed(() => {
    const habilitadas = new Set(this.facultadesHabilitadas().map((item) => item.facultadId));
    return this.facultades().filter((facultad) => !habilitadas.has(facultad.facultadId));
  });

  readonly puedeGuardar = computed(() =>
    this.hayPersona()
    && !this.guardandoCargo()
    && this.fechaAlta().length > 0
    && this.categoriaId() !== null
    && this.dependenciaId() !== null
  );

  readonly puedeHabilitar = computed(() =>
    this.hayPersona() && !this.guardandoFacultad() && this.facultadSeleccionada() !== null
  );

  constructor() {
    this.auth.currentUser$.pipe(take(1)).subscribe((usuario) => {
      if (usuario) {
        this.legajoSolicitante.set(usuario.legajoId);
      }
    });
    this.cargarCatalogos();
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
    this.facultadSeleccionada.set(null);
    this.resetFormulario();
    this.cargarCargos();
    this.cargarFacultades();
  }

  private limpiarPersona(): void {
    this.persona.set(null);
    this.legajoInput.set('');
    this.documentoInput.set('');
    this.cargos.set([]);
    this.facultadesHabilitadas.set([]);
    this.facultadSeleccionada.set(null);
    this.limpiarMensajes();
    this.resetFormulario();
  }

  // --- Catálogos y datos ---------------------------------------------------

  private cargarCatalogos(): void {
    this.service.catalogos().subscribe({
      next: (catalogos) => {
        this.categorias.set(catalogos.categorias);
        this.dependencias.set(catalogos.dependencias);
        this.facultades.set(catalogos.facultades);
      },
      error: (err: HttpErrorResponse) =>
        this.error.set(this.mensajeHttp(err, 'No se pudieron cargar los catálogos del formulario.'))
    });
  }

  private cargarCargos(): void {
    const persona = this.persona();
    if (!persona) {
      return;
    }
    this.cargando.set(true);
    this.service.cargos(persona.legajoId).subscribe({
      next: (cargos) => {
        this.cargos.set(cargos);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.cargos.set([]);
        this.error.set(this.mensajeHttp(err, 'No se pudieron cargar los cargos del agente.'));
        this.cargando.set(false);
      }
    });
  }

  private cargarFacultades(): void {
    const persona = this.persona();
    if (!persona) {
      return;
    }
    this.service.facultadesDe(persona.legajoId).subscribe({
      next: (facultades) => this.facultadesHabilitadas.set(facultades),
      error: (err: HttpErrorResponse) =>
        this.error.set(this.mensajeHttp(err, 'No se pudieron cargar las facultades habilitadas.'))
    });
  }

  // --- Formulario de cargo -------------------------------------------------

  onCategoria(categoriaId: number | null): void {
    this.categoriaId.set(categoriaId);
    if (this.liquidaPorHora()) {
      this.jornada.set(1);
      return;
    }
    this.jornada.set(this.jornada() === 2 ? 2 : 1);
    this.horasJornada.set(0);
  }

  seleccionarCargo(cargo: Cargo): void {
    this.seleccionado.set(cargo);
    this.fechaAlta.set(fechaInput(cargo.fechaAlta));
    this.fechaBaja.set(fechaInput(cargo.fechaBaja));
    this.categoriaId.set(cargo.categoriaId);
    this.dependenciaId.set(cargo.dependenciaId);
    this.jornada.set(cargo.jornada === 2 ? 2 : 1);
    this.horasJornada.set(Number(cargo.horasJornada ?? 0));
    this.presentismo.set(Number(cargo.presentismo ?? 0));
    this.limpiarMensajes();
  }

  resetFormulario(): void {
    this.seleccionado.set(null);
    this.fechaAlta.set(fechaHoy());
    this.fechaBaja.set('');
    this.categoriaId.set(null);
    this.dependenciaId.set(null);
    this.jornada.set(1);
    this.horasJornada.set(0);
    this.presentismo.set(0);
  }

  guardarCargo(): void {
    const persona = this.persona();
    if (!persona || !this.puedeGuardar()) {
      return;
    }
    const actual = this.seleccionado();
    const body: CargoRequest = {
      legajoId: persona.legajoId,
      fechaAlta: fechaPayload(actual?.fechaAlta, this.fechaAlta()),
      fechaBaja: this.fechaBaja() ? fechaPayload(actual?.fechaBaja, this.fechaBaja()) : null,
      dependenciaId: this.dependenciaId() as number,
      categoriaId: this.categoriaId() as number,
      jornada: this.liquidaPorHora() ? 1 : this.jornada(),
      presentismo: Number(this.presentismo()) || 0,
      horasJornada: this.liquidaPorHora() ? Number(this.horasJornada()) || 0 : 0
    };

    this.guardandoCargo.set(true);
    this.limpiarMensajes();
    const operacion = actual
      ? this.service.actualizarCargo(actual.cargoId, body, this.legajoSolicitante())
      : this.service.agregarCargo(body, this.legajoSolicitante());

    operacion.subscribe({
      next: () => {
        this.exito.set(actual ? 'Cargo actualizado.' : 'Cargo agregado.');
        this.guardandoCargo.set(false);
        this.resetFormulario();
        this.cargarCargos();
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(this.mensajeHttp(err, 'No se pudo guardar el cargo.'));
        this.guardandoCargo.set(false);
      }
    });
  }

  eliminarCargo(): void {
    const actual = this.seleccionado();
    const persona = this.persona();
    if (!actual || !persona) {
      return;
    }
    const categoria = actual.categoria?.nombre ?? 'sin categoría';
    if (!window.confirm(`¿Eliminar el cargo ${categoria} del legajo ${persona.legajoId}?`)) {
      return;
    }
    this.guardandoCargo.set(true);
    this.limpiarMensajes();
    this.service.eliminarCargo(actual.cargoId, this.legajoSolicitante()).subscribe({
      next: () => {
        this.exito.set('Cargo eliminado.');
        this.guardandoCargo.set(false);
        this.resetFormulario();
        this.cargarCargos();
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(this.mensajeHttp(err, 'No se pudo eliminar el cargo.'));
        this.guardandoCargo.set(false);
      }
    });
  }

  // --- Facultades habilitadas ---------------------------------------------

  habilitarFacultad(): void {
    const persona = this.persona();
    const facultadId = this.facultadSeleccionada();
    if (!persona || facultadId === null || !this.puedeHabilitar()) {
      return;
    }
    this.guardandoFacultad.set(true);
    this.limpiarMensajes();
    this.service.habilitarFacultad(persona.legajoId, facultadId, this.legajoSolicitante()).subscribe({
      next: () => {
        this.exito.set('Facultad habilitada.');
        this.facultadSeleccionada.set(null);
        this.guardandoFacultad.set(false);
        this.cargarFacultades();
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(
          err.status === 409
            ? 'La facultad ya está habilitada para este agente.'
            : this.mensajeHttp(err, 'No se pudo habilitar la facultad.')
        );
        this.guardandoFacultad.set(false);
      }
    });
  }

  quitarFacultad(item: PersonaFacultad): void {
    const persona = this.persona();
    if (!persona) {
      return;
    }
    const nombre = item.facultad?.nombre ?? `facultad ${item.facultadId}`;
    if (!window.confirm(`¿Quitar la facultad ${nombre} al legajo ${persona.legajoId}?`)) {
      return;
    }
    this.guardandoFacultad.set(true);
    this.limpiarMensajes();
    this.service.quitarFacultad(persona.legajoId, item.facultadId, this.legajoSolicitante()).subscribe({
      next: () => {
        this.exito.set('Facultad quitada.');
        this.guardandoFacultad.set(false);
        this.cargarFacultades();
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(this.mensajeHttp(err, 'No se pudo quitar la facultad.'));
        this.guardandoFacultad.set(false);
      }
    });
  }

  // --- Presentación -------------------------------------------------------

  textoFechaValor(valor: string | null | undefined): string {
    return textoFecha(valor);
  }

  jornadaTexto(cargo: Cargo): string {
    return textoJornada(cargo.jornada, cargo.horasJornada);
  }

  tipoCategoria(cargo: Cargo): string {
    return cargo.categoria?.docente === 1 ? 'Docente' : 'No docente';
  }

  nombreCategoria(cargo: Cargo): string {
    return cargo.categoria?.nombre ?? '—';
  }

  nombreDependencia(cargo: Cargo): string {
    return cargo.dependencia?.acronimo || cargo.dependencia?.nombre || '—';
  }

  private limpiarMensajes(): void {
    this.error.set(null);
    this.exito.set(null);
  }

  private mensajeHttp(error: unknown, porDefecto: string): string {
    return mensajeDeError(error, porDefecto);
  }
}
