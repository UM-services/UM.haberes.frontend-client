import { Routes } from '@angular/router';
import { SIN_ACCESO_RUTA, authGuard, moduloGuard, unauthGuard } from '@haberes/shared-api';
import { NoAccesoComponent } from '@haberes/ui-layout';

/** Novedades es un módulo de facultad: sólo entra un usuario con facultad asignada. */
const DATOS_MODULO = { requireFacultadId: true } as const;

export const appRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('@haberes/ui-auth').then(m => m.LoginComponent),
    canActivate: [unauthGuard],
    data: DATOS_MODULO
  },
  {
    // Ruta pública de las guards: explica la denegación sin cerrar la sesión.
    path: SIN_ACCESO_RUTA,
    component: NoAccesoComponent
  },
  {
    path: 'anotador',
    loadComponent: () => import('@haberes/feature-anotador').then(m => m.AnotadorComponent),
    canActivate: [authGuard, moduloGuard],
    data: DATOS_MODULO
  },
  {
    path: 'cargos',
    loadComponent: () => import('@haberes/feature-cargos').then(m => m.CargosLegajoComponent),
    canActivate: [authGuard, moduloGuard],
    data: DATOS_MODULO
  },
  {
    path: 'docentes-sede',
    loadComponent: () => import('@haberes/feature-cargos').then(m => m.DocentesSedeComponent),
    canActivate: [authGuard, moduloGuard],
    data: DATOS_MODULO
  },
  {
    path: 'asig-cursos',
    loadComponent: () => import('@haberes/feature-designaciones').then(m => m.AsigCursosComponent),
    canActivate: [authGuard, moduloGuard],
    data: DATOS_MODULO
  },
  {
    path: 'designaciones',
    loadComponent: () => import('@haberes/feature-designaciones').then(m => m.DesignacionesComponent),
    canActivate: [authGuard, moduloGuard],
    data: DATOS_MODULO
  },
  {
    path: 'inicio',
    loadComponent: () => import('./inicio.component').then(m => m.InicioComponent),
    canActivate: [authGuard, moduloGuard],
    data: DATOS_MODULO
  },
  { path: '', redirectTo: 'inicio', pathMatch: 'full' },
  { path: '**', redirectTo: 'inicio' }
];

