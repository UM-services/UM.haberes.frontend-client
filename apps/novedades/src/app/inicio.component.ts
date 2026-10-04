import { Component } from '@angular/core';
import { UiOpcionesPanelComponent } from '@haberes/ui-layout';
import { NOVEDADES_GRUPOS } from './menu-options.data';

/** Panel principal del módulo Novedades: catálogo de opciones en formato hub. */
@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [UiOpcionesPanelComponent],
  template: `
    <ui-opciones-panel
      [grupos]="grupos"
      titulo="Directorio de Operaciones"
      descripcion="Catálogo de operaciones del módulo de Novedades"
    />
  `
})
export class InicioComponent {
  readonly grupos = NOVEDADES_GRUPOS;
}
