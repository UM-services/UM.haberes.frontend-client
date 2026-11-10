import { Location } from '@angular/common';
import {
  Component,
  OnDestroy,
  OnInit,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  AccesoDenegadoDetalle,
  AccesoDenegadoService,
  AuthService,
} from '@haberes/shared-api';
import { SolicitarAccesoComponent } from '../solicitar-acceso/solicitar-acceso';

/**
 * Pantalla pública de las guards de módulo. Explica la regla de acceso y ofrece
 * volver o ir al inicio sin destruir la sesión. "Cerrar sesión" queda como
 * acción secundaria y explícita.
 */
@Component({
  selector: 'ui-no-acceso',
  standalone: true,
  imports: [SolicitarAccesoComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="mx-auto max-w-md py-14">
      <div class="um-card text-center">
        <p class="um-eyebrow">Acceso restringido</p>
        <h1 class="mt-2 text-2xl font-bold tracking-tight text-um-ink">
          Este módulo no está habilitado para tu usuario
        </h1>
        <p class="mt-3 text-sm text-um-muted">{{ mensaje }}</p>

        <div class="mt-6 flex flex-wrap justify-center gap-2">
          <button type="button" class="um-btn-secondary" (click)="volver()">Volver</button>
          <button type="button" class="um-btn-secondary" (click)="irAlInicio()">
            Ir al inicio
          </button>
          <ui-solicitar-acceso
            [contexto]="detalle?.modulo ?? 'Acceso a módulo'"
            [mostrarSiempre]="true"
          />
        </div>

        <button
          type="button"
          class="mt-6 text-xs font-medium text-um-muted underline underline-offset-4 hover:text-um-ink"
          (click)="cerrarSesion()"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  `,
})
export class NoAccesoComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly accesoDenegado = inject(AccesoDenegadoService);

  detalle: AccesoDenegadoDetalle | null = null;

  get mensaje(): string {
    return (
      this.detalle?.mensaje ??
      'Tu usuario no tiene la asignación requerida para este módulo. Si considerás que es un error, solicitá la habilitación a la mesa de ayuda.'
    );
  }

  ngOnInit(): void {
    this.detalle = this.accesoDenegado.detalle();
  }

  ngOnDestroy(): void {
    this.accesoDenegado.limpiar();
  }

  volver(): void {
    if (typeof history !== 'undefined' && history.length > 1) {
      this.location.back();
      return;
    }
    void this.router.navigate(['/']);
  }

  irAlInicio(): void {
    void this.router.navigate(['/']);
  }

  cerrarSesion(): void {
    this.authService.clearSession();
    void this.router.navigate(['/login']);
  }
}
