import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, SOPORTE_EMAIL } from '@haberes/shared-api';

/**
 * Botón "Solicitar acceso" para Haberes.
 *
 * Haberes no tiene catálogo de permisos ni `permisos.administrar`: el acceso se
 * resuelve por asignación de facultad, que hoy no se gestiona desde el frontend.
 * Por eso el pedido se deriva a la mesa de ayuda por correo (`SOPORTE_EMAIL`).
 * Si la dirección no está configurada, no se muestra el botón para no ofrecer
 * una acción que no lleva a ningún lado.
 */
@Component({
  selector: 'ui-solicitar-acceso',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    @if (email) {
      <a [href]="mailto" class="um-btn-primary">Solicitar acceso</a>
    } @else if (mostrarSiempre) {
      <span class="text-xs text-um-muted">
        Solicitá la habilitación a la mesa de ayuda.
      </span>
    }
  `,
})
export class SolicitarAccesoComponent {
  readonly email = inject(SOPORTE_EMAIL);
  private readonly authService = inject(AuthService);

  /** Módulo o pantalla sobre la que se pide acceso. */
  @Input() contexto = 'Acceso a módulo';

  /** En la página `sin-acceso` conviene explicar la salida aunque no haya correo. */
  @Input() mostrarSiempre = false;

  get mailto(): string {
    const legajo = this.authService.currentUserValue?.legajoId ?? '';

    const asunto = `[Haberes] Solicitud de acceso - ${this.contexto}`;
    const cuerpo = [
      'Solicito la habilitación de acceso en el sistema de Haberes.',
      '',
      `Módulo/pantalla: ${this.contexto}`,
      `Legajo: ${legajo || '(completar)'}`,
      `Fecha: ${new Date().toLocaleString('es-AR')}`,
      '',
      'Motivo:',
    ].join('\n');

    return `mailto:${this.email}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
  }
}
