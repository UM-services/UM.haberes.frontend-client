import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';

import { mensajeDeError } from '@haberes/shared-api';
import { CargosClaseActualizarService } from './cargos-clase-actualizar.service';

/**
 * Actualización de los valores hora de los cargos con clase de un período.
 * Equivale al proceso de recálculo masivo del sistema legado de liquidación.
 */
@Component({
  selector: 'haberes-cargos-clase-actualizar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, FormsModule],
  templateUrl: './cargos-clase-actualizar.component.html'
})
export class CargosClaseActualizarComponent {
  private readonly service = inject(CargosClaseActualizarService);

  readonly anho = signal<number>(new Date().getFullYear());
  readonly mes = signal<number>(new Date().getMonth() + 1);

  readonly isUpdating = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly exito = signal<string | null>(null);

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
    this.error.set(null);
    this.exito.set(null);
  }

  actualizar(): void {
    const mensaje = `Se actualizarán los valores hora de los cargos con clase del período ${this.mes()}/${this.anho()}. ¿Continuar?`;
    if (!window.confirm(mensaje)) {
      return;
    }

    this.isUpdating.set(true);
    this.error.set(null);
    this.exito.set(null);
    this.service
      .actualizarPeriodo(this.anho(), this.mes())
      .pipe(finalize(() => this.isUpdating.set(false)))
      .subscribe({
        next: () => this.exito.set('Proceso terminado: valores hora actualizados.'),
        error: (err: HttpErrorResponse) =>
          this.error.set(mensajeDeError(err, 'No se pudieron actualizar los cargos con clase del período.'))
      });
  }
}
