import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ArchivoMasivoComponent } from '../archivo-masivo/archivo-masivo.component';

@Component({
  selector: 'haberes-otros-bancos-masivo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [ArchivoMasivoComponent],
  template: `<haberes-archivo-masivo banco="otrosbancos" />`,
})
export class OtrosBancosMasivoComponent {}
