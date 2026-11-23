import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, of, switchMap } from 'rxjs';
import { fechaInput, fechaPayload, mensajeDeError } from '@haberes/shared-api';
import { ImportePipe, InputFechaComponent, StickyFooterDirective } from '@haberes/ui-layout';

import {
  CAMPOS_CONTROL_ETEC,
  CAMPOS_IMPORTE,
  CampoControlEtec,
  CategoriaHoraEtec,
  ControlEtec,
  ControlEtecRequest,
  ControlPeriodo,
  ControlPeriodoForm,
  ControlPeriodoRequest,
  EscalaArraigoEtec,
  EscalaHoraEtec,
  ImportesControl,
  ModoLiquidacion,
  SECCIONES_IMPORTES,
  controlEtecVacio,
  importesVacios,
  mesAnterior,
  mesSiguiente,
  textoPeriodo,
  tramoHoraVacio,
} from './control-periodo.models';
import { ControlPeriodoService } from './control-periodo.service';

/**
 * Control del período: registro único por `(año, mes)` con los parámetros que
 * consume la liquidación (fechas, alícuotas, topes SIJP y modo de liquidación).
 *
 * Se navega con `<` / `>` y se edita el período vigente; no hay listado. Si el
 * período está vacío se puede crear desde cero o copiar el mes anterior.
 */
@Component({
  selector: 'lib-control-periodo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [FormsModule, InputFechaComponent, ImportePipe, StickyFooterDirective],
  templateUrl: './control-periodo.component.html',
})
export class ControlPeriodoComponent implements OnInit {
  private readonly service = inject(ControlPeriodoService);

  readonly secciones = SECCIONES_IMPORTES;
  readonly camposEtec = CAMPOS_CONTROL_ETEC;
  readonly anho = signal(new Date().getFullYear());
  readonly mes = signal(new Date().getMonth() + 1);
  readonly modos = signal<ModoLiquidacion[]>([]);
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly copiando = signal(false);
  readonly esNuevo = signal(true);
  readonly avisoFechas = signal(false);
  readonly error = signal('');
  readonly mensaje = signal('');
  readonly controlEtec = signal<ControlEtec | null>(null);
  readonly escalaArraigo = signal<EscalaArraigoEtec[]>([]);
  readonly guardandoEscala = signal(false);
  readonly escalaHora = signal<EscalaHoraEtec[]>([]);
  readonly guardandoEscalaHora = signal(false);
  readonly categoriasHora = signal<CategoriaHoraEtec[]>([]);

  form: ControlPeriodoForm = this.formVacio();
  etecForm: ControlEtecRequest = controlEtecVacio();

  /** Respuesta cruda del backend: de ella se conservan horario y offset de cada fecha. */
  private original: ControlPeriodo | null = null;

  /** Último período cargado con éxito (para revertir la navegación cancelada). */
  private periodoCargado = { anho: this.anho(), mes: this.mes() };

  /** Copia serializada del formulario para detectar cambios sin guardar. */
  private snapshot = '';

  ngOnInit(): void {
    this.cargarModos();
    this.cargar();
  }

  get periodoTexto(): string {
    return textoPeriodo(this.anho(), this.mes());
  }

  get periodoAnteriorTexto(): string {
    const anterior = mesAnterior(this.anho(), this.mes());
    return textoPeriodo(anterior.anho, anterior.mes);
  }

  cargar(): void {
    const anho = this.anho();
    const mes = this.mes();
    this.cargando.set(true);
    this.limpiarMensajes();
    this.cargarControlEtec(anho, mes);
    this.cargarEscalaArraigo();
    this.cargarEscalaHora(anho, mes);
    this.cargarCategoriasHora();

    this.service.getPeriodo(anho, mes).subscribe({
      next: (control) => {
        this.original = control;
        if (control) {
          this.form = this.desdeModelo(control);
          this.esNuevo.set(false);
          this.avisoFechas.set(this.fechasFueraDePeriodo(control, anho, mes));
        } else {
          this.form = this.formVacio();
          this.esNuevo.set(true);
          this.avisoFechas.set(false);
        }
        this.periodoCargado = { anho, mes };
        this.snapshot = this.serializar();
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        this.error.set(mensajeDeError(err, 'No se pudieron cargar los parámetros del período'));
      },
    });
  }

  irAnterior(): void {
    const anterior = mesAnterior(this.anho(), this.mes());
    this.irA(anterior.anho, anterior.mes);
  }

  irSiguiente(): void {
    const siguiente = mesSiguiente(this.anho(), this.mes());
    this.irA(siguiente.anho, siguiente.mes);
  }

  /** Recarga el período escrito en año/mes (Enter o al salir del campo). */
  recargarPeriodo(): void {
    const anho = Number(this.anho());
    const mes = Number(this.mes());
    if (!anho || anho < 2000 || anho > 2100 || !mes || mes < 1 || mes > 12) {
      this.restaurarPeriodo();
      return;
    }
    if (anho === this.periodoCargado.anho && mes === this.periodoCargado.mes) {
      this.restaurarPeriodo();
      return;
    }
    this.irA(anho, mes);
  }

  guardar(): void {
    if (!this.periodoConsistente()) {
      this.recargarPeriodo();
      return;
    }
    this.limpiarMensajes();
    const validacion = this.validar();
    if (validacion) {
      this.error.set(validacion);
      return;
    }
    const validacionEtec = this.validarEtec();
    if (validacionEtec) {
      this.error.set(validacionEtec);
      return;
    }

    const payload = this.aPayload();
    const controlId = this.form.controlId;
    const anho = this.anho();
    const mes = this.mes();
    this.guardando.set(true);

    const peticion = (
      controlId == null ? this.service.crear(payload) : this.service.actualizar(payload, controlId)
    ).pipe(switchMap(() => this.service.guardarControlEtec(anho, mes, this.etecPayload())));

    peticion.subscribe({
      next: () => {
        this.guardando.set(false);
        const periodo = this.periodoTexto;
        this.cargar();
        this.mensaje.set(`Parámetros guardados para ${periodo}.`);
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(mensajeDeError(err, 'No se pudieron guardar los parámetros del período'));
      },
    });
  }

  copiarAnterior(): void {
    if (!this.esNuevo() || this.copiando()) return;
    if (!this.periodoConsistente()) {
      this.recargarPeriodo();
      return;
    }

    const confirmado = window.confirm(
      `Se copiarán los parámetros de ${this.periodoAnteriorTexto} en ${this.periodoTexto}.\n\n` +
        'Las fechas se copian tal cual y deben revisarse antes de liquidar.',
    );
    if (!confirmado) return;

    this.limpiarMensajes();
    const anho = this.anho();
    const mes = this.mes();
    const origen = this.periodoAnteriorTexto;
    this.copiando.set(true);

    this.service
      .copiarAnterior(anho, mes)
      .pipe(
        switchMap(() =>
          this.service
            .copiarControlEtecAnterior(anho, mes)
            .pipe(catchError(() => of(null))),
        ),
      )
      .subscribe({
      next: () => {
        this.copiando.set(false);
        this.cargar();
        this.mensaje.set(`Parámetros copiados desde ${origen}.`);
      },
      error: (err) => {
        this.copiando.set(false);
        this.error.set(mensajeDeError(err, 'No se pudo copiar el período anterior'));
      },
    });
  }

  importeNegativo(campo: keyof ImportesControl): boolean {
    const valor = this.form.importes[campo];
    return valor != null && valor < 0;
  }

  textoEtec(campo: CampoControlEtec): string {
    const valor = this.numero(this.etecForm[campo.campo]);
    const texto = new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: campo.decimales,
      maximumFractionDigits: campo.decimales,
    }).format(valor);
    if (campo.tipo === 'porcentaje') return `${texto} %`;
    if (campo.tipo === 'importe') return `$ ${texto}`;
    return texto;
  }

  private cargarControlEtec(anho: number, mes: number): void {
    this.service.getControlEtec(anho, mes).subscribe({
      next: (control) => {
        this.controlEtec.set(control);
        this.etecForm = control ? this.desdeControlEtec(control) : controlEtecVacio();
      },
      error: (err) =>
        this.error.set(mensajeDeError(err, 'No se pudieron cargar los parámetros ETEC')),
    });
  }

  private desdeControlEtec(control: ControlEtec): ControlEtecRequest {
    return {
      valorPuntoEtec: this.numero(control.valorPuntoEtec),
      montoFijoCargo: this.numero(control.montoFijoCargo),
      porcentajePresentismo: this.numero(control.porcentajePresentismo),
      porcentajeAdicionalCarrera: this.numero(control.porcentajeAdicionalCarrera),
      garantia: this.numero(control.garantia),
      horasAdicionalCargaHoraria: this.numero(control.horasAdicionalCargaHoraria),
      valorHoraAdicionalCargaHoraria: this.numero(control.valorHoraAdicionalCargaHoraria),
    };
  }

  private etecPayload(): ControlEtecRequest {
    const payload = controlEtecVacio();
    for (const campo of CAMPOS_CONTROL_ETEC) {
      payload[campo.campo] = this.numero(this.etecForm[campo.campo]);
    }
    return payload;
  }

  private validarEtec(): string | null {
    if (CAMPOS_CONTROL_ETEC.some((campo) => this.numero(this.etecForm[campo.campo]) < 0)) {
      return 'Los parámetros ETEC no pueden ser negativos.';
    }
    return null;
  }

  /** Agrega un tramo con la antigüedad mínima siguiente al último configurado. */
  agregarTramo(): void {
    const tramos = this.escalaArraigo();
    const ultimo = tramos.reduce(
      (maximo, tramo) => Math.max(maximo, this.numero(tramo.aniosMinimos)),
      1,
    );
    this.escalaArraigo.set([
      ...tramos,
      { escalaArraigoEtecId: null, aniosMinimos: ultimo + 1, porcentaje: 0 },
    ]);
  }

  quitarTramo(indice: number): void {
    this.escalaArraigo.set(this.escalaArraigo().filter((_, posicion) => posicion !== indice));
  }

  guardarEscalaArraigo(): void {
    const validacion = this.validarEscala();
    if (validacion) {
      this.error.set(validacion);
      return;
    }
    this.limpiarMensajes();
    this.guardandoEscala.set(true);
    const payload = this.escalaArraigo().map((tramo) => ({
      aniosMinimos: this.numero(tramo.aniosMinimos),
      porcentaje: this.numero(tramo.porcentaje),
    }));
    this.service.guardarEscalaArraigo(payload).subscribe({
      next: (tramos) => {
        this.guardandoEscala.set(false);
        this.escalaArraigo.set(tramos);
        this.mensaje.set('Escala de arraigo guardada.');
      },
      error: (err) => {
        this.guardandoEscala.set(false);
        this.error.set(mensajeDeError(err, 'No se pudo guardar la escala de arraigo'));
      },
    });
  }

  private cargarEscalaArraigo(): void {
    this.service.getEscalaArraigo().subscribe({
      next: (tramos) => this.escalaArraigo.set(tramos),
      error: (err) =>
        this.error.set(mensajeDeError(err, 'No se pudo cargar la escala de arraigo')),
    });
  }

  private validarEscala(): string | null {
    const tramos = this.escalaArraigo();
    if (tramos.length === 0) {
      return 'La escala de arraigo debe tener al menos un tramo.';
    }
    const anios = new Set<number>();
    for (const tramo of tramos) {
      const valorAnios = this.numero(tramo.aniosMinimos);
      const porcentaje = this.numero(tramo.porcentaje);
      if (valorAnios < 1) {
        return 'Cada tramo debe tener una antigüedad mínima de al menos 1 año.';
      }
      if (anios.has(valorAnios)) {
        return `La antigüedad mínima ${valorAnios} está repetida.`;
      }
      if (porcentaje < 0 || porcentaje > 100) {
        return 'Los porcentajes de arraigo deben estar entre 0 y 100.';
      }
      anios.add(valorAnios);
    }
    return null;
  }

  /** Agrega un tramo de horas que arranca donde termina el anterior. */
  agregarTramoHora(): void {
    const tramos = this.escalaHora();
    const ultimo = tramos[tramos.length - 1];
    this.escalaHora.set([
      ...tramos,
      {
        ...tramoHoraVacio(),
        horasDesde: ultimo?.horasHasta ?? null,
        categoriaId: ultimo?.categoriaId ?? null,
      },
    ]);
  }

  quitarTramoHora(indice: number): void {
    this.escalaHora.set(this.escalaHora().filter((_, posicion) => posicion !== indice));
  }

  guardarEscalaHora(): void {
    const validacion = this.validarEscalaHora();
    if (validacion) {
      this.error.set(validacion);
      return;
    }
    if (!this.controlEtec()) {
      this.error.set(
        'Guarde primero los parámetros ETEC del período: la escala de horas depende de ellos.',
      );
      return;
    }
    this.limpiarMensajes();
    this.guardandoEscalaHora.set(true);
    const payload = this.escalaHora().map((tramo) => ({
      categoriaId: tramo.categoriaId == null ? null : Number(tramo.categoriaId),
      horasDesde: this.numero(tramo.horasDesde),
      horasHasta: this.numero(tramo.horasHasta),
      montoFijo: this.numero(tramo.montoFijo),
      valorHora: this.numero(tramo.valorHora),
    }));
    this.service.guardarEscalaHora(this.anho(), this.mes(), payload).subscribe({
      next: (tramos) => {
        this.guardandoEscalaHora.set(false);
        this.escalaHora.set(tramos);
        this.mensaje.set('Escala de horas guardada.');
      },
      error: (err) => {
        this.guardandoEscalaHora.set(false);
        this.error.set(mensajeDeError(err, 'No se pudo guardar la escala de horas ETEC'));
      },
    });
  }

  /** Importe de referencia del tramo si el docente tuviera las horas hasta. */
  importeHora(tramo: EscalaHoraEtec): string {
    const importe = this.numero(tramo.montoFijo) + this.numero(tramo.horasHasta) * this.numero(tramo.valorHora);
    return new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(importe);
  }

  private cargarEscalaHora(anho: number, mes: number): void {
    this.service.getEscalaHora(anho, mes).subscribe({
      next: (tramos) => this.escalaHora.set(tramos),
      error: (err) =>
        this.error.set(mensajeDeError(err, 'No se pudo cargar la escala de horas ETEC')),
    });
  }

  private cargarCategoriasHora(): void {
    this.service.getCategoriasHorasEtec().subscribe({
      next: (categorias) => this.categoriasHora.set(categorias),
      error: (err) =>
        this.error.set(
          mensajeDeError(err, 'No se pudieron cargar las categorías de horas ETEC'),
        ),
    });
  }

  private validarEscalaHora(): string | null {
    const ordenados = [...this.escalaHora()].sort(
      (a, b) => this.numero(a.horasDesde) - this.numero(b.horasDesde),
    );
    for (const tramo of ordenados) {
      if (tramo.categoriaId == null) {
        return 'Cada tramo de horas debe indicar la categoría que liquida sus horas.';
      }
      if (tramo.horasDesde == null || tramo.horasHasta == null) {
        return 'Cada tramo de horas debe indicar el desde y el hasta.';
      }
      const desde = this.numero(tramo.horasDesde);
      const hasta = this.numero(tramo.horasHasta);
      if (desde < 0) {
        return 'Las horas desde no pueden ser negativas.';
      }
      if (hasta < desde) {
        return `El tramo que arranca en ${desde} hora(s) termina antes de empezar.`;
      }
      if (this.numero(tramo.montoFijo) < 0 || this.numero(tramo.valorHora) < 0) {
        return 'El monto fijo y el valor hora no pueden ser negativos.';
      }
    }
    for (let posicion = 1; posicion < ordenados.length; posicion += 1) {
      const anterior = ordenados[posicion - 1];
      if (this.numero(ordenados[posicion].horasDesde) <= this.numero(anterior.horasHasta)) {
        return `Los tramos de horas se superponen: el que arranca en ${this.numero(
          ordenados[posicion].horasDesde,
        )} pisa al anterior.`;
      }
    }
    return null;
  }

  private cargarModos(): void {
    this.service.getModos().subscribe({
      next: (modos) =>
        this.modos.set([...modos].sort((a, b) => a.descripcion.localeCompare(b.descripcion))),
      error: (err) =>
        this.error.set(mensajeDeError(err, 'No se pudieron cargar los modos de liquidación')),
    });
  }

  private irA(anho: number, mes: number): void {
    if (!this.puedeDescartar()) {
      this.restaurarPeriodo();
      return;
    }
    this.anho.set(anho);
    this.mes.set(mes);
    this.cargar();
  }

  private restaurarPeriodo(): void {
    this.anho.set(this.periodoCargado.anho);
    this.mes.set(this.periodoCargado.mes);
  }

  /**
   * Evita guardar el formulario cargado en un período distinto al escrito en
   * año/mes (por ejemplo, si se escribe el año y se pulsa Guardar sin salir del campo).
   */
  private periodoConsistente(): boolean {
    return this.anho() === this.periodoCargado.anho && this.mes() === this.periodoCargado.mes;
  }

  private puedeDescartar(): boolean {
    return (
      !this.hayCambios() ||
      window.confirm('Hay cambios sin guardar en este período. ¿Descartarlos?')
    );
  }

  /**
   * `canDeactivate` de la pantalla: indica si el formulario tiene cambios sin guardar
   * para que el usuario confirme antes de abandonar (incluido el botón atrás).
   */
  hayCambiosSinGuardar(): boolean {
    return this.hayCambios();
  }

  private hayCambios(): boolean {
    return this.serializar() !== this.snapshot;
  }

  private serializar(): string {
    return JSON.stringify(this.form);
  }

  private validar(): string | null {
    if (this.form.modoLiquidacionId == null) {
      return 'Seleccione el modo de liquidación.';
    }
    const { fechaDesde, fechaHasta, fechaPago, fechaDeposito } = this.form;
    if (!fechaDesde || !fechaHasta || !fechaPago || !fechaDeposito) {
      return 'Complete las fechas de liquidación, pago y depósito.';
    }
    if (fechaDesde > fechaHasta) {
      return 'La fecha de inicio no puede ser posterior a la de cierre.';
    }
    if (CAMPOS_IMPORTE.some((campo) => this.importeNegativo(campo))) {
      return 'Los importes no pueden ser negativos.';
    }
    return null;
  }

  private aPayload(): ControlPeriodoRequest {
    const form = this.form;
    const original = this.original;
    const importes = importesVacios();
    for (const campo of CAMPOS_IMPORTE) {
      importes[campo] = this.numero(form.importes[campo]);
    }

    return {
      anho: this.anho(),
      mes: this.mes(),
      fechaDesde: fechaPayload(original?.fechaDesde, form.fechaDesde),
      fechaHasta: fechaPayload(original?.fechaHasta, form.fechaHasta),
      fechaPago: fechaPayload(original?.fechaPago, form.fechaPago),
      fechaDeposito: fechaPayload(original?.fechaDeposito, form.fechaDeposito),
      aporteJubilatorio: form.aporteJubilatorio.trim(),
      depositoBanco: form.depositoBanco.trim(),
      ...importes,
      modoLiquidacionId: form.modoLiquidacionId,
    };
  }

  private desdeModelo(control: ControlPeriodo): ControlPeriodoForm {
    const importes = importesVacios();
    for (const campo of CAMPOS_IMPORTE) {
      importes[campo] = this.numero(control[campo]);
    }

    return {
      controlId: control.controlId,
      fechaDesde: fechaInput(control.fechaDesde),
      fechaHasta: fechaInput(control.fechaHasta),
      fechaPago: fechaInput(control.fechaPago),
      fechaDeposito: fechaInput(control.fechaDeposito),
      aporteJubilatorio: control.aporteJubilatorio ?? '',
      depositoBanco: control.depositoBanco ?? '',
      modoLiquidacionId: control.modoLiquidacionId,
      importes,
    };
  }

  private formVacio(): ControlPeriodoForm {
    return {
      controlId: null,
      fechaDesde: '',
      fechaHasta: '',
      fechaPago: '',
      fechaDeposito: '',
      aporteJubilatorio: '',
      depositoBanco: '',
      modoLiquidacionId: null,
      importes: importesVacios(),
    };
  }

  private fechasFueraDePeriodo(control: ControlPeriodo, anho: number, mes: number): boolean {
    const prefijo = `${anho}-${String(mes).padStart(2, '0')}`;
    return [control.fechaDesde, control.fechaHasta].some(
      (fecha) => !!fecha && !fecha.startsWith(prefijo),
    );
  }

  private numero(valor: number | null | undefined): number {
    return valor == null ? 0 : Number(valor);
  }

  private limpiarMensajes(): void {
    this.error.set('');
    this.mensaje.set('');
  }
}
