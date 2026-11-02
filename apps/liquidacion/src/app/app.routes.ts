import { Route, Routes } from '@angular/router';
import { authGuard, moduloGuard, unauthGuard } from '@haberes/shared-api';
import { RUTAS_MIGRADAS, TODAS_LAS_OPCIONES } from './menu-options.data';

/** Liquidación es un módulo global: sólo entra un usuario sin facultad asignada. */
const DATOS_MODULO = { requireFacultadId: false } as const;

const bonoIndividualRoute: Route = {
  path: 'consultas/bono-individual',
  loadComponent: () => import('@haberes/feature-bonos').then(m => m.BonoIndividualComponent),
  canActivate: [authGuard, moduloGuard],
  data: DATOS_MODULO
};

const totalesGeneralesRoute: Route = {
  path: 'consultas/totales-generales',
  loadComponent: () => import('@haberes/feature-consultas').then(m => m.TotalesGeneralesComponent),
  canActivate: [authGuard, moduloGuard],
  data: DATOS_MODULO
};

const totalesCodigoRoute: Route = {
  path: 'consultas/totales-codigo',
  loadComponent: () => import('@haberes/feature-consultas').then(m => m.TotalesCodigoComponent),
  canActivate: [authGuard, moduloGuard],
  data: DATOS_MODULO
};

const comparacionMesesRoute: Route = {
  path: 'consultas/comparacion-meses',
  loadComponent: () => import('@haberes/feature-consultas').then(m => m.ComparacionMesesComponent),
  canActivate: [authGuard, moduloGuard],
  data: DATOS_MODULO
};

const docentesSedeRoute: Route = {
  path: 'consultas/docentes-sede',
  loadComponent: () => import('@haberes/feature-consultas').then(m => m.DocentesSedeComponent),
  canActivate: [authGuard, moduloGuard],
  data: DATOS_MODULO
};

const designacionDocentesRoute: Route = {
  path: 'consultas/designacion-docentes',
  loadComponent: () => import('@haberes/feature-consultas').then(m => m.DesignacionDocentesComponent),
  canActivate: [authGuard, moduloGuard],
  data: DATOS_MODULO
};

const cursosDocenteRoute: Route = {
  path: 'consultas/cursos-docente',
  loadComponent: () => import('@haberes/feature-consultas').then(m => m.CursosDocenteComponent),
  canActivate: [authGuard, moduloGuard],
  data: DATOS_MODULO
};

const fusionDocenteRoute: Route = {
  path: 'consultas/fusion-docente',
  loadComponent: () => import('@haberes/feature-consultas').then(m => m.FusionDocenteComponent),
  canActivate: [authGuard, moduloGuard],
  data: DATOS_MODULO
};

const cargosClaseFacultadRoute: Route = {
  path: 'consultas/cargos-clase-facultad',
  loadComponent: () => import('@haberes/feature-consultas').then(m => m.CargosClaseFacultadComponent),
  canActivate: [authGuard, moduloGuard],
  data: DATOS_MODULO
};

const liquidablesRoute: Route = {
  path: 'consultas/planilla-liquidables',
  loadComponent: () => import('@haberes/feature-consultas').then(m => m.LiquidablesComponent),
  canActivate: [authGuard, moduloGuard],
  data: DATOS_MODULO
};

const cantidadCargosRoute: Route = {
  path: 'consultas/cantidad-cargos',
  loadComponent: () => import('@haberes/feature-consultas').then(m => m.CantidadCargosComponent),
  canActivate: [authGuard, moduloGuard],
  data: DATOS_MODULO
};

const detalleCodigoRoute: Route = {
  path: 'consultas/detalle-codigo',
  loadComponent: () => import('@haberes/feature-consultas').then(m => m.DetalleCodigoComponent),
  canActivate: [authGuard, moduloGuard],
  data: DATOS_MODULO
};

const cargosPeriodoRoute: Route = {
  path: 'consultas/cargos-periodo',
  loadComponent: () => import('@haberes/feature-consultas').then(m => m.CargosPeriodoComponent),
  canActivate: [authGuard, moduloGuard],
  data: DATOS_MODULO
};

const cursosPeriodoRoute: Route = {
  path: 'consultas/cursos-periodo',
  loadComponent: () => import('@haberes/feature-consultas').then(m => m.CursosPeriodoComponent),
  canActivate: [authGuard, moduloGuard],
  data: DATOS_MODULO
};

const libroSueldosRoute: Route = {
  path: 'consultas/libro-sueldos',
  loadComponent: () => import('@haberes/feature-consultas').then(m => m.LibroSueldosComponent),
  canActivate: [authGuard, moduloGuard],
  data: DATOS_MODULO
};

const basicosPeriodoRoute: Route = {
  path: 'consultas/basicos-periodo',
  loadComponent: () => import('@haberes/feature-consultas').then(m => m.BasicosPeriodoComponent),
  canActivate: [authGuard, moduloGuard],
  data: DATOS_MODULO
};

const cursosContratadoRoute: Route = {
  path: 'consultas/cursos-contratado',
  loadComponent: () => import('@haberes/feature-consultas').then(m => m.CursosContratadoComponent),
  canActivate: [authGuard, moduloGuard],
  data: DATOS_MODULO
};

const historicoCargosRoute: Route = {
  path: 'consultas/historico-cargos',
  loadComponent: () => import('@haberes/feature-consultas').then(m => m.HistoricoCargosComponent),
  canActivate: [authGuard, moduloGuard],
  data: DATOS_MODULO
};

const bonosDependenciaRoute: Route = {
  path: 'consultas/bonos-dependencia',
  loadComponent: () => import('@haberes/feature-consultas').then(m => m.BonosDependenciaComponent),
  canActivate: [authGuard, moduloGuard],
  data: DATOS_MODULO
};

const imputacionIndividualRoute: Route = {
  path: 'contabilidad/imputacion-individual',
  loadComponent: () => import('@haberes/feature-contabilidad').then(m => m.ImputacionIndividualComponent),
  canActivate: [authGuard, moduloGuard],
  data: DATOS_MODULO
};

const designacionesGeneralRoute: Route = {
  path: 'designaciones/general',
  loadComponent: () => import('@haberes/feature-designaciones').then(m => m.DesignacionesComponent),
  canActivate: [authGuard, moduloGuard],
  data: DATOS_MODULO
};

const actualizarCargosClaseRoute: Route = {
  path: 'designaciones/actualizar-cargos-clase',
  loadComponent: () => import('@haberes/feature-designaciones').then(m => m.CargosClaseActualizarComponent),
  canActivate: [authGuard, moduloGuard],
  data: DATOS_MODULO
};

const anotadorRoute: Route = {
  path: 'designaciones/anotador',
  loadComponent: () => import('@haberes/feature-anotador').then(m => m.AnotadorComponent),
  canActivate: [authGuard, moduloGuard],
  data: DATOS_MODULO
};

const autorizarNovedadesRoute: Route = {
  path: 'designaciones/autorizar-novedades',
  loadComponent: () => import('@haberes/feature-designaciones').then(m => m.AutorizarNovedadesComponent),
  canActivate: [authGuard, moduloGuard],
  data: DATOS_MODULO
};

const asigCursosRoute: Route = {
  path: 'designaciones/asig-cursos',
  loadComponent: () => import('@haberes/feature-designaciones').then(m => m.AsigCursosComponent),
  canActivate: [authGuard, moduloGuard],
  data: DATOS_MODULO
};

const cargosClaseAsignacionRoute: Route = {
  path: 'designaciones/cargos-clase',
  loadComponent: () => import('@haberes/feature-designaciones').then(m => m.CargosClaseAsignacionComponent),
  canActivate: [authGuard, moduloGuard],
  data: DATOS_MODULO
};

const cargosClaseDuplicarRoute: Route = {
  path: 'designaciones/duplicar-cargos-clase',
  loadComponent: () => import('@haberes/feature-designaciones').then(m => m.CargosClaseDuplicarComponent),
  canActivate: [authGuard, moduloGuard],
  data: DATOS_MODULO
};

const fusionTodosRoute: Route = {
  path: 'designaciones/fusionar-todos',
  loadComponent: () => import('@haberes/feature-designaciones').then(m => m.FusionTodosComponent),
  canActivate: [authGuard, moduloGuard],
  data: DATOS_MODULO
};

const cursosConsultaRoute: Route = {
  path: 'designaciones/cursos',
  loadComponent: () => import('@haberes/feature-designaciones').then(m => m.CursosConsultaComponent),
  canActivate: [authGuard, moduloGuard],
  data: DATOS_MODULO
};

const opcionesRoutes: Routes = TODAS_LAS_OPCIONES
  .filter(opcion => !RUTAS_MIGRADAS.has(opcion.path))
  .map(opcion => ({
    path: opcion.path.startsWith('/') ? opcion.path.slice(1) : opcion.path,
    loadComponent: () => import('./placeholder-opcion.component').then(m => m.PlaceholderOpcionComponent),
    canActivate: [authGuard, moduloGuard],
    data: {
      ...DATOS_MODULO,
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
    data: DATOS_MODULO
  },
  {
    path: 'inicio',
    loadComponent: () => import('./inicio.component').then(m => m.InicioComponent),
    canActivate: [authGuard, moduloGuard],
    data: DATOS_MODULO
  },
  bonoIndividualRoute,
  totalesGeneralesRoute,
  totalesCodigoRoute,
  comparacionMesesRoute,
  docentesSedeRoute,
  designacionDocentesRoute,
  cursosDocenteRoute,
  fusionDocenteRoute,
  cargosClaseFacultadRoute,
  liquidablesRoute,
  cantidadCargosRoute,
  detalleCodigoRoute,
  cargosPeriodoRoute,
  cursosPeriodoRoute,
  libroSueldosRoute,
  basicosPeriodoRoute,
  cursosContratadoRoute,
  historicoCargosRoute,
  bonosDependenciaRoute,
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
