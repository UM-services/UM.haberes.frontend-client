import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NOVEDADES_MENU_ITEMS } from '@haberes/novedades-menu';
import { PermisosService } from '@haberes/shared-api';
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
      [menuItems]="menuItems()"
    />
  `,
})
export class AppComponent {
  title = 'novedades';

  private readonly permisos = inject(PermisosService);

  /** Sólo las opciones habilitadas para el usuario (las rutas también tienen guard). */
  readonly menuItems = computed(() =>
    NOVEDADES_MENU_ITEMS.filter((item) => this.permisos.tieneAcceso(item.path)),
  );
}
