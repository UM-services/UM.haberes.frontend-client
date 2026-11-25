import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { PermisosService } from '@haberes/shared-api';
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
      [menuGroups]="menuGroups()"
    />
  `,
})
export class AppComponent {
  title = 'administrador';

  private readonly permisos = inject(PermisosService);

  readonly menuGroups = computed<MenuGroup[]>(() =>
    ADMINISTRADOR_MENU_GROUPS.map((grupo) => ({
      ...grupo,
      items: grupo.items.filter((item) => this.permisos.tieneAcceso(item.path)),
    })).filter((grupo) => grupo.items.length > 0),
  );
}
