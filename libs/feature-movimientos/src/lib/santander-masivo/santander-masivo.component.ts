import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ArchivoMasivoComponent } from '../archivo-masivo/archivo-masivo.component';

@Component({
  selector: 'haberes-santander-masivo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [ArchivoMasivoComponent],
  template: `<haberes-archivo-masivo banco="santander" />`,
})
export class SantanderMasivoComponent {}
