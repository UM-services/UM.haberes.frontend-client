import { Route } from '@angular/router';
import {
  SIN_ACCESO_RUTA,
  administradorGuard,
  authGuard,
  confirmarSalida,
  permisoGuard,
  permisoRutaGuard,
  unauthGuard,
} from '@haberes/shared-api';
import { NoAccesoComponent } from '@haberes/ui-layout';

export const appRoutes: Route[] = [
  {
    path: 'login',
    loadComponent: () => import('@haberes/ui-auth').then((m) => m.LoginComponent),
    canActivate: [unauthGuard],
    // false = el módulo es global: rechaza usuarios con facultad asignada.
    // requireAdministrador = además exige usuario.administrador == 1 (regla aditiva).
    data: { requireFacultadId: false, requireAdministrador: true },
  },
  {
    // Ruta pública de las guards: explica la denegación sin cerrar la sesión.
    path: SIN_ACCESO_RUTA,
    component: NoAccesoComponent,
  },
  {
    path: 'personas',
    loadComponent: () => import('@haberes/feature-personas').then((m) => m.PersonasComponent),
    canActivate: [authGuard, administradorGuard, permisoRutaGuard],
  },
  {
    path: 'categorias',
    loadComponent: () => import('@haberes/feature-categorias').then((m) => m.CategoriasComponent),
    canActivate: [authGuard, administradorGuard, permisoRutaGuard],
  },
  {
    path: 'codigos',
    loadComponent: () => import('@haberes/feature-codigos').then((m) => m.CodigosComponent),
    canActivate: [authGuard, administradorGuard, permisoRutaGuard],
  },
  {
    path: 'clases',
    loadComponent: () => import('@haberes/feature-clases').then((m) => m.ClasesComponent),
    canActivate: [authGuard, administradorGuard, permisoRutaGuard],
  },
  {
    path: 'cargos-clase',
    loadComponent: () =>
      import('@haberes/feature-cargos-clase').then((m) => m.CargosClaseComponent),
    canActivate: [authGuard, administradorGuard, permisoRutaGuard],
  },
  {
    path: 'adicionales',
    loadComponent: () => import('@haberes/feature-adicionales').then((m) => m.AdicionalesComponent),
    canActivate: [authGuard, administradorGuard, permisoRutaGuard],
  },
  {
    path: 'control-periodo',
    loadComponent: () =>
      import('@haberes/feature-control-periodo').then((m) => m.ControlPeriodoComponent),
    canActivate: [authGuard, administradorGuard, permisoRutaGuard],
    canDeactivate: [confirmarSalida('Hay cambios sin guardar en este período. ¿Salir igual?')],
  },
  {
    path: 'limite-novedades',
    loadComponent: () =>
      import('@haberes/feature-limite-novedades').then((m) => m.LimiteNovedadesComponent),
    canActivate: [authGuard, administradorGuard, permisoRutaGuard],
  },
  {
    path: 'sedes',
    loadComponent: () => import('@haberes/feature-sedes').then((m) => m.SedesComponent),
    canActivate: [authGuard, administradorGuard, permisoRutaGuard],
  },
  {
    path: 'usuarios',
    loadComponent: () => import('@haberes/feature-usuarios').then((m) => m.UsuariosComponent),
    canActivate: [authGuard, administradorGuard, permisoRutaGuard],
  },
  {
    path: 'seguridad/permisos',
    loadComponent: () => import('@haberes/feature-seguridad').then((m) => m.PermisosComponent),
    canActivate: [authGuard, administradorGuard, permisoGuard('seguridad.permisos.administrar')],
  },
  {
    path: 'seguridad/roles',
    loadComponent: () => import('@haberes/feature-seguridad').then((m) => m.RolesComponent),
    canActivate: [authGuard, administradorGuard, permisoGuard('seguridad.roles.administrar')],
  },
  {
    path: 'seguridad/catalogo',
    loadComponent: () => import('@haberes/feature-seguridad').then((m) => m.CatalogoComponent),
    canActivate: [authGuard, administradorGuard, permisoGuard('seguridad.catalogo.administrar')],
  },
  {
    path: 'seguridad/simulador',
    loadComponent: () => import('@haberes/feature-seguridad').then((m) => m.SimuladorComponent),
    canActivate: [authGuard, administradorGuard, permisoGuard('seguridad.simulador.consultar')],
  },
  {
    path: 'inicio',
    loadComponent: () => import('./inicio.component').then((m) => m.InicioComponent),
    canActivate: [authGuard, administradorGuard, permisoRutaGuard],
  },
  { path: '', redirectTo: 'inicio', pathMatch: 'full' },
  { path: '**', redirectTo: 'inicio' },
];
