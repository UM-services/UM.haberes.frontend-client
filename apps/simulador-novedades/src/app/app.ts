import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NOVEDADES_MENU_ITEMS } from '@haberes/novedades-menu';
import { PermisosService } from '@haberes/shared-api';
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
      [menuItems]="menuItems()"
    >
      <app-facultad-bar />
    </ui-shell>
  `,
})
export class AppComponent {
  title = 'simulador-novedades';

  private readonly permisos = inject(PermisosService);

  readonly menuItems = computed(() =>
    NOVEDADES_MENU_ITEMS.filter((item) => this.permisos.tieneAcceso(item.path)),
  );
}
