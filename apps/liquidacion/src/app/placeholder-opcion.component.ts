import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';

@Component({
  selector: 'app-placeholder-opcion',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="flex flex-col gap-6">
      <!-- Breadcrumbs -->
      <nav class="flex text-xs text-slate-500 gap-1.5 items-center font-medium">
        <a routerLink="/inicio" class="hover:text-blue-700 transition-colors">Directorio de Operaciones</a>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
        <span class="text-slate-400">{{ grupo }}</span>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
        <span class="text-slate-900 font-semibold truncate">{{ titulo }}</span>
      </nav>

      <!-- View Header -->
      <div class="border-b border-slate-200 pb-5">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200/70">
                {{ grupo }}
              </span>
              <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/70">
                <span class="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                Módulo en desarrollo
              </span>
            </div>
            <h1 class="text-2xl font-bold text-slate-900 tracking-tight">{{ titulo }}</h1>
            <p class="text-slate-500 mt-1 text-xs md:text-sm max-w-2xl leading-relaxed">{{ descripcion }}</p>
          </div>
          
          <a routerLink="/inicio" 
             class="inline-flex items-center justify-center px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-2xs shrink-0 cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver al Directorio
          </a>
        </div>
      </div>

      <!-- Feature Spec Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Área Operativa</span>
          <div class="flex items-center gap-2 text-xs font-semibold text-slate-900">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {{ grupo }}
          </div>
          <span class="text-[11px] text-slate-500 mt-1 block">Gestión de Haberes y Liquidaciones</span>
        </div>

        <div class="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Estado del Módulo</span>
          <div class="flex items-center gap-2 text-xs font-semibold text-amber-700">
            <span class="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Planificado en Desarrollo
          </div>
          <span class="text-[11px] text-slate-500 mt-1 block">Próxima fase: Despliegue de funcionalidad en línea</span>
        </div>

        <div class="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Plataforma</span>
          <div class="text-xs font-semibold text-slate-800">Portal de Haberes Web UM</div>
          <span class="text-[11px] text-slate-500 mt-1 block">Universidad de Mendoza</span>
        </div>
      </div>

      <!-- Explanatory note -->
      <div class="p-4 rounded-xl bg-blue-50/70 border border-blue-200/60 flex items-start gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-blue-700 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div class="text-xs text-blue-950">
          <p class="font-semibold">Módulo en proceso de incorporación al portal web</p>
          <p class="mt-0.5 text-blue-800 text-[11px] leading-relaxed">
            Esta funcionalidad se encuentra planificada en el cronograma de actualización del sistema de Haberes. Para requerimientos sobre este proceso, comuníquese con el área de Liquidaciones o Dirección de Sistemas.
          </p>
        </div>
      </div>
    </div>
  `
})
export class PlaceholderOpcionComponent {
  private readonly route = inject(ActivatedRoute);

  titulo = this.route.snapshot.data['titulo'] || 'Opción de Sistema';
  grupo = this.route.snapshot.data['grupo'] || 'Liquidación';
  descripcion = this.route.snapshot.data['descripcion'] || 'Módulo elegible de liquidación de haberes.';
}
