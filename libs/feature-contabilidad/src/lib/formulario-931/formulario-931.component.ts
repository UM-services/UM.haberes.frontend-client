import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { mensajeDeError } from '@haberes/shared-api';
import { ImportePipe, StickyFooterDirective } from '@haberes/ui-layout';

import {
  CAMPOS_931,
  CampoFormulario931,
  Formulario931Form,
  SeguridadSocial,
  SeguridadSocialRequest,
  formularioVacio,
  importe,
  mesAnterior,
  mesSiguiente,
  textoPeriodo,
  totalAportes,
  totalLeyesSociales,
} from './formulario-931.models';
import { Formulario931Service } from './formulario-931.service';

/**
 * Totales del Formulario 931: registro único por `(año, mes)` con los seis
 * importes que el operador copia de AFIP.
 *
 * Se navega con `<` / `>` y se edita el período vigente; no hay listado. Si el
 * período está vacío se crea desde cero. Los importes negativos se permiten
 * (rectificativas), con aviso y confirmación al guardar.
 */
@Component({
  selector: 'haberes-formulario-931',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [FormsModule, ImportePipe, StickyFooterDirective],
  templateUrl: './formulario-931.component.html',
})
export class Formulario931Component implements OnInit {
  private readonly service = inject(Formulario931Service);

  readonly campos = CAMPOS_931;
  readonly anho = signal(new Date().getFullYear());
  readonly mes = signal(new Date().getMonth() + 1);
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly esNuevo = signal(true);
  readonly error = signal('');
  readonly mensaje = signal('');

  form: Formulario931Form = formularioVacio();

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

  get periodoAnteriorTexto(): string {
    const anterior = mesAnterior(this.anho(), this.mes());
    return textoPeriodo(anterior.anho, anterior.mes);
  }

  get aportes(): number {
    return totalAportes(this.form);
  }

  get leyesSociales(): number {
    return totalLeyesSociales(this.form);
  }

  get hayNegativos(): boolean {
    return CAMPOS_931.some(({ campo }) => this.importeNegativo(campo));
  }

  importeNegativo(campo: CampoFormulario931): boolean {
    const valor = this.form[campo];
    return valor != null && valor < 0;
  }

  cargar(): void {
    const anho = this.anho();
    const mes = this.mes();
    this.cargando.set(true);
    this.limpiarMensajes();

    this.service.getPeriodo(anho, mes).subscribe({
      next: (seguridadSocial) => {
        if (seguridadSocial) {
          this.form = this.desdeModelo(seguridadSocial);
          this.esNuevo.set(false);
        } else {
          this.form = formularioVacio();
          this.esNuevo.set(true);
        }
        this.periodoCargado = { anho, mes };
        this.snapshot = this.serializar();
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        this.error.set(mensajeDeError(err, 'No se pudieron cargar los totales del período'));
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

    if (this.hayNegativos) {
      const confirmado = window.confirm(
        `Hay importes negativos en ${this.periodoTexto}.\n\n` +
          'Se guardarán tal cual. ¿Continuar?',
      );
      if (!confirmado) return;
    }

    const payload = this.aPayload();
    const seguridadSocialId = this.form.seguridadSocialId;
    const anho = this.anho();
    const mes = this.mes();
    this.guardando.set(true);

    (
      seguridadSocialId == null
        ? this.service.crear(payload)
        : this.service.actualizar(payload, seguridadSocialId)
    ).subscribe({
      next: () => {
        this.guardando.set(false);
        const periodo = textoPeriodo(anho, mes);
        this.cargar();
        this.mensaje.set(`Totales guardados para ${periodo}.`);
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(mensajeDeError(err, 'No se pudieron guardar los totales del período'));
      },
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

  private aPayload(): SeguridadSocialRequest {
    const importes = CAMPOS_931.reduce(
      (valores, { campo }) => {
        valores[campo] = this.numero(this.form[campo]);
        return valores;
      },
      {} as Record<CampoFormulario931, number>,
    );

    return {
      anho: this.anho(),
      mes: this.mes(),
      ...importes,
    };
  }

  private desdeModelo(seguridadSocial: SeguridadSocial): Formulario931Form {
    return {
      seguridadSocialId: seguridadSocial.seguridadSocialId,
      cc351: this.numero(seguridadSocial.cc351),
      cc301: this.numero(seguridadSocial.cc301),
      cc352: this.numero(seguridadSocial.cc352),
      cc302: this.numero(seguridadSocial.cc302),
      cc312: this.numero(seguridadSocial.cc312),
      cc028: this.numero(seguridadSocial.cc028),
    };
  }

  private numero(valor: number | null | undefined): number {
    return importe(valor);
  }

  private limpiarMensajes(): void {
    this.error.set('');
    this.mensaje.set('');
  }
}
