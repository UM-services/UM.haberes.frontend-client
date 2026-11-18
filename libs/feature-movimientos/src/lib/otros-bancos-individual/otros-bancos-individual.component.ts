import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ArchivoIndividualComponent } from '../archivo-individual/archivo-individual.component';

@Component({
  selector: 'haberes-otros-bancos-individual',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [ArchivoIndividualComponent],
  template: `<haberes-archivo-individual banco="otrosbancos" />`,
})
export class OtrosBancosIndividualComponent {}
