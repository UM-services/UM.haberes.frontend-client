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
          moduleName="Novedades" 
          [menuItems]="menuItems"
          class="w-64 flex-shrink-0 border-r border-gray-200 bg-white hidden md:flex flex-col shadow-sm z-10">
        </ui-sidebar>
        
        <div class="flex-1 flex flex-col w-full h-full">
          <ui-navbar class="h-16 flex-shrink-0 bg-white border-b border-gray-200 shadow-sm z-10"></ui-navbar>
          <main class="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50">
            <div class="max-w-7xl mx-auto">
              
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
  title = 'novedades';
  private readonly authService = inject(AuthService);
  isLoggedIn$ = this.authService.currentUser$;

  menuItems = [
    { label: 'Asignación Cursos', path: '/asig-cursos', iconSvg: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    { label: 'Docentes por Sede', path: '/docentes-sede', iconSvg: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' },
    { label: 'Cargos x Legajo', path: '/cargos', iconSvg: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { label: 'Anotador', path: '/anotador', iconSvg: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
    { label: 'Designaciones', path: '/inicio', iconSvg: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' }
  ];
}