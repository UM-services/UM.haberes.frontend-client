import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

/**
 * Selector de período mes/año con navegación, idéntico al de los formularios legacy:
 * dos campos numéricos y los botones anterior/siguiente con rollover de año.
 */
@Component({
  selector: 'lib-periodo-nav',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex items-end gap-2">
      <div>
        <label class="um-label" [attr.for]="idPrefijo + '-mes'">Mes</label>
        <input
          [id]="idPrefijo + '-mes'"
          type="number"
          min="1"
          max="12"
          class="um-input w-20 text-center font-mono tabular-nums"
          [ngModel]="mes"
          (ngModelChange)="onMes($event)"
          [disabled]="disabled"
        />
      </div>
      <div>
        <label class="um-label" [attr.for]="idPrefijo + '-anho'">Año</label>
        <input
          [id]="idPrefijo + '-anho'"
          type="number"
          min="2000"
          max="2100"
          class="um-input w-24 text-center font-mono tabular-nums"
          [ngModel]="anho"
          (ngModelChange)="onAnho($event)"
          [disabled]="disabled"
        />
      </div>
      <div class="flex gap-1 pb-0.5">
        <button
          type="button"
          class="um-btn-secondary p-2"
          aria-label="Mes anterior"
          [disabled]="disabled"
          (click)="cambiar(-1)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          type="button"
          class="um-btn-secondary p-2"
          aria-label="Mes siguiente"
          [disabled]="disabled"
          (click)="cambiar(1)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  `,
})
export class PeriodoNavComponent {
  @Input() anho = new Date().getFullYear();
  @Input() mes = new Date().getMonth() + 1;
  @Input() disabled = false;
  @Input() idPrefijo = 'periodo';

  @Output() periodoChange = new EventEmitter<{ anho: number; mes: number }>();

  cambiar(delta: number): void {
    let mes = this.mes + delta;
    let anho = this.anho;
    if (mes > 12) {
      mes = 1;
      anho++;
    }
    if (mes < 1) {
      mes = 12;
      anho--;
    }
    this.mes = mes;
    this.anho = anho;
    this.emitir();
  }

  onMes(valor: number | string): void {
    const mes = Number(valor);
    if (!Number.isInteger(mes) || mes < 1 || mes > 12) {
      return;
    }
    this.mes = mes;
    this.emitir();
  }

  onAnho(valor: number | string): void {
    const anho = Number(valor);
    if (!Number.isInteger(anho) || anho < 2000 || anho > 2100) {
      return;
    }
    this.anho = anho;
    this.emitir();
  }

  private emitir(): void {
    this.periodoChange.emit({ anho: this.anho, mes: this.mes });
  }
}
