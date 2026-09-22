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
    <div class="space-y-8">
      <!-- Header Banner -->
      <div class="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 md:p-8 text-white shadow-md relative overflow-hidden">
        <div class="relative z-10 max-w-3xl">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-3 border border-blue-400/30">
            <span>Sistema de Haberes</span>
            <span>•</span>
            <span>Referencia: prjBonos.vbp</span>
          </div>
          <h1 class="text-3xl font-extrabold tracking-tight">Módulo Liquidación de Haberes</h1>
          <p class="text-blue-200 mt-2 text-sm md:text-base leading-relaxed">
            Catálogo completo de opciones operativas elegibles migradas desde Visual Basic 6.
            Seleccione cualquier opción para acceder a su espacio de trabajo correspondiente.
          </p>
          
          <div class="mt-6 flex flex-wrap gap-4 text-xs">
            <div class="bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/10">
              <span class="text-blue-300 block">Total Opciones</span>
              <span class="text-lg font-bold">{{ totalOpciones }}</span>
            </div>
            <div class="bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/10">
              <span class="text-blue-300 block">Grupos Funcionales</span>
              <span class="text-lg font-bold">{{ grupos.length }}</span>
            </div>
            <div class="bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/10">
              <span class="text-blue-300 block">Arquitectura</span>
              <span class="text-lg font-bold">Angular 21 + Nx</span>
            </div>
          </div>
        </div>

        <div class="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <svg class="w-80 h-80 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
          </svg>
        </div>
      </div>

      <!-- Quick Search & Filter Toolbar -->
      <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div class="relative w-full md:w-96">
          <input
            type="text"
            [ngModel]="searchTerm()"
            (ngModelChange)="searchTerm.set($event)"
            placeholder="Buscar opción por nombre, descripción o .frm..."
            class="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <!-- Filter tabs -->
        <div class="flex flex-wrap items-center gap-x-1.5 gap-y-2 w-full md:w-auto">
          <button
            (click)="selectedGroup.set('todos')"
            [class.bg-blue-600]="selectedGroup() === 'todos'"
            [class.text-white]="selectedGroup() === 'todos'"
            [class.bg-gray-100]="selectedGroup() !== 'todos'"
            [class.text-gray-600]="selectedGroup() !== 'todos'"
            class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap hover:bg-blue-500 hover:text-white"
          >
            Todos ({{ totalOpciones }})
          </button>
          @for (g of grupos; track g.id) {
            <button
              (click)="selectedGroup.set(g.id)"
              [class.bg-blue-600]="selectedGroup() === g.id"
              [class.text-white]="selectedGroup() === g.id"
              [class.bg-gray-100]="selectedGroup() !== g.id"
              [class.text-gray-600]="selectedGroup() !== g.id"
              class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap hover:bg-blue-500 hover:text-white"
            >
              {{ g.title }} ({{ g.items.length }})
            </button>
          }
        </div>
      </div>

      <!-- Grid of Groups & Options -->
      <div class="space-y-8">
        @for (g of filteredGroups(); track g.id) {
          <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <!-- Group Header -->
            <div class="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="p-2 bg-blue-100 text-blue-700 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="g.iconSvg" />
                  </svg>
                </div>
                <div>
                  <h2 class="text-lg font-bold text-gray-800">{{ g.title }}</h2>
                  <p class="text-xs text-gray-500">{{ g.descripcion }}</p>
                </div>
              </div>
              <span class="text-xs font-semibold px-2.5 py-1 bg-gray-200 text-gray-700 rounded-full">
                {{ g.items.length }} opciones
              </span>
            </div>

            <!-- Options Grid -->
            <div class="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              @for (item of g.items; track item.path) {
                <a
                  [routerLink]="item.path"
                  class="group p-4 rounded-xl border border-gray-100 hover:border-blue-300 hover:bg-blue-50/40 transition-all duration-200 flex flex-col justify-between shadow-sm hover:shadow"
                >
                  <div>
                    <div class="flex items-start justify-between gap-2 mb-2">
                      <div class="p-1.5 rounded-lg bg-gray-100 text-gray-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="item.iconSvg" />
                        </svg>
                      </div>
                      <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-800 transition-colors">
                        {{ item.origenVb6 }}
                      </span>
                    </div>

                    <h3 class="text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition-colors leading-tight">
                      {{ item.label }}
                    </h3>
                    <p class="text-xs text-gray-500 mt-1.5 line-clamp-2">
                      {{ item.descripcion }}
                    </p>
                  </div>

                  <div class="mt-4 pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-blue-600 font-medium opacity-80 group-hover:opacity-100">
                    <span>Acceder a opción</span>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </a>
              }
            </div>
          </div>
        }

        @if (filteredGroups().length === 0) {
          <div class="bg-white p-12 text-center rounded-2xl border border-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 class="text-lg font-bold text-gray-800">No se encontraron opciones</h3>
            <p class="text-sm text-gray-500 mt-1">No hay ninguna opción que coincida con "{{ searchTerm() }}".</p>
            <button
              (click)="searchTerm.set(''); selectedGroup.set('todos')"
              class="mt-4 px-4 py-2 text-xs font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
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
