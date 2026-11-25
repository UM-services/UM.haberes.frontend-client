import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NOVEDADES_GRUPOS } from '@haberes/novedades-menu';
import { PermisosService } from '@haberes/shared-api';
import { GrupoPanel } from '@haberes/ui-layout';
import { UiOpcionesPanelComponent } from '@haberes/ui-layout';

/** Panel principal del módulo Novedades: catálogo de opciones en formato hub. */
@Component({
  selector: 'app-inicio',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [UiOpcionesPanelComponent],
  template: `
    <ui-opciones-panel
      [grupos]="grupos()"
      titulo="Directorio de Operaciones"
      descripcion="Catálogo de operaciones del módulo de Novedades"
    />
  `
})
export class InicioComponent {
  private readonly permisos = inject(PermisosService);

  readonly grupos = computed<GrupoPanel[]>(() =>
    NOVEDADES_GRUPOS.map((grupo) => ({
      ...grupo,
      items: grupo.items.filter((item) => this.permisos.tieneAcceso(item.path)),
    })).filter((grupo) => grupo.items.length > 0),
  );
}
