import { Route, Routes } from '@angular/router';
import { authGuard, unauthGuard } from '@haberes/shared-api';
import { RUTAS_MIGRADAS, TODAS_LAS_OPCIONES } from './menu-options.data';

const bonoIndividualRoute: Route = {
  path: 'consultas/bono-individual',
  loadComponent: () => import('@haberes/feature-bonos').then(m => m.BonoIndividualComponent),
  canActivate: [authGuard]
};

const imputacionIndividualRoute: Route = {
  path: 'contabilidad/imputacion-individual',
  loadComponent: () => import('@haberes/feature-contabilidad').then(m => m.ImputacionIndividualComponent),
  canActivate: [authGuard]
};

const designacionesGeneralRoute: Route = {
  path: 'designaciones/general',
  loadComponent: () => import('@haberes/feature-designaciones').then(m => m.DesignacionesComponent),
  canActivate: [authGuard]
};

const actualizarCargosClaseRoute: Route = {
  path: 'designaciones/actualizar-cargos-clase',
  loadComponent: () => import('@haberes/feature-designaciones').then(m => m.CargosClaseActualizarComponent),
  canActivate: [authGuard]
};

const anotadorRoute: Route = {
  path: 'designaciones/anotador',
  loadComponent: () => import('@haberes/feature-anotador').then(m => m.AnotadorComponent),
  canActivate: [authGuard]
};

const autorizarNovedadesRoute: Route = {
  path: 'designaciones/autorizar-novedades',
  loadComponent: () => import('@haberes/feature-designaciones').then(m => m.AutorizarNovedadesComponent),
  canActivate: [authGuard]
};

const asigCursosRoute: Route = {
  path: 'designaciones/asig-cursos',
  loadComponent: () => import('@haberes/feature-designaciones').then(m => m.AsigCursosComponent),
  canActivate: [authGuard]
};

const cargosClaseAsignacionRoute: Route = {
  path: 'designaciones/cargos-clase',
  loadComponent: () => import('@haberes/feature-designaciones').then(m => m.CargosClaseAsignacionComponent),
  canActivate: [authGuard]
};

const cargosClaseDuplicarRoute: Route = {
  path: 'designaciones/duplicar-cargos-clase',
  loadComponent: () => import('@haberes/feature-designaciones').then(m => m.CargosClaseDuplicarComponent),
  canActivate: [authGuard]
};

const fusionTodosRoute: Route = {
  path: 'designaciones/fusionar-todos',
  loadComponent: () => import('@haberes/feature-designaciones').then(m => m.FusionTodosComponent),
  canActivate: [authGuard]
};

const cursosConsultaRoute: Route = {
  path: 'designaciones/cursos',
  loadComponent: () => import('@haberes/feature-designaciones').then(m => m.CursosConsultaComponent),
  canActivate: [authGuard]
};

const opcionesRoutes: Routes = TODAS_LAS_OPCIONES
  .filter(opcion => !RUTAS_MIGRADAS.has(opcion.path))
  .map(opcion => ({
    path: opcion.path.startsWith('/') ? opcion.path.slice(1) : opcion.path,
    loadComponent: () => import('./placeholder-opcion.component').then(m => m.PlaceholderOpcionComponent),
    canActivate: [authGuard],
    data: {
      titulo: opcion.label,
      grupo: opcion.grupo,
      origenVb6: opcion.origenVb6,
      descripcion: opcion.descripcion
    }
  }));

export const appRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('@haberes/ui-auth').then(m => m.LoginComponent),
    canActivate: [unauthGuard],
    data: { requireFacultadId: false }
  },
  {
    path: 'inicio',
    loadComponent: () => import('./inicio.component').then(m => m.InicioComponent),
    canActivate: [authGuard]
  },
  bonoIndividualRoute,
  imputacionIndividualRoute,
  designacionesGeneralRoute,
  actualizarCargosClaseRoute,
  anotadorRoute,
  autorizarNovedadesRoute,
  asigCursosRoute,
  cargosClaseAsignacionRoute,
  cargosClaseDuplicarRoute,
  fusionTodosRoute,
  cursosConsultaRoute,
  ...opcionesRoutes,
  { path: '', redirectTo: 'inicio', pathMatch: 'full' },
  { path: '**', redirectTo: 'inicio' }
];
