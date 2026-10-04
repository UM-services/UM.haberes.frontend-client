import { Component } from '@angular/core';
import { GrupoPanel, UiOpcionesPanelComponent } from '@haberes/ui-layout';
import { MENU_GROUPS, RUTAS_MIGRADAS } from './menu-options.data';

/**
 * Panel principal de Liquidación: catálogo de opciones en formato hub
 * (presentación del hub estático de tesorería) sobre el panel compartido.
 * El estado "Disponible" sale de RUTAS_MIGRADAS; el resto son placeholders
 * marcados "En desarrollo".
 */
@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [UiOpcionesPanelComponent],
  template: `
    <ui-opciones-panel
      [grupos]="grupos"
      titulo="Directorio de Operaciones"
      descripcion="Catálogo unificado de procesos de liquidación, reportes y administración de haberes"
    />
  `
})
export class InicioComponent {
  readonly grupos: GrupoPanel[] = MENU_GROUPS.map(g => ({
    id: g.id,
    title: g.title,
    descripcion: g.descripcion,
    items: g.items.map(o => ({
      label: o.label,
      path: o.path,
      descripcion: o.descripcion,
      disponible: RUTAS_MIGRADAS.has(o.path)
    }))
  }));
}
