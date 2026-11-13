import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NOVEDADES_MENU_ITEMS } from '@haberes/novedades-menu';
import { UiShellComponent } from '@haberes/ui-layout';
import { FacultadBarComponent } from './facultad-bar/facultad-bar.component';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [UiShellComponent, FacultadBarComponent],
  selector: 'app-root',
  template: `
    <ui-shell
      moduleName="Simulador Novedades"
      menuSectionLabel="Menú Simulador Novedades"
      [menuItems]="menuItems"
    >
      <app-facultad-bar />
    </ui-shell>
  `,
})
export class AppComponent {
  title = 'simulador-novedades';

  readonly menuItems = NOVEDADES_MENU_ITEMS;
}
