import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { take } from 'rxjs';

import { AuthService, Persona, PersonaSearchService, periodoTexto } from '@haberes/shared-api';
import { PersonaSearchComponent } from '@haberes/ui-layout';

import { LiquidacionIndividualService } from './liquidacion-individual.service';
import {
  CodigoBusqueda,
  FichaLiquidacionIndividual,
  RESULTADOS_EXITOSOS,
  RegistroNovedadRequest,
  ResultadoProcesoResponse
} from './liquidacion-individual.models';

/**
 * Liquidación individual de un legajo y período.
 *
 * El backend concentra las reglas (bloqueo, control, elegibilidad, semántica S/N, cálculo).
 * La pantalla sólo presenta la ficha, habilita acciones estructurales y muestra el resultado
 * que devuelve cada operación.
 */
@Component({
  selector: 'haberes-liquidacion-individual',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, FormsModule, PersonaSearchComponent],
  templateUrl: './liquidacion-individual.component.html'
})
export class LiquidacionIndividualComponent {
  private readonly auth = inject(AuthService);
  private readonly personas = inject(PersonaSearchService);
  private readonly liquidacion = inject(LiquidacionIndividualService);
  private readonly router = inject(Router);

  anho = signal<number>(new Date().getFullYear());
  mes = signal<number>(new Date().getMonth() + 1);

  persona = signal<Persona | null>(null);
  legajoInput = signal<string>('');
  documentoInput = signal<string>('');

  ficha = signal<FichaLiquidacionIndividual | null>(null);
  forzar = signal<boolean>(false);
  cargando = signal<boolean>(false);
  procesando = signal<boolean>(false);
  error = signal<string | null>(null);
  exito = signal<string | null>(null);

  codigoTexto = signal<string>('');
  codigos = signal<CodigoBusqueda[]>([]);
  codigoSeleccionado = signal<CodigoBusqueda | null>(null);
  importeTexto = signal<string>('');
  observaciones = signal<string>('');

  legajoSolicitante = signal<number | null>(null);

  readonly hayFicha = computed(() => this.ficha() !== null);
  readonly acciones = computed(() => this.ficha()?.acciones ?? null);

  readonly estadoTexto = computed(() => {
    const persona = this.ficha()?.persona;
    if (!persona) {
      return '—';
    }
    return `${persona.estado ?? '—'} / ${persona.liquida ?? '—'}`;
  });

  readonly antiguedadTexto = computed(() => {
    const antiguedad = this.ficha()?.antiguedad;
    if (!antiguedad) {
      return '—';
    }
    const indices = `${antiguedad.indiceDocente ?? '—'} / ${antiguedad.indiceAdministrativo ?? '—'}`;
    return `Índices: ${indices} · Antigüedad: ${this.anosMeses(antiguedad.mesesDocentes)} / `
      + `${this.anosMeses(antiguedad.mesesAdministrativos)}`;
  });

  constructor() {
    this.auth.currentUser$.pipe(take(1)).subscribe((usuario) => {
      if (usuario) {
        this.legajoSolicitante.set(usuario.legajoId);
      }
    });
  }

  onPersonaSeleccionada(persona: Persona | null): void {
    if (persona) {
      this.seleccionarPersona(persona);
      return;
    }
    this.persona.set(null);
    this.ficha.set(null);
    this.error.set(null);
  }

  seleccionarPersona(persona: Persona): void {
    this.persona.set(persona);
    this.legajoInput.set(String(persona.legajoId));
    this.documentoInput.set(persona.documento === null || persona.documento === undefined
      ? ''
      : String(persona.documento));
    this.ficha.set(null);
    this.error.set(null);
    this.exito.set(null);
    this.cargarFicha();
  }

  buscarPorLegajo(): void {
    const texto = this.legajoInput().trim();
    if (!/^\d+$/.test(texto)) {
      return;
    }
    const legajoId = Number(texto);
    if (this.persona()?.legajoId === legajoId && this.ficha()) {
      return;
    }
    this.personas.getPersonaByLegajo(legajoId).subscribe({
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
    if (String(this.persona()?.documento ?? '') === texto && this.ficha()) {
      return;
    }
    this.personas.getPersonaByDocumento(texto).subscribe({
      next: (persona) => this.seleccionarPersona(persona),
      error: (err: HttpErrorResponse) =>
        this.error.set(this.mensajeHttp(err, `No se encontró un legajo con el documento ${texto}.`))
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
    if (this.persona()) {
      this.cargarFicha(true);
    }
  }

  cargarFicha(limpiarMensajes = false): void {
    const persona = this.persona();
    if (!persona) {
      return;
    }
    if (limpiarMensajes) {
      this.limpiarMensajes();
    }
    this.cargando.set(true);
    this.liquidacion.ficha(persona.legajoId, this.anho(), this.mes()).subscribe({
      next: (ficha) => {
        this.ficha.set(ficha);
        this.forzar.set(false);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.ficha.set(null);
        this.error.set(this.mensajeHttp(err, 'No se pudo cargar la liquidación del legajo.'));
        this.cargando.set(false);
      }
    });
  }

  generarCargos(): void {
    const persona = this.persona();
    if (!persona || this.procesando()) {
      return;
    }
    this.procesando.set(true);
    this.limpiarMensajes();
    this.liquidacion.generarCargos(persona.legajoId, this.anho(), this.mes(), this.legajoSolicitante())
      .subscribe({
        next: (respuesta) => {
          this.publicarResultado(respuesta);
          this.procesando.set(false);
          this.cargarFicha();
        },
        error: (err: HttpErrorResponse) => {
          this.error.set(this.mensajeHttp(err, 'No se pudieron generar los cargos.'));
          this.procesando.set(false);
        }
      });
  }

  liquidar(): void {
    const persona = this.persona();
    if (!persona || this.procesando()) {
      return;
    }
    if (this.forzar() && !window.confirm('¿Confirma liquidar forzando el bloqueo del período?')) {
      return;
    }
    this.procesando.set(true);
    this.limpiarMensajes();
    this.liquidacion.liquidar(persona.legajoId, this.anho(), this.mes(), this.forzar(), this.legajoSolicitante())
      .subscribe({
        next: (respuesta) => {
          this.publicarResultado(respuesta);
          this.procesando.set(false);
          this.cargarFicha();
        },
        error: (err: HttpErrorResponse) => {
          this.error.set(this.mensajeHttp(err, 'No se pudo liquidar el legajo.'));
          this.procesando.set(false);
        }
      });
  }

  eliminarLiquidacion(): void {
    const persona = this.persona();
    if (!persona || this.procesando()) {
      return;
    }
    if (!window.confirm('¿Confirma eliminar la liquidación del legajo en el período?')) {
      return;
    }
    this.procesando.set(true);
    this.limpiarMensajes();
    this.liquidacion.eliminarLiquidacion(persona.legajoId, this.anho(), this.mes(), this.forzar(),
      this.legajoSolicitante()).subscribe({
      next: (respuesta) => {
        this.publicarResultado(respuesta);
        this.procesando.set(false);
        this.cargarFicha();
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(this.mensajeHttp(err, 'No se pudo eliminar la liquidación.'));
        this.procesando.set(false);
      }
    });
  }

  buscarCodigos(): void {
    const termino = this.codigoTexto().trim();
    this.codigoSeleccionado.set(null);
    if (termino.length < 1) {
      this.codigos.set([]);
      return;
    }
    this.liquidacion.buscarCodigos(termino).subscribe({
      next: (codigos) => this.codigos.set(codigos),
      error: () => this.codigos.set([])
    });
  }

  seleccionarCodigo(codigo: CodigoBusqueda): void {
    this.codigoSeleccionado.set(codigo);
    this.codigoTexto.set(`${codigo.codigoId} - ${codigo.nombre}`);
    this.codigos.set([]);
  }

  agregarNovedad(): void {
    const persona = this.persona();
    const codigo = this.codigoSeleccionado();
    if (!persona) {
      this.error.set('Seleccione un legajo.');
      return;
    }
    if (!codigo) {
      this.error.set('Seleccione un código de la lista.');
      return;
    }
    if (this.procesando()) {
      return;
    }
    this.procesando.set(true);
    this.limpiarMensajes();
    const body: RegistroNovedadRequest = {
      codigoId: codigo.codigoId,
      importe: this.importeNumerico(),
      valor: this.valorSino(),
      observaciones: this.observaciones().trim() || null,
      forzar: this.forzar()
    };
    this.liquidacion.registrarNovedad(persona.legajoId, this.anho(), this.mes(), body,
      this.legajoSolicitante()).subscribe({
      next: (respuesta) => {
        this.publicarResultado(respuesta);
        this.procesando.set(false);
        this.limpiarEditor();
        this.cargarFicha();
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(this.mensajeHttp(err, 'No se pudo guardar la novedad.'));
        this.procesando.set(false);
      }
    });
  }

  eliminarNovedad(novedadId: number): void {
    const persona = this.persona();
    if (!persona || this.procesando()) {
      return;
    }
    if (!window.confirm('¿Confirma eliminar la novedad seleccionada?')) {
      return;
    }
    this.procesando.set(true);
    this.limpiarMensajes();
    this.liquidacion.eliminarNovedad(persona.legajoId, this.anho(), this.mes(), novedadId, this.forzar(),
      this.legajoSolicitante()).subscribe({
      next: (respuesta) => {
        this.publicarResultado(respuesta);
        this.procesando.set(false);
        this.cargarFicha();
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(this.mensajeHttp(err, 'No se pudo eliminar la novedad.'));
        this.procesando.set(false);
      }
    });
  }

  salir(): void {
    void this.router.navigate(['/inicio']);
  }

  periodoLegible(periodo: number | null): string {
    return periodoTexto(periodo);
  }

  fechaLegible(fechaIso: string | null): string {
    if (!fechaIso) {
      return '—';
    }
    const [anho, mes, dia] = fechaIso.slice(0, 10).split('-');
    return `${dia}/${mes}/${anho}`;
  }

  anosMeses(meses: number | null): string {
    if (meses === null || meses === undefined) {
      return '—';
    }
    const anios = Math.floor(meses / 12);
    const resto = meses % 12;
    return `${anios} ${anios === 1 ? 'año' : 'años'} ${resto} ${resto === 1 ? 'mes' : 'meses'}`;
  }

  private publicarResultado(respuesta: ResultadoProcesoResponse | { resultado: string; mensaje: string }): void {
    const exitoso = (RESULTADOS_EXITOSOS as readonly string[]).includes(respuesta.resultado);
    if (exitoso) {
      this.exito.set(respuesta.mensaje);
    } else {
      this.error.set(respuesta.mensaje);
    }
  }

  private limpiarMensajes(): void {
    this.error.set(null);
    this.exito.set(null);
  }

  private limpiarEditor(): void {
    this.codigoTexto.set('');
    this.codigoSeleccionado.set(null);
    this.codigos.set([]);
    this.importeTexto.set('');
    this.observaciones.set('');
  }

  /** {@code "S"} o {@code "N"} cuando el campo de importe trae ese texto. */
  private valorSino(): string | null {
    const texto = this.importeTexto().trim().toUpperCase();
    return texto === 'S' || texto === 'N' ? texto : null;
  }

  private importeNumerico(): number | null {
    if (this.valorSino()) {
      return null;
    }
    const texto = this.importeTexto().trim().replace(',', '.');
    if (texto === '') {
      return null;
    }
    const numero = Number(texto);
    return Number.isFinite(numero) ? numero : null;
  }

  private mensajeHttp(error: HttpErrorResponse, porDefecto: string): string {
    const detalle = typeof error.error?.message === 'string' ? error.error.message : null;
    if (error.status === 0) {
      return 'No hay conexión con el servicio de haberes.';
    }
    return detalle ?? porDefecto;
  }
}
