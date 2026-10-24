import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MenuGroup, UiShellComponent } from '@haberes/ui-layout';
import { ADMINISTRADOR_MENU_GROUPS } from './menu-options.data';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [UiShellComponent],
  selector: 'app-root',
  template: `
    <ui-shell
      moduleName="Administrador"
      menuSectionLabel="Menú Administrador"
      [menuGroups]="menuGroups"
    />
  `,
})
export class AppComponent {
  title = 'administrador';

  readonly menuGroups: MenuGroup[] = ADMINISTRADOR_MENU_GROUPS;
}
