import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { PermisosService } from '@haberes/shared-api';
import { GrupoPanel, UiOpcionesPanelComponent } from '@haberes/ui-layout';
import { MENU_GROUPS, RUTAS_MIGRADAS } from './menu-options.data';

/**
 * Panel principal de Liquidación: catálogo de opciones en formato hub
 * (presentación del hub estático de tesorería) sobre el panel compartido.
 * El estado "Disponible" sale de RUTAS_MIGRADAS; el resto son placeholders
 * marcados "En desarrollo". Sólo se muestran las opciones habilitadas.
 */
@Component({
  selector: 'app-inicio',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [UiOpcionesPanelComponent],
  template: `
    <ui-opciones-panel
      [grupos]="grupos()"
      titulo="Directorio de Operaciones"
      descripcion="Catálogo unificado de procesos de liquidación, designaciones, reportes y contabilidad de haberes"
    />
  `
})
export class InicioComponent {
  private readonly permisos = inject(PermisosService);

  readonly grupos = computed<GrupoPanel[]>(() =>
    MENU_GROUPS.map(g => ({
      id: g.id,
      title: g.title,
      descripcion: g.descripcion,
      items: g.items
        .filter(o => this.permisos.tieneAcceso(o.path))
        .map(o => ({
          label: o.label,
          path: o.path,
          descripcion: o.descripcion,
          disponible: RUTAS_MIGRADAS.has(o.path)
        }))
    })).filter(g => g.items.length > 0)
  );
}
