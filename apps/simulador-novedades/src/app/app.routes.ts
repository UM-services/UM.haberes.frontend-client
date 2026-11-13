import { Routes } from '@angular/router';
import {
  SIN_ACCESO_RUTA,
  administradorGuard,
  authGuard,
  facultadSimuladaGuard,
  moduloGuard,
  unauthGuard,
} from '@haberes/shared-api';
import { NoAccesoComponent } from '@haberes/ui-layout';

/**
 * El simulador replica Novedades, pero lo usa un administrador global (sin
 * facultad). Por eso el módulo se declara global (`requireFacultadId: false`) y
 * suma dos reglas: `administradorGuard` (flag `usuario.administrador == 1`) y
 * `facultadSimuladaGuard` (exige elegir la facultad a inspeccionar).
 */
const DATOS_MODULO = { requireFacultadId: false } as const;

export const appRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('@haberes/ui-auth').then((m) => m.LoginComponent),
    canActivate: [unauthGuard],
    data: { requireFacultadId: false, requireAdministrador: true },
  },
  {
    // Ruta pública de las guards: explica la denegación sin cerrar la sesión.
    path: SIN_ACCESO_RUTA,
    component: NoAccesoComponent,
  },
  {
    path: 'inicio',
    loadComponent: () => import('./inicio.component').then((m) => m.InicioComponent),
    canActivate: [authGuard, moduloGuard, administradorGuard],
    data: DATOS_MODULO,
  },
  {
    path: 'anotador',
    loadComponent: () => import('@haberes/feature-anotador').then((m) => m.AnotadorComponent),
    canActivate: [authGuard, moduloGuard, administradorGuard, facultadSimuladaGuard],
    data: DATOS_MODULO,
  },
  {
    path: 'cargos',
    loadComponent: () => import('@haberes/feature-cargos').then((m) => m.CargosLegajoComponent),
    canActivate: [authGuard, moduloGuard, administradorGuard, facultadSimuladaGuard],
    data: DATOS_MODULO,
  },
  {
    path: 'docentes-sede',
    loadComponent: () => import('@haberes/feature-cargos').then((m) => m.DocentesSedeComponent),
    canActivate: [authGuard, moduloGuard, administradorGuard, facultadSimuladaGuard],
    data: DATOS_MODULO,
  },
  {
    path: 'asig-cursos',
    loadComponent: () => import('@haberes/feature-designaciones').then((m) => m.AsigCursosComponent),
    canActivate: [authGuard, moduloGuard, administradorGuard, facultadSimuladaGuard],
    data: DATOS_MODULO,
  },
  {
    path: 'designaciones',
    loadComponent: () =>
      import('@haberes/feature-designaciones').then((m) => m.DesignacionesComponent),
    canActivate: [authGuard, moduloGuard, administradorGuard, facultadSimuladaGuard],
    data: DATOS_MODULO,
  },
  { path: '', redirectTo: 'inicio', pathMatch: 'full' },
  { path: '**', redirectTo: 'inicio' },
];
