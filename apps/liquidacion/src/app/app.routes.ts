import { Route, Routes } from '@angular/router';
import { authGuard, unauthGuard } from '@haberes/shared-api';
import { TODAS_LAS_OPCIONES } from './menu-options.data';

// Opciones migradas a componentes reales: se excluyen de los placeholders generados
const RUTAS_MIGRADAS = new Set([
  '/consultas/bono-individual',
  '/contabilidad/imputacion-individual'
]);

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
  ...opcionesRoutes,
  { path: '', redirectTo: 'inicio', pathMatch: 'full' },
  { path: '**', redirectTo: 'inicio' }
];
