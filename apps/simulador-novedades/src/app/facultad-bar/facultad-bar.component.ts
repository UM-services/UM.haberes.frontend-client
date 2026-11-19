import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { AccesoDenegadoService, AuthService, mensajeDeError } from '@haberes/shared-api';
import { FacultadSimulador, FacultadesSimuladorService } from './facultades-simulador.service';

/**
 * Barra persistente del Simulador Novedades.
 *
 * Se proyecta dentro de `<ui-shell>` (ver `app.ts`), así que acompaña a todas
 * las pantallas. Su función es doble: elegir la facultad que se va a simular y
 * recordar de forma inequívoca que se está viendo el sistema "como" esa
 * facultad y no con la sesión real del administrador.
 */
@Component({
  selector: 'app-facultad-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div
      class="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3"
      role="status"
      aria-live="polite"
    >
      <div class="flex min-w-0 items-center gap-2">
        <span
          class="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800"
        >
          Simulador
        </span>
        <p class="text-sm text-amber-900">
          @if (simulando()) {
            Simulando como <strong>{{ nombreSimulado() }}</strong>. Los cambios que
            hagas impactan en los datos reales.
          } @else {
            Elegí una facultad para ver el módulo como lo ve un usuario de esa facultad.
          }
        </p>
      </div>

      <label class="ml-auto flex items-center gap-2">
        <span class="text-[11px] font-semibold uppercase tracking-wider text-amber-700">
          Facultad
        </span>
        <select
          class="um-input min-w-56 bg-white"
          [value]="seleccionada() ?? ''"
          (change)="cambiar($event)"
          [disabled]="cargando()"
        >
          <option value="">— Elegir —</option>
          @for (facultad of facultades(); track facultad.facultadId) {
            <option [value]="facultad.facultadId">{{ facultad.nombre }}</option>
          }
        </select>
      </label>
    </div>

    @if (error()) {
      <div class="um-alert um-alert-error mb-5" role="alert">{{ error() }}</div>
    }
  `,
})
export class FacultadBarComponent {
  private readonly auth = inject(AuthService);
  private readonly facultadesService = inject(FacultadesSimuladorService);
  private readonly router = inject(Router);
  private readonly accesoDenegado = inject(AccesoDenegadoService);

  readonly facultades = signal<FacultadSimulador[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  readonly seleccionada = this.auth.facultadId;
  readonly simulando = this.auth.simulandoFacultad;
  readonly nombreSimulado = this.auth.facultadSimuladaNombre;

  private readonly esAdmin = computed(() => this.auth.esAdministrador());
  private cargado = false;

  constructor() {
    // La barra se instancia apenas arranca la app (incluso en /login), pero sólo
    // debe pedir el catálogo cuando la sesión ya es de administrador.
    effect(() => {
      if (this.esAdmin() && !this.cargado) this.cargar();
    });
  }

  cambiar(event: Event): void {
    const valor = (event.target as HTMLSelectElement).value;
    const facultad = this.facultades().find((f) => String(f.facultadId) === valor) ?? null;

    this.auth.simularFacultad(
      facultad ? { facultadId: facultad.facultadId, nombre: facultad.nombre } : null,
    );
    this.accesoDenegado.limpiar();

    // Re-monta la pantalla activa (o el inicio) para que lea la nueva facultad.
    void this.router.navigateByUrl(this.router.url);
  }

  private cargar(): void {
    this.cargado = true;
    this.cargando.set(true);
    this.error.set(null);

    this.facultadesService.getAll().subscribe({
      next: (facultades) => {
        this.facultades.set(
          [...facultades].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
        );
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        this.cargado = false;
        this.error.set(mensajeDeError(err, 'No se pudo cargar el catálogo de facultades.'));
      },
    });
  }
}
