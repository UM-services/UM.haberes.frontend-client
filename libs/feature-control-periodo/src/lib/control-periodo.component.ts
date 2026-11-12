import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { fechaInput, fechaPayload, mensajeDeError } from '@haberes/shared-api';
import { ImportePipe, InputFechaComponent, StickyFooterDirective } from '@haberes/ui-layout';

import {
  CAMPOS_IMPORTE,
  ControlPeriodo,
  ControlPeriodoForm,
  ControlPeriodoRequest,
  ImportesControl,
  ModoLiquidacion,
  SECCIONES_IMPORTES,
  importesVacios,
  mesAnterior,
  mesSiguiente,
  textoPeriodo,
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

  form: ControlPeriodoForm = this.formVacio();

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

    const payload = this.aPayload();
    const controlId = this.form.controlId;
    this.guardando.set(true);

    const peticion =
      controlId == null ? this.service.crear(payload) : this.service.actualizar(payload, controlId);

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

    this.service.copiarAnterior(anho, mes).subscribe({
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
