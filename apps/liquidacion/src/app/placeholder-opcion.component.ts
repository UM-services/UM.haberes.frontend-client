import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';

@Component({
  selector: 'app-placeholder-opcion',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="space-y-6">
      <!-- Breadcrumbs -->
      <nav class="flex text-sm text-gray-500 gap-2 items-center">
        <a routerLink="/inicio" class="hover:text-blue-600 transition-colors">Inicio</a>
        <span>/</span>
        <span class="text-gray-400">{{ grupo }}</span>
        <span>/</span>
        <span class="text-gray-800 font-medium">{{ titulo }}</span>
      </nav>

      <!-- Main Status Card -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="p-6 md:p-8">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-100">
            <div>
              <div class="flex items-center gap-3 mb-2">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                  {{ grupo }}
                </span>
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                  En preparación de componente
                </span>
              </div>
              <h1 class="text-2xl font-bold text-gray-900 tracking-tight">{{ titulo }}</h1>
              <p class="text-gray-600 mt-1 text-sm max-w-2xl">{{ descripcion }}</p>
            </div>
            
            <a routerLink="/inicio" 
               class="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver al Panel Principal
            </a>
          </div>

          <!-- Legacy Reference Box -->
          <div class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Referencia VB6 Origen</span>
              <div class="flex items-center gap-2 text-sm font-mono font-medium text-gray-800">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {{ origenVb6 }}
              </div>
              <span class="text-xs text-gray-500 mt-1 block">Proyecto: prjBonos.vbp</span>
            </div>

            <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Estado de Migración</span>
              <div class="flex items-center gap-2 text-sm font-medium text-amber-700">
                <span class="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                Opción de sistema registrada
              </div>
              <span class="text-xs text-gray-500 mt-1 block">Próxima fase: Construcción del componente UI</span>
            </div>

            <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Módulo Frontend</span>
              <div class="text-sm font-medium text-gray-800">haberes-frontend / liquidacion</div>
              <span class="text-xs text-gray-500 mt-1 block">Angular 21 + Tailwind CSS</span>
            </div>
          </div>

          <!-- Explanatory note -->
          <div class="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-100 flex items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div class="text-sm text-blue-900">
              <p class="font-medium">Opción de sistema elegible correctamente configurada</p>
              <p class="mt-0.5 text-blue-700 text-xs">
                La ruta está dada de alta y asociada a la estructura de navegación. En el siguiente paso se implementará la vista, formulario o grilla correspondiente a este componente.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PlaceholderOpcionComponent {
  private readonly route = inject(ActivatedRoute);

  titulo = this.route.snapshot.data['titulo'] || 'Opción de Sistema';
  grupo = this.route.snapshot.data['grupo'] || 'Liquidación';
  origenVb6 = this.route.snapshot.data['origenVb6'] || 'prjBonos.vbp';
  descripcion = this.route.snapshot.data['descripcion'] || 'Módulo elegible de liquidación de haberes.';
}
