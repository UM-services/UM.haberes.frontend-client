import { Component, ChangeDetectionStrategy } from '@angular/core';
import { NOVEDADES_GRUPOS } from '@haberes/novedades-menu';
import { UiOpcionesPanelComponent } from '@haberes/ui-layout';

/** Panel principal del módulo Novedades: catálogo de opciones en formato hub. */
@Component({
  selector: 'app-inicio',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
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
