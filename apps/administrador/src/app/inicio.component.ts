import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { PermisosService } from '@haberes/shared-api';
import { GrupoPanel, UiOpcionesPanelComponent } from '@haberes/ui-layout';
import { ADMINISTRADOR_GRUPOS } from './menu-options.data';

/** Panel principal del módulo Administrador: catálogo de opciones en formato hub. */
@Component({
  selector: 'app-inicio',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [UiOpcionesPanelComponent],
  template: `
    <ui-opciones-panel
      [grupos]="grupos()"
      titulo="Directorio de Administración"
      descripcion="Parámetros y datos maestros del sistema de haberes"
    />
  `,
})
export class InicioComponent {
  private readonly permisos = inject(PermisosService);

  readonly grupos = computed<GrupoPanel[]>(() =>
    ADMINISTRADOR_GRUPOS.map((grupo) => ({
      ...grupo,
      items: grupo.items.filter((item) => this.permisos.tieneAcceso(item.path)),
    })).filter((grupo) => grupo.items.length > 0),
  );
}
