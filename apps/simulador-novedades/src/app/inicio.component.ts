import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NOVEDADES_GRUPOS } from '@haberes/novedades-menu';
import { AuthService } from '@haberes/shared-api';
import { UiOpcionesPanelComponent } from '@haberes/ui-layout';

/**
 * Panel principal del Simulador Novedades.
 *
 * Antes de elegir facultad explica el paso pendiente; una vez elegida muestra
 * el mismo directorio que el módulo Novedades, sin variantes.
 */
@Component({
  selector: 'app-inicio',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [UiOpcionesPanelComponent],
  template: `
    @if (simulando()) {
      <ui-opciones-panel
        [grupos]="grupos"
        titulo="Directorio de Operaciones"
        descripcion="Catálogo de operaciones del módulo de Novedades, con la facultad simulada"
      />
    } @else {
      <section class="um-card p-6">
        <p class="um-eyebrow">Simulador Novedades</p>
        <h1 class="um-page-title mt-1">Elegí una facultad</h1>
        <p class="mt-2 max-w-2xl text-sm text-um-text">
          Usá el selector de la barra superior para elegir la facultad que querés
          inspeccionar. A partir de ese momento vas a ver las mismas pantallas y los
          mismos datos que un usuario del módulo Novedades de esa facultad.
        </p>
        <p class="mt-2 max-w-2xl text-sm text-um-muted">
          El directorio de operaciones se habilita cuando hay una facultad elegida.
        </p>
      </section>
    }
  `,
})
export class InicioComponent {
  private readonly auth = inject(AuthService);

  readonly grupos = NOVEDADES_GRUPOS;
  readonly simulando = this.auth.simulandoFacultad;
}
