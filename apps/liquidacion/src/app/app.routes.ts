import { Routes } from '@angular/router';
import { LoginComponent } from '@haberes/ui-auth';
import { authGuard, unauthGuard } from '@haberes/shared-api';
import { Component } from '@angular/core';

@Component({
  standalone: true,
  template: '<div class="bg-white p-6 rounded-lg shadow-sm border border-gray-100"><h3 class="text-lg font-semibold text-gray-800 mb-2">Bienvenido al Sistema</h3><p class="text-gray-600">Seleccione una opción del menú lateral para comenzar a trabajar.</p></div>'
})
export class InicioComponent {}

export const appRoutes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [unauthGuard], data: { requireFacultadId: false } },
  { path: 'inicio', component: InicioComponent, canActivate: [authGuard] },
  { path: '', redirectTo: 'inicio', pathMatch: 'full' },
  { path: '**', redirectTo: 'inicio' }
];
