import { Routes } from '@angular/router';
import { authGuard, unauthGuard } from '@haberes/shared-api';

export const appRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('@haberes/ui-auth').then(m => m.LoginComponent),
    canActivate: [unauthGuard],
    data: { requireFacultadId: true }
  },
  {
    path: 'anotador',
    loadComponent: () => import('@haberes/feature-anotador').then(m => m.AnotadorComponent),
    canActivate: [authGuard]
  },
  {
    path: 'cargos',
    loadComponent: () => import('@haberes/feature-cargos').then(m => m.CargosLegajoComponent),
    canActivate: [authGuard]
  },
  {
    path: 'docentes-sede',
    loadComponent: () => import('@haberes/feature-cargos').then(m => m.DocentesSedeComponent),
    canActivate: [authGuard]
  },
  {
    path: 'asig-cursos',
    loadComponent: () => import('@haberes/feature-designaciones').then(m => m.AsigCursosComponent),
    canActivate: [authGuard]
  },
  {
    path: 'inicio',
    loadComponent: () => import('@haberes/feature-designaciones').then(m => m.DesignacionesComponent),
    canActivate: [authGuard]
  },
  { path: '', redirectTo: 'inicio', pathMatch: 'full' },
  { path: '**', redirectTo: 'inicio' }
];

