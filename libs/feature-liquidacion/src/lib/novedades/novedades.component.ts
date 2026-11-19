import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { concatMap, from, take, tap } from 'rxjs';

import { AuthService, Persona, PersonaSearchService } from '@haberes/shared-api';
import { PersonaSearchComponent } from '@haberes/ui-layout';

import { CodigoBusqueda } from '../liquidacion-individual/liquidacion-individual.models';
import { NovedadesService } from './novedades.service';
import {
  AcreditacionPeriodo,
  Novedad,
  NovedadPendiente,
  NovedadRequest
} from './novedades.models';

/**
 * Novedades de haberes por código y período.
 *
 * Replica el circuito operativo del formulario de novedades: consulta por código, alta o
 * actualización por clave única (legajo + período + código + dependencia), bajas, carga
 * masiva desde Excel (subir → revisar → importar → desimportar) y transferencia del mes
 * anterior. El período acreditado (`acreditado = 1`) bloquea todas las escrituras.
 */
@Component({
  selector: 'haberes-novedades',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, FormsModule, PersonaSearchComponent],
  templateUrl: './novedades.component.html'
})
export class NovedadesComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly personas = inject(PersonaSearchService);
  private readonly servicio = inject(NovedadesService);

  anho = signal<number>(new Date().getFullYear());
  mes = signal<number>(new Date().getMonth() + 1);

  acreditacion = signal<AcreditacionPeriodo | null>(null);
  acreditacionVerificada = signal<boolean>(false);
  acreditacionError = signal<boolean>(false);

  codigoTexto = signal<string>('');
  codigos = signal<CodigoBusqueda[]>([]);
  codigoSeleccionado = signal<CodigoBusqueda | null>(null);

  novedades = signal<Novedad[]>([]);
  novedadSeleccionada = signal<Novedad | null>(null);

  persona = signal<Persona | null>(null);
  legajoInput = signal<string>('');
  documentoInput = signal<string>('');

  importeTexto = signal<string>('');
  observaciones = signal<string>('');

  pendientes = signal<NovedadPendiente[]>([]);
  pendientesVisibles = signal<boolean>(false);

  archivo = signal<File | null>(null);
  stepByStep = signal<boolean>(false);

  avisos = signal<string[]>([]);
  error = signal<string | null>(null);
  exito = signal<string | null>(null);
  cargando = signal<boolean>(false);
  procesando = signal<boolean>(false);
  progreso = signal<string | null>(null);

  legajoSolicitante = signal<number | null>(null);

  readonly periodoCerrado = computed(() => this.acreditacion()?.acreditado === 1);

  /**
   * Las escrituras sólo se habilitan cuando el estado del período se pudo verificar y no
   * está acreditado: si la consulta falla, no se opera a ciegas sobre un período que podría
   * estar cerrado.
   */
  readonly puedeEscribir = computed(() =>
    this.acreditacionVerificada() && !this.acreditacionError() && !this.periodoCerrado()
  );

  readonly motivoCierre = computed(() => this.periodoCerrado()
    ? 'El período está acreditado: las novedades quedan en modo consulta.'
    : this.acreditacionError()
      ? 'No se pudo verificar el estado del período: las escrituras están deshabilitadas.'
      : null
  );

  readonly avisoPlazo = computed(() => {
    if (this.periodoCerrado()) {
      return null;
    }
    const limite = this.acreditacion()?.limiteNovedades ?? null;
    if (!limite) {
      return null;
    }
    if (limite.slice(0, 10) >= this.hoyIso()) {
      return null;
    }
    return `El plazo de carga de novedades venció el ${this.fechaLegible(limite)}. `
      + 'El período sigue abierto: puede operar igualmente.';
  });

  readonly total = computed(() =>
    this.novedades().reduce((suma, novedad) => suma + (novedad.importe ?? 0), 0)
  );

  readonly legajosInexistentes = computed(() => [
    ...new Set(this.pendientes().filter((pendiente) => !pendiente.persona).map((pendiente) => pendiente.legajoId))
  ]);

  readonly archivoNombre = computed(() => this.archivo()?.name ?? null);

  readonly periodoActualTexto = computed(() =>
    `${String(this.mes()).padStart(2, '0')}/${this.anho()}`
  );

  constructor() {
    this.auth.currentUser$.pipe(take(1)).subscribe((usuario) => {
      if (usuario) {
        this.legajoSolicitante.set(usuario.legajoId);
      }
    });
  }

  ngOnInit(): void {
    this.cargarAcreditacion();
  }

  // --- Período -------------------------------------------------------------------------

  aplicarPeriodo(): void {
    const mes = Math.trunc(this.mes());
    const anho = Math.trunc(this.anho());
    if (!Number.isFinite(mes) || mes < 1 || mes > 12
      || !Number.isFinite(anho) || anho < 2000 || anho > 2100) {
      this.error.set('Ingrese un mes entre 1 y 12 y un año entre 2000 y 2100.');
      return;
    }
    this.mes.set(mes);
    this.anho.set(anho);
    this.novedadSeleccionada.set(null);
    this.limpiarMensajes();
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
    this.novedadSeleccionada.set(null);
    this.limpiarMensajes();
    this.cargarPeriodo();
  }

  private cargarPeriodo(): void {
    this.cargarAcreditacion();
    this.cargarNovedades();
    if (this.pendientesVisibles()) {
      this.cargarPendientes();
    }
  }

  private cargarAcreditacion(): void {
    this.acreditacionVerificada.set(false);
    this.acreditacionError.set(false);
    this.servicio.acreditacionDelPeriodo(this.anho(), this.mes()).subscribe({
      next: (acreditacion) => {
        this.acreditacion.set(acreditacion);
        this.acreditacionVerificada.set(true);
      },
      error: (err: HttpErrorResponse) => {
        this.acreditacion.set(null);
        this.acreditacionError.set(true);
        this.acreditacionVerificada.set(true);
        this.error.set(this.mensajeHttp(err, 'No se pudo verificar el estado del período.'));
      }
    });
  }

  // --- Código y grilla -----------------------------------------------------------------

  buscarCodigos(): void {
    const termino = this.codigoTexto().trim();
    this.codigoSeleccionado.set(null);
    this.novedadSeleccionada.set(null);
    if (termino.length < 1) {
      this.codigos.set([]);
      this.novedades.set([]);
      return;
    }
    this.servicio.buscarCodigos(termino).subscribe({
      next: (codigos) => this.codigos.set(codigos),
      error: () => this.codigos.set([])
    });
  }

  seleccionarCodigo(codigo: CodigoBusqueda): void {
    this.codigoSeleccionado.set(codigo);
    this.codigoTexto.set(`${codigo.codigoId} - ${codigo.nombre}`);
    this.codigos.set([]);
    this.novedadSeleccionada.set(null);
    this.limpiarMensajes();
    this.cargarNovedades();
  }

  cargarNovedades(): void {
    const codigo = this.codigoSeleccionado();
    if (!codigo) {
      this.novedades.set([]);
      return;
    }
    this.cargando.set(true);
    this.servicio.novedadesPorCodigo(codigo.codigoId, this.anho(), this.mes()).subscribe({
      next: (novedades) => {
        this.novedades.set(novedades);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.novedades.set([]);
        this.error.set(this.mensajeHttp(err, 'No se pudieron cargar las novedades del código.'));
        this.cargando.set(false);
      }
    });
  }

  // --- Persona -------------------------------------------------------------------------

  onPersonaSeleccionada(persona: Persona | null): void {
    if (persona) {
      this.seleccionarPersona(persona);
      return;
    }
    this.persona.set(null);
    this.error.set(null);
  }

  seleccionarPersona(persona: Persona): void {
    this.persona.set(persona);
    this.legajoInput.set(String(persona.legajoId));
    this.documentoInput.set(persona.documento === null || persona.documento === undefined
      ? ''
      : String(persona.documento));
    this.error.set(null);
  }

  buscarPorLegajo(): void {
    const texto = this.legajoInput().trim();
    if (!/^\d+$/.test(texto)) {
      return;
    }
    const legajoId = Number(texto);
    if (this.persona()?.legajoId === legajoId) {
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
    if (String(this.persona()?.documento ?? '') === texto) {
      return;
    }
    this.personas.getPersonaByDocumento(texto).subscribe({
      next: (persona) => this.seleccionarPersona(persona),
      error: (err: HttpErrorResponse) =>
        this.error.set(this.mensajeHttp(err, `No se encontró un legajo con el documento ${texto}.`))
    });
  }

  /** Carga la fila en el editor sin cambiar el código seleccionado. */
  seleccionarNovedad(novedad: Novedad): void {
    this.novedadSeleccionada.set(novedad);
    this.observaciones.set(novedad.observaciones ?? '');
    this.importeTexto.set(novedad.value === 'S' || novedad.value === 'N'
      ? novedad.value
      : novedad.importe === null
        ? ''
        : String(novedad.importe));
    const persona = novedad.persona ?? null;
    if (persona) {
      this.seleccionarPersona(persona);
      return;
    }
    this.legajoInput.set(String(novedad.legajoId));
    this.personas.getPersonaByLegajo(novedad.legajoId).subscribe({
      next: (completa) => this.seleccionarPersona(completa),
      error: () => this.persona.set(null)
    });
  }

  // --- Alta / actualización -------------------------------------------------------------

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
    if (!this.puedeEscribir() || this.procesando()) {
      return;
    }
    this.procesando.set(true);
    this.limpiarMensajes();
    const { importe, value } = this.leerImporte();

    this.servicio.novedadUnica(persona.legajoId, this.anho(), this.mes(), codigo.codigoId).subscribe({
      next: (existente) => {
        // El endpoint de clave única puede no encontrar filas con dependencia nula; en ese
        // caso la grilla ya cargada es la fuente para actualizar en lugar de duplicar.
        const destino = existente ?? this.buscarEnGrilla(persona.legajoId, codigo.codigoId);
        const body: NovedadRequest = {
          legajoId: persona.legajoId,
          anho: this.anho(),
          mes: this.mes(),
          codigoId: codigo.codigoId,
          dependenciaId: destino?.dependenciaId ?? null,
          importe,
          value,
          observaciones: this.observaciones(),
          importado: destino?.importado ?? 0,
          novedadUploadId: destino?.novedadUploadId ?? null
        };
        const peticion = destino
          ? this.servicio.actualizar(destino.novedadId, body, this.legajoSolicitante())
          : this.servicio.crear(body, this.legajoSolicitante());
        peticion.subscribe({
          next: () => {
            this.exito.set(destino ? 'Novedad actualizada.' : 'Novedad agregada.');
            this.procesando.set(false);
            this.novedadSeleccionada.set(null);
            this.cargarNovedades();
          },
          error: (err: HttpErrorResponse) => {
            this.error.set(this.mensajeHttp(err, 'No se pudo guardar la novedad.'));
            this.procesando.set(false);
          }
        });
      },
      error: (err: HttpErrorResponse) => {
        this.procesando.set(false);
        this.error.set(this.mensajeHttp(err,
          'No se pudo verificar la clave única de la novedad (puede haber filas duplicadas).'));
      }
    });
  }

  eliminarSeleccionada(): void {
    const novedad = this.novedadSeleccionada();
    if (!novedad || !this.puedeEscribir() || this.procesando()) {
      return;
    }
    if (!window.confirm(`¿Confirma eliminar la novedad del legajo ${novedad.legajoId}?`)) {
      return;
    }
    this.procesando.set(true);
    this.limpiarMensajes();
    this.servicio.eliminar(novedad.novedadId, this.legajoSolicitante()).subscribe({
      next: () => {
        this.exito.set('Novedad eliminada.');
        this.novedadSeleccionada.set(null);
        this.procesando.set(false);
        this.cargarNovedades();
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(this.mensajeHttp(err, 'No se pudo eliminar la novedad.'));
        this.procesando.set(false);
      }
    });
  }

  /** Baja de todo el período: la confirmación exige escribir `MM/AAAA`. */
  eliminarTodas(): void {
    if (!this.puedeEscribir() || this.procesando()) {
      return;
    }
    const esperado = this.periodoActualTexto();
    const respuesta = window.prompt(
      `Esta acción elimina TODAS las novedades del período ${esperado}, de todos los códigos.\n`
      + `Escriba ${esperado} para confirmar:`
    );
    if (respuesta === null) {
      return;
    }
    if (respuesta.trim() !== esperado) {
      this.error.set(`La confirmación no coincide con ${esperado}: no se eliminó nada.`);
      return;
    }
    this.procesando.set(true);
    this.limpiarMensajes();
    this.servicio.eliminarPeriodo(this.anho(), this.mes(), this.legajoSolicitante()).subscribe({
      next: () => {
        this.exito.set(`Se eliminaron todas las novedades del período ${esperado}.`);
        this.novedadSeleccionada.set(null);
        this.procesando.set(false);
        this.cargarNovedades();
        this.cargarPendientes();
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(this.mensajeHttp(err, 'No se pudieron eliminar las novedades del período.'));
        this.procesando.set(false);
      }
    });
  }

  // --- Excel ---------------------------------------------------------------------------

  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.archivo.set(input.files?.[0] ?? null);
    this.avisos.set([]);
  }

  subirArchivo(): void {
    if (!this.puedeEscribir() || this.procesando()) {
      return;
    }
    const archivo = this.archivo();
    if (!archivo) {
      this.error.set('Seleccione una planilla .xlsx.');
      return;
    }
    const lector = new FileReader();
    lector.onload = () => {
      const dataUrl = String(lector.result ?? '');
      const base64 = dataUrl.includes(',') ? dataUrl.slice(dataUrl.indexOf(',') + 1) : dataUrl;
      this.enviarArchivo(base64);
    };
    lector.onerror = () => this.error.set('No se pudo leer el archivo seleccionado.');
    lector.readAsDataURL(archivo);
  }

  /** Envía la planilla ya codificada (la lectura del archivo queda en `subirArchivo`). */
  enviarArchivo(base64: string): void {
    const archivo = this.archivo();
    if (!archivo) {
      this.error.set('Seleccione una planilla .xlsx.');
      return;
    }
    this.procesando.set(true);
    this.limpiarMensajes();
    this.servicio.subirArchivo(
      { filename: archivo.name, base64 },
      this.anho(),
      this.mes(),
      this.stepByStep(),
      this.legajoSolicitante()
    ).subscribe({
      next: (texto) => {
        const avisos = this.textoAVisos(texto);
        this.avisos.set(avisos);
        this.exito.set(avisos.length === 0
          ? 'Planilla subida correctamente.'
          : 'Planilla procesada. Revise los avisos antes de importar.');
        this.procesando.set(false);
        this.pendientesVisibles.set(true);
        this.cargarNovedades();
        this.cargarPendientes();
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(this.mensajeHttp(err, 'No se pudo subir la planilla.'));
        this.procesando.set(false);
      }
    });
  }

  revisarPendientes(): void {
    this.pendientesVisibles.set(true);
    this.cargarPendientes(true);
  }

  private cargarPendientes(mostrarResultado = false): void {
    this.servicio.pendientesDeImportar(this.anho(), this.mes()).subscribe({
      next: (pendientes) => {
        this.pendientes.set(pendientes);
        if (mostrarResultado) {
          this.exito.set(pendientes.length === 0
            ? 'No hay novedades pendientes de importar.'
            : `${pendientes.length} ${pendientes.length === 1 ? 'novedad pendiente' : 'novedades pendientes'} de importar.`);
        }
      },
      error: (err: HttpErrorResponse) => {
        this.pendientes.set([]);
        this.error.set(this.mensajeHttp(err, 'No se pudieron cargar las novedades pendientes.'));
      }
    });
  }

  importar(): void {
    if (!this.puedeEscribir() || this.procesando()) {
      return;
    }
    if (!window.confirm('¿Confirma importar las novedades pendientes del período?')) {
      return;
    }
    this.procesando.set(true);
    this.limpiarMensajes();
    this.servicio.importar(this.anho(), this.mes(), this.legajoSolicitante()).subscribe({
      next: () => {
        this.exito.set('Novedades importadas.');
        this.procesando.set(false);
        this.cargarNovedades();
        this.cargarPendientes();
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(err.status === 409
          ? 'No se pudo importar: la planilla repite una clave única (legajo, código y dependencia).'
          : this.mensajeHttp(err, 'No se pudo importar la planilla. Revise claves duplicadas en el período.'));
        this.procesando.set(false);
      }
    });
  }

  /**
   * Desimporta igual que el legacy: elimina todas las filas `importado = 1` del período
   * (tanto las importadas por Excel como las transferidas), en secuencia.
   */
  desimportar(): void {
    if (!this.puedeEscribir() || this.procesando()) {
      return;
    }
    if (!window.confirm('¿Confirma desimportar? Se eliminarán las novedades importadas y transferidas del período.')) {
      return;
    }
    this.procesando.set(true);
    this.limpiarMensajes();
    this.progreso.set(null);
    this.servicio.importadasDelPeriodo(this.anho(), this.mes()).subscribe({
      next: (importadas) => {
        if (importadas.length === 0) {
          this.procesando.set(false);
          this.exito.set('No hay novedades importadas ni transferidas en el período.');
          return;
        }
        let eliminadas = 0;
        from(importadas).pipe(
          concatMap((novedad) => this.servicio.eliminar(novedad.novedadId, this.legajoSolicitante()).pipe(
            tap(() => {
              eliminadas++;
              this.progreso.set(`${eliminadas}/${importadas.length}`);
            })
          ))
        ).subscribe({
          next: () => undefined,
          error: (err: HttpErrorResponse) => {
            this.error.set(this.mensajeHttp(err,
              `No se pudo desimportar: se eliminaron ${eliminadas} de ${importadas.length} novedades.`));
            this.procesando.set(false);
            this.progreso.set(null);
            this.cargarNovedades();
          },
          complete: () => {
            this.exito.set(`Se eliminaron ${eliminadas} novedades importadas del período.`);
            this.procesando.set(false);
            this.progreso.set(null);
            this.cargarNovedades();
            this.cargarPendientes();
          }
        });
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(this.mensajeHttp(err, 'No se pudieron leer las novedades importadas.'));
        this.procesando.set(false);
      }
    });
  }

  transferirAnterior(): void {
    if (!this.puedeEscribir() || this.procesando()) {
      return;
    }
    const origen = this.periodoAnteriorTexto();
    if (!window.confirm(`¿Confirma transferir al período ${this.periodoActualTexto()} las novedades `
      + `transferibles de ${origen}?`)) {
      return;
    }
    this.procesando.set(true);
    this.limpiarMensajes();
    this.servicio.transferir(this.anho(), this.mes(), this.legajoSolicitante()).subscribe({
      next: () => {
        this.exito.set(`Novedades transferidas desde ${origen}.`);
        this.procesando.set(false);
        this.cargarNovedades();
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(this.mensajeHttp(err, 'No se pudieron transferir las novedades del mes anterior.'));
        this.procesando.set(false);
      }
    });
  }

  // --- Presentación --------------------------------------------------------------------

  fechaLegible(fechaIso: string | null): string {
    if (!fechaIso) {
      return '—';
    }
    const [anho, mes, dia] = fechaIso.slice(0, 10).split('-');
    return `${dia}/${mes}/${anho}`;
  }

  nombrePersona(persona: Persona | null | undefined, legajoId: number): string {
    if (!persona) {
      return `Legajo ${legajoId}`;
    }
    return `${persona.apellido}, ${persona.nombre}`;
  }

  nombreCodigo(novedad: Novedad | NovedadPendiente, codigoId: number): string {
    return novedad.codigo?.nombre ?? `Código ${codigoId}`;
  }

  nombreDependencia(novedad: NovedadPendiente): string {
    return novedad.dependencia?.acronimo ?? novedad.dependencia?.nombre ?? '—';
  }

  // --- Auxiliares ----------------------------------------------------------------------

  private periodoAnteriorTexto(): string {
    let mes = this.mes() - 1;
    let anho = this.anho();
    if (mes < 1) {
      mes = 12;
      anho--;
    }
    return `${String(mes).padStart(2, '0')}/${anho}`;
  }

  private buscarEnGrilla(legajoId: number, codigoId: number): Novedad | null {
    return this.novedades().find((novedad) => novedad.legajoId === legajoId
      && novedad.codigoId === codigoId
      && novedad.dependenciaId === null) ?? null;
  }

  /** `S`/`N` → importe 0 y `value` con la letra; importe vacío → 0 (contrato del legacy). */
  private leerImporte(): { importe: number; value: string } {
    const texto = this.importeTexto().trim();
    const mayusculas = texto.toUpperCase();
    if (mayusculas === 'S' || mayusculas === 'N') {
      return { importe: 0, value: mayusculas };
    }
    if (texto === '') {
      return { importe: 0, value: '' };
    }
    const numero = Number(texto.replace(',', '.'));
    return { importe: Number.isFinite(numero) ? numero : 0, value: '' };
  }

  private textoAVisos(texto: string): string[] {
    return texto
      .split('\n')
      .map((linea) => linea.trim())
      .filter((linea) => linea.length > 0);
  }

  private hoyIso(): string {
    const hoy = new Date();
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
  }

  private limpiarMensajes(): void {
    this.error.set(null);
    this.exito.set(null);
    this.avisos.set([]);
  }

  private mensajeHttp(error: HttpErrorResponse, porDefecto: string): string {
    if (error.status === 0) {
      return 'No hay conexión con el servicio de haberes.';
    }
    // Los endpoints de archivo responden texto plano, también en los errores.
    if (typeof error.error === 'string') {
      const texto = error.error.trim();
      const mensaje = texto.startsWith('{') ? this.mensajeDeJson(texto) : texto;
      if (mensaje) {
        return mensaje;
      }
    }
    const detalle = typeof error.error?.message === 'string' ? error.error.message : null;
    return detalle ?? porDefecto;
  }

  private mensajeDeJson(texto: string): string | null {
    try {
      const json = JSON.parse(texto) as { message?: unknown };
      return typeof json.message === 'string' && json.message.trim() !== '' ? json.message : null;
    } catch {
      return null;
    }
  }
}
