import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { mensajeDeError } from '@haberes/shared-api';

import { SijpService } from './sijp.service';
import { SijpResponse, VARIANTES_SIJP, VarianteSijp } from './sijp.models';

/**
 * Generación del archivo SIJP de un período (legacy: `frmGenSIJP.frm`).
 *
 * El backend arma el archivo y lo devuelve en Base64; la pantalla sólo elige período y
 * variante, muestra el resumen y dispara la descarga. No calcula nada por su cuenta.
 */
@Component({
  selector: 'haberes-sijp',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, FormsModule],
  templateUrl: './sijp.component.html'
})
export class SijpComponent {
  private readonly service = inject(SijpService);

  readonly anho = signal(new Date().getFullYear());
  readonly mes = signal(new Date().getMonth() + 1);
  readonly variante = signal<VarianteSijp>('normal');
  readonly generando = signal(false);
  readonly error = signal<string | null>(null);
  readonly resultado = signal<SijpResponse | null>(null);

  readonly variantes = VARIANTES_SIJP;

  readonly periodoTexto = computed(
    () => `${String(this.mes()).padStart(2, '0')}/${this.anho()}`
  );

  readonly puedeGenerar = computed(() => !this.generando() && this.periodoValido());

  irAnterior() {
    this.cambiarMes(-1);
  }

  irSiguiente() {
    this.cambiarMes(1);
  }

  cambiarMes(delta: number) {
    const mes = this.mes() + delta;
    if (mes < 1) {
      this.mes.set(12);
      this.anho.set(this.anho() - 1);
    } else if (mes > 12) {
      this.mes.set(1);
      this.anho.set(this.anho() + 1);
    } else {
      this.mes.set(mes);
    }
    this.periodoCambiado();
  }

  /** Al cambiar de período o variante se descarta el resultado anterior. */
  periodoCambiado() {
    this.resultado.set(null);
    this.error.set(null);
  }

  seleccionarVariante(variante: VarianteSijp) {
    this.variante.set(variante);
    this.periodoCambiado();
  }

  generar() {
    if (this.generando()) {
      return;
    }
    if (!this.periodoValido()) {
      this.error.set('El período debe tener un año entre 2000 y 2100 y un mes entre 1 y 12.');
      return;
    }

    this.generando.set(true);
    this.error.set(null);
    this.resultado.set(null);

    this.service.generar(this.anho(), this.mes(), this.variante()).subscribe({
      next: (respuesta) => {
        this.resultado.set(respuesta);
        if (respuesta.cantidadRegistros > 0) {
          this.descargar(this.aBlob(respuesta.contenido), respuesta.nombreArchivo);
        }
        this.generando.set(false);
      },
      error: (error: unknown) => {
        this.error.set(
          mensajeDeError(error, 'No se pudo generar el archivo SIJP del período.')
        );
        this.generando.set(false);
      }
    });
  }

  descargarDeNuevo() {
    const resultado = this.resultado();
    if (resultado) {
      this.descargar(this.aBlob(resultado.contenido), resultado.nombreArchivo);
    }
  }

  private periodoValido(): boolean {
    const anho = this.anho();
    const mes = this.mes();
    return (
      Number.isInteger(anho) &&
      anho >= 2000 &&
      anho <= 2100 &&
      Number.isInteger(mes) &&
      mes >= 1 &&
      mes <= 12
    );
  }

  private aBlob(base64: string): Blob {
    const binario = atob(base64);
    const bytes = new Uint8Array(binario.length);
    for (let i = 0; i < binario.length; i++) {
      bytes[i] = binario.charCodeAt(i);
    }
    return new Blob([bytes], { type: 'text/plain;charset=windows-1252' });
  }

  private descargar(blob: Blob, nombre: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nombre;
    document.body.appendChild(link);
    link.click();
    window.URL.revokeObjectURL(url);
    link.remove();
  }
}
