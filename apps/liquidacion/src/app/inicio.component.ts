import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MENU_GROUPS, GrupoOpciones, OpcionSistema, TODAS_LAS_OPCIONES } from './menu-options.data';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="w-full">
      <!-- Top Command Bar: Institutional Header & Live Search -->
      <div class="border-b border-slate-200 px-6 py-5 bg-white">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
              <span class="text-blue-700 font-bold uppercase tracking-wider text-[11px]">Sistema de Haberes</span>
              <span>/</span>
              <span>Liquidación</span>
              <span>/</span>
              <span class="text-slate-600 font-medium text-[11px]">Operaciones</span>
            </div>
            <h1 class="text-2xl font-bold tracking-tight text-slate-900">Directorio de Operaciones y Procesos</h1>
            <p class="text-xs text-slate-500 mt-0.5">Catálogo unificado de procesos de liquidación, reportes y administración de haberes.</p>
          </div>

          <div class="flex items-center gap-3">
            <!-- Live search input -->
            <div class="relative w-full sm:w-80">
              <input
                type="text"
                [ngModel]="searchTerm()"
                (ngModelChange)="searchTerm.set($event)"
                placeholder="Buscar por nombre o descripción..."
                class="w-full pl-9 pr-3.5 py-2 text-xs text-slate-900 border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all bg-slate-50/50 focus:bg-white"
              />
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Horizontal Category Tabs (Underline indicator) -->
        <div class="flex items-center gap-1 mt-5 overflow-x-auto custom-scrollbar -mb-px">
          <button
            (click)="selectedGroup.set('todos')"
            [class.border-slate-900]="selectedGroup() === 'todos'"
            [class.text-slate-900]="selectedGroup() === 'todos'"
            [class.font-bold]="selectedGroup() === 'todos'"
            [class.border-transparent]="selectedGroup() !== 'todos'"
            [class.text-slate-500]="selectedGroup() !== 'todos'"
            class="px-3 py-2 text-xs border-b-2 whitespace-nowrap hover:text-slate-900 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span>Todos los Grupos</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 font-mono text-slate-600">{{ totalOpciones }}</span>
          </button>
          @for (g of grupos; track g.id) {
            <button
              (click)="selectedGroup.set(g.id)"
              [class.border-slate-900]="selectedGroup() === g.id"
              [class.text-slate-900]="selectedGroup() === g.id"
              [class.font-bold]="selectedGroup() === g.id"
              [class.border-transparent]="selectedGroup() !== g.id"
              [class.text-slate-500]="selectedGroup() !== g.id"
              class="px-3 py-2 text-xs border-b-2 whitespace-nowrap hover:text-slate-900 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>{{ g.title }}</span>
              <span class="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 font-mono text-slate-600">{{ g.items.length }}</span>
            </button>
          }
        </div>
      </div>

      <!-- High-Density Operations Directory (Zero Floating Cards) -->
      <div class="px-6 py-5">
        @for (g of filteredGroups(); track g.id) {
          <div class="mb-7 last:mb-2">
            <!-- Group Header Hairline -->
            <div class="flex items-center justify-between pb-2 mb-1.5 border-b border-slate-200">
              <div class="flex items-center gap-2">
                <span class="h-2 w-2 rounded-full bg-blue-600"></span>
                <h2 class="text-xs font-bold uppercase tracking-wider text-slate-800">{{ g.title }}</h2>
                <span class="text-xs text-slate-300">&bull;</span>
                <span class="text-xs text-slate-500">{{ g.descripcion }}</span>
              </div>
              <span class="text-xs font-mono text-slate-400 tabular-nums">{{ g.items.length }} opciones</span>
            </div>

            <!-- Dense List Rows -->
            <div class="divide-y divide-slate-100">
              @for (item of g.items; track item.path) {
                <a
                  [routerLink]="item.path"
                  class="group flex flex-col sm:flex-row sm:items-center justify-between py-2.5 px-3 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer -mx-3"
                >
                  <div class="flex items-center gap-3.5 min-w-0 flex-1">
                    <span class="text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200/70 px-2.5 py-1 rounded-md shrink-0 w-28 text-center truncate">
                      {{ g.title }}
                    </span>
                    <div class="min-w-0 flex-1">
                      <span class="text-xs font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                        {{ item.label }}
                      </span>
                      <span class="hidden md:inline text-xs text-slate-500 ml-2 truncate">
                        &bull; {{ item.descripcion }}
                      </span>
                    </div>
                  </div>

                  <div class="flex items-center gap-2 shrink-0 text-xs text-slate-400 group-hover:text-blue-700 transition-colors mt-1 sm:mt-0 font-medium">
                    <span class="text-[11px]">Abrir</span>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </a>
              }
            </div>
          </div>
        }

        @if (filteredGroups().length === 0) {
          <div class="py-16 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-slate-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p class="text-xs font-semibold text-slate-700">No se encontraron operaciones coincidentes</p>
            <p class="text-[11px] text-slate-400 mt-0.5">Intente con otro término o seleccione "Todos los Grupos".</p>
            <button
              (click)="searchTerm.set(''); selectedGroup.set('todos')"
              class="mt-3 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors cursor-pointer"
            >
              Restablecer búsqueda
            </button>
          </div>
        }
      </div>
    </div>
  `
})
export class InicioComponent {
  grupos: GrupoOpciones[] = MENU_GROUPS;
  totalOpciones = TODAS_LAS_OPCIONES.length;

  searchTerm = signal<string>('');
  selectedGroup = signal<string>('todos');

  filteredGroups = computed<GrupoOpciones[]>(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const groupFilter = this.selectedGroup();

    return this.grupos
      .filter(g => groupFilter === 'todos' || g.id === groupFilter)
      .map(g => {
        if (!term) {
          return g;
        }
        const matchingItems = g.items.filter((item: OpcionSistema) =>
          item.label.toLowerCase().includes(term) ||
          item.descripcion.toLowerCase().includes(term) ||
          item.origenVb6.toLowerCase().includes(term)
        );
        return {
          ...g,
          items: matchingItems
        };
      })
      .filter(g => g.items.length > 0);
  });
}
