import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent, SidebarComponent } from '@haberes/ui-layout';
import { AuthService } from '@haberes/shared-api';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent, SidebarComponent],
  selector: 'app-root',
  template: `
    @if (isLoggedIn$ | async; as loggedIn) {
      <div class="flex h-screen overflow-hidden bg-gray-50">
        <ui-sidebar 
          moduleName="Liquidacion" 
          [menuItems]="menuItems"
          class="w-64 flex-shrink-0 border-r border-gray-200 bg-white hidden md:flex flex-col shadow-sm z-10">
        </ui-sidebar>
        
        <div class="flex-1 flex flex-col w-full h-full">
          <ui-navbar class="h-16 flex-shrink-0 bg-white border-b border-gray-200 shadow-sm z-10"></ui-navbar>
          <main class="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50">
            <div class="max-w-7xl mx-auto">
              <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
                <h2 class="text-2xl font-bold text-gray-800">Módulo Liquidacion</h2>
                <p class="text-gray-600">Estructura de diseño migrada correctamente desde Tesorería.</p>
              </div>
              <router-outlet></router-outlet>
            </div>
          </main>
        </div>
      </div>
    } @else {
      <div class="min-h-screen bg-gray-50">
        <router-outlet></router-outlet>
      </div>
    }
  `
})
export class AppComponent {
  title = 'liquidacion';
  private readonly authService = inject(AuthService);
  isLoggedIn$ = this.authService.currentUser$;

  menuItems = [
    { label: 'Inicio', path: '/', iconSvg: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' }
  ];
}