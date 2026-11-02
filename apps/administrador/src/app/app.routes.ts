import { Route } from '@angular/router';
import { administradorGuard, authGuard, unauthGuard } from '@haberes/shared-api';

export const appRoutes: Route[] = [
  {
    path: 'login',
    loadComponent: () => import('@haberes/ui-auth').then((m) => m.LoginComponent),
    canActivate: [unauthGuard],
    // false = el módulo es global: rechaza usuarios con facultad asignada.
    data: { requireFacultadId: false },
  },
  {
    path: 'personas',
    loadComponent: () => import('@haberes/feature-personas').then((m) => m.PersonasComponent),
    canActivate: [authGuard, administradorGuard],
  },
  {
    path: 'categorias',
    loadComponent: () => import('@haberes/feature-categorias').then((m) => m.CategoriasComponent),
    canActivate: [authGuard, administradorGuard],
  },
  {
    path: 'codigos',
    loadComponent: () => import('@haberes/feature-codigos').then((m) => m.CodigosComponent),
    canActivate: [authGuard, administradorGuard],
  },
  {
    path: 'clases',
    loadComponent: () => import('@haberes/feature-clases').then((m) => m.ClasesComponent),
    canActivate: [authGuard, administradorGuard],
  },
  {
    path: 'cargos-clase',
    loadComponent: () =>
      import('@haberes/feature-cargos-clase').then((m) => m.CargosClaseComponent),
    canActivate: [authGuard, administradorGuard],
  },
  {
    path: 'adicionales',
    loadComponent: () => import('@haberes/feature-adicionales').then((m) => m.AdicionalesComponent),
    canActivate: [authGuard, administradorGuard],
  },
  {
    path: 'sedes',
    loadComponent: () => import('@haberes/feature-sedes').then((m) => m.SedesComponent),
    canActivate: [authGuard, administradorGuard],
  },
  {
    path: 'inicio',
    loadComponent: () => import('./inicio.component').then((m) => m.InicioComponent),
    canActivate: [authGuard, administradorGuard],
  },
  { path: '', redirectTo: 'inicio', pathMatch: 'full' },
  { path: '**', redirectTo: 'inicio' },
];
