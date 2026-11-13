import { Component, ChangeDetectionStrategy } from '@angular/core';
import { NOVEDADES_MENU_ITEMS } from '@haberes/novedades-menu';
import { UiShellComponent } from '@haberes/ui-layout';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [UiShellComponent],
  selector: 'app-root',
  template: `
    <ui-shell
      moduleName="Novedades"
      menuSectionLabel="Menú Novedades"
      [menuItems]="menuItems"
    />
  `,
})
export class AppComponent {
  title = 'novedades';

  readonly menuItems = NOVEDADES_MENU_ITEMS;
}
