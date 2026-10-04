import { Component, computed, Input, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

/** Una opción enlazable del panel (análogo a un módulo del hub de tesorería). */
export interface OpcionPanel {
  label: string;
  path: string;
  descripcion: string;
  /** false muestra la tarjeta como "En desarrollo" (punto ámbar) en vez de "Disponible". */
  disponible: boolean;
}

/** Sección del panel: agrupa opciones bajo un título, como los GRUPOS del hub. */
export interface GrupoPanel {
  id: string;
  title: string;
  descripcion?: string;
  items: OpcionPanel[];
}

/**
 * Panel principal de opciones replicando la presentación del hub estático de
 * tesorería (compose/hub/index.html): header de página con búsqueda en vivo,
 * secciones por grupo separadas por filetes y grilla auto-fill de tarjetas
 * con punto de estado, nombre, badge monoespaciado, descripción y estado.
 * A diferencia del hub, el estado es estático (lo define cada app en los
 * datos) porque las rutas internas no se pueden verificar con un ping.
 */
@Component({
  selector: 'ui-opciones-panel',
  standalone: true,
  imports: [RouterModule, FormsModule],
  template: `
    <div class="w-full">
      <!-- Header de página (patrón page-header del hub) -->
      <header class="um-page-header">
        <div>
          <p class="um-eyebrow">{{ eyebrow }}</p>
          <h1 class="um-page-title">{{ titulo }}</h1>
          <p class="um-page-desc">
            {{ descripcion }} · {{ totalDisponibles() }} disponibles de {{ totalOpciones() }}
          </p>
        </div>

        <!-- Búsqueda en vivo sobre todas las opciones -->
        <div class="relative w-full sm:w-80">
          <input
            type="text"
            [ngModel]="searchTerm()"
            (ngModelChange)="searchTerm.set($event)"
            placeholder="Buscar por nombre o descripción..."
            aria-label="Buscar operaciones"
            class="um-input pl-9"
          />
          <svg xmlns="http://www.w3.org/2000/svg" class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-um-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </header>

      <!-- Secciones por grupo con grilla de tarjetas (patrón section + .card del hub) -->
      @for (g of filteredGroups(); track g.id) {
        <section class="um-section">
          <div class="flex flex-wrap items-baseline justify-between gap-2">
            <h2 class="um-eyebrow">{{ g.title }}</h2>
            <span class="font-mono text-xs tabular-nums text-um-muted">{{ g.items.length }} opciones</span>
          </div>
          @if (g.descripcion) {
            <p class="mt-1 text-xs text-um-muted">{{ g.descripcion }}</p>
          }

          <div class="mt-4 grid gap-4 grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
            @for (item of g.items; track item.path) {
              <a
                [routerLink]="item.path"
                class="um-card flex flex-col gap-3 transition-colors hover:border-um-primary hover:bg-um-selected focus:outline-none focus-visible:ring-2 focus-visible:ring-um-primary focus-visible:ring-offset-2"
                [title]="'Abrir ' + item.label"
              >
                <span class="flex items-center gap-2 min-w-0">
                  <span
                    class="h-2 w-2 shrink-0 rounded-full"
                    [class]="item.disponible ? 'bg-emerald-600' : 'bg-amber-500'"
                  ></span>
                  <span class="min-w-0 flex-1 truncate text-base font-bold text-um-ink">{{ item.label }}</span>
                  <span class="shrink-0 rounded-full border border-um-border bg-um-surface px-2.5 py-0.5 font-mono text-xs font-semibold text-um-muted">
                    {{ codigoRuta(item.path) }}
                  </span>
                </span>

                <span class="text-sm text-um-muted">{{ item.descripcion }}</span>

                <span
                  class="text-xs font-semibold"
                  [class]="item.disponible ? 'text-emerald-700' : 'text-amber-700'"
                >{{ item.disponible ? 'Disponible' : 'En desarrollo' }}</span>
              </a>
            }
          </div>
        </section>
      }

      @if (filteredGroups().length === 0) {
        <section class="py-16 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto mb-2 h-8 w-8 text-um-border-strong" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p class="text-sm font-semibold text-um-ink">No se encontraron operaciones coincidentes</p>
          <p class="mt-1 text-xs text-um-muted">Intente con otro término de búsqueda.</p>
          <button (click)="searchTerm.set('')" class="um-btn-secondary mt-4">Restablecer búsqueda</button>
        </section>
      }
    </div>
  `
})
export class UiOpcionesPanelComponent {
  @Input() grupos: GrupoPanel[] = [];
  @Input() eyebrow = 'Panel de acceso';
  @Input() titulo = 'Directorio de Operaciones';
  @Input() descripcion = 'Catálogo unificado de operaciones del módulo';

  searchTerm = signal<string>('');

  totalOpciones = computed(() =>
    this.grupos.reduce((acc, g) => acc + g.items.length, 0)
  );

  totalDisponibles = computed(() =>
    this.grupos.reduce((acc, g) => acc + g.items.filter(o => o.disponible).length, 0)
  );

  filteredGroups = computed<GrupoPanel[]>(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) {
      return this.grupos;
    }
    return this.grupos
      .map(g => ({
        ...g,
        items: g.items.filter(item =>
          item.label.toLowerCase().includes(term) ||
          item.descripcion.toLowerCase().includes(term) ||
          g.title.toLowerCase().includes(term)
        )
      }))
      .filter(g => g.items.length > 0);
  });

  /** Identificador corto para el badge de la tarjeta (análogo al puerto del hub). */
  codigoRuta(path: string): string {
    return path.split('/').filter(Boolean).pop() ?? path;
  }
}
