import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { mensajeDeError } from '@haberes/shared-api';
import { ImportePipe, InputFechaComponent, StickyFooterDirective } from '@haberes/ui-layout';

import {
  Acreditacion,
  EstadoCarga,
  estadoCarga,
  fechaLimitePayload,
  fechaLimiteVisible,
  mesAnterior,
  mesSiguiente,
  textoFecha,
  textoPeriodo,
} from './limite-novedades.models';
import { LimiteNovedadesService } from './limite-novedades.service';

/**
 * Límite de Novedades: fija hasta qué día se pueden cargar novedades del período
 * y muestra el estado del registro de acreditación (contable y bancario).
 *
 * Hay un único registro por `(año, mes)`. La pantalla sólo escribe el límite: al
 * editar usa el `PATCH` parcial y al crear el período el `POST`, de modo que
 * nunca pisa `acreditado`, las fechas contables ni los importes.
 */
@Component({
  selector: 'lib-limite-novedades',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [FormsModule, InputFechaComponent, ImportePipe, StickyFooterDirective],
  templateUrl: './limite-novedades.component.html',
})
export class LimiteNovedadesComponent implements OnInit {
  private readonly service = inject(LimiteNovedadesService);

  readonly anho = signal(new Date().getFullYear());
  readonly mes = signal(new Date().getMonth() + 1);
  readonly registro = signal<Acreditacion | null>(null);
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly error = signal('');
  readonly mensaje = signal('');

  /** Día elegido (`yyyy-MM-dd`); se envía como fin de ese día en hora de Argentina. */
  limite = '';

  /** Último período cargado con éxito (para revertir la navegación cancelada). */
  private periodoCargado = { anho: this.anho(), mes: this.mes() };

  /** Copia serializada del formulario para detectar cambios sin guardar. */
  private snapshot = '';

  ngOnInit(): void {
    this.cargar();
  }

  get periodoTexto(): string {
    return textoPeriodo(this.anho(), this.mes());
  }

  get esNuevo(): boolean {
    return this.registro() == null;
  }

  get acreditacionId(): number | null {
    return this.registro()?.acreditacionId ?? null;
  }

  get estado(): EstadoCarga {
    return estadoCarga(this.registro());
  }

  get estadoEtiqueta(): string {
    switch (this.estado) {
      case 'acreditado':
        return 'Acreditado';
      case 'cerrada':
        return 'Carga cerrada';
      case 'abierta':
        return 'Carga abierta';
      default:
        return 'Sin límite definido';
    }
  }

  get estadoClases(): string {
    switch (this.estado) {
      case 'acreditado':
        return 'border-amber-200 bg-amber-50 text-amber-700';
      case 'cerrada':
        return 'border-rose-200 bg-rose-50 text-rose-700';
      case 'abierta':
        return 'border-emerald-200 bg-emerald-50 text-emerald-700';
      default:
        return 'text-um-muted';
    }
  }

  get cierreTexto(): string {
    return this.limite
      ? `La carga se cierra el ${textoFecha(this.limite)} a las 23:59 (hora de Argentina).`
      : 'Sin fecha definida la carga no se cierra.';
  }

  get hayCambios(): boolean {
    return this.serializar() !== this.snapshot;
  }

  fechaDe(valor: string | null | undefined): string {
    return textoFecha(fechaLimiteVisible(valor));
  }

  cargar(): void {
    const anho = this.anho();
    const mes = this.mes();
    this.cargando.set(true);
    this.limpiarMensajes();

    this.service.getPeriodo(anho, mes).subscribe({
      next: (registro) => {
        this.registro.set(registro);
        this.limite = fechaLimiteVisible(registro?.limiteNovedades);
        this.periodoCargado = { anho, mes };
        this.snapshot = this.serializar();
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        this.error.set(mensajeDeError(err, 'No se pudo cargar el período'));
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

  /** Recarga el período escrito en año/mes (Enter o al cambiar el campo). */
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
    if (!this.limite) {
      this.error.set('Indique la fecha límite de carga de novedades.');
      return;
    }

    const anho = this.anho();
    const mes = this.mes();
    const limiteNovedades = fechaLimitePayload(this.limite);
    const acreditacionId = this.acreditacionId;
    const periodo = this.periodoTexto;
    this.guardando.set(true);

    const peticion =
      acreditacionId == null
        ? this.service.crear({ anho, mes, limiteNovedades })
        : this.service.actualizarLimite({ limiteNovedades }, acreditacionId);

    peticion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.cargar();
        this.mensaje.set(`Límite de novedades guardado para ${periodo}.`);
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(mensajeDeError(err, 'No se pudo guardar el límite de novedades'));
      },
    });
  }

  descartar(): void {
    this.limite = fechaLimiteVisible(this.registro()?.limiteNovedades);
    this.limpiarMensajes();
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
      !this.hayCambios ||
      window.confirm('Hay cambios sin guardar en este período. ¿Descartarlos?')
    );
  }

  private serializar(): string {
    return JSON.stringify({ limite: this.limite });
  }

  private limpiarMensajes(): void {
    this.error.set('');
    this.mensaje.set('');
  }
}
