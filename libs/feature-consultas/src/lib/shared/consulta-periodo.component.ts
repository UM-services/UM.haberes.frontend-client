import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface PeriodoConsulta {
  anho: number;
  mes: number;
}

/**
 * Selector de período de las consultas: mes y año con la navegación `<` `>`
 * del sistema legacy. No consulta nada por sí mismo: emite el período elegido
 * y cada pantalla decide cuándo volver a pedir los datos.
 */
@Component({
  selector: 'haberes-consulta-periodo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [FormsModule],
  template: `
    <div class="flex flex-wrap items-end gap-4">
      <div class="w-44">
        <label class="um-label" [attr.for]="id + '-mes'">Mes</label>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="um-btn-secondary px-3 py-2"
            aria-label="Mes anterior"
            (click)="mover(-1)"
          >
            &lt;
          </button>
          <input
            [id]="id + '-mes'"
            type="number"
            min="1"
            max="12"
            class="um-input text-center"
            [ngModel]="mes"
            (ngModelChange)="cambiarMes($event)"
          />
          <button
            type="button"
            class="um-btn-secondary px-3 py-2"
            aria-label="Mes siguiente"
            (click)="mover(1)"
          >
            &gt;
          </button>
        </div>
      </div>
      <div class="w-32">
        <label class="um-label" [attr.for]="id + '-anho'">Año</label>
        <input
          [id]="id + '-anho'"
          type="number"
          min="2000"
          max="2100"
          class="um-input"
          [ngModel]="anho"
          (ngModelChange)="cambiarAnho($event)"
        />
      </div>
    </div>
  `
})
export class ConsultaPeriodoComponent {
  @Input() anho = new Date().getFullYear();
  @Input() mes = new Date().getMonth() + 1;
  @Input() id = 'periodo';
  @Output() periodoChange = new EventEmitter<PeriodoConsulta>();

  mover(delta: number) {
    let mes = Number(this.mes) + delta;
    let anho = Number(this.anho);
    if (mes > 12) {
      mes = 1;
      anho++;
    }
    if (mes < 1) {
      mes = 12;
      anho--;
    }
    this.emitir(anho, mes);
  }

  cambiarMes(valor: number) {
    this.emitir(Number(this.anho), Number(valor));
  }

  cambiarAnho(valor: number) {
    this.emitir(Number(valor), Number(this.mes));
  }

  private emitir(anho: number, mes: number) {
    if (!anho || !mes || mes < 1 || mes > 12) {
      return;
    }
    this.periodoChange.emit({ anho, mes });
  }
}
