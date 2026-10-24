import { Component, ChangeDetectionStrategy } from '@angular/core';
import { UiOpcionesPanelComponent } from '@haberes/ui-layout';
import { ADMINISTRADOR_GRUPOS } from './menu-options.data';

/** Panel principal del módulo Administrador: catálogo de opciones en formato hub. */
@Component({
  selector: 'app-inicio',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [UiOpcionesPanelComponent],
  template: `
    <ui-opciones-panel
      [grupos]="grupos"
      titulo="Directorio de Administración"
      descripcion="Parámetros y datos maestros del sistema de haberes"
    />
  `,
})
export class InicioComponent {
  readonly grupos = ADMINISTRADOR_GRUPOS;
}
