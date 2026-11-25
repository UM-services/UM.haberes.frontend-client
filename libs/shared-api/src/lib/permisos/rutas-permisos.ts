/**
 * Mapa ruta → permisos de Haberes. Es el espejo del mapa del backend
 * (`RutasPermisos`): el frontend lo usa para filtrar el menú y proteger rutas,
 * y el backend para el enforcement real.
 *
 * Una ruta puede declarar varias claves: alcanza con tener una (OR).
 * Las rutas más específicas se evalúan primero.
 */
export interface ReglaPermiso {
  prefijo: string;
  claves: string[];
}

const REGLAS: ReglaPermiso[] = [
  // --- Seguridad ---
  { prefijo: '/seguridad/permisos', claves: ['seguridad.permisos.administrar'] },
  { prefijo: '/seguridad/roles', claves: ['seguridad.roles.administrar'] },
  { prefijo: '/seguridad/catalogo', claves: ['seguridad.catalogo.administrar'] },
  { prefijo: '/seguridad/simulador', claves: ['seguridad.simulador.consultar'] },

  // --- Novedades ---
  { prefijo: '/asig-cursos', claves: ['novedades.asig_cursos.gestionar'] },
  { prefijo: '/docentes-sede', claves: ['novedades.docentes_sede.ver'] },
  { prefijo: '/cargos', claves: ['novedades.cargos.ver'] },
  { prefijo: '/anotador', claves: ['novedades.anotador.gestionar'] },
  { prefijo: '/designaciones', claves: ['novedades.designaciones.ver'] },

  // --- Liquidación ---
  { prefijo: '/liquidacion/asig-cargos', claves: ['liquidacion.asig_cargos.gestionar'] },
  { prefijo: '/liquidacion/etec/asig-cargos', claves: ['liquidacion.etec.asignaciones.gestionar'] },
  { prefijo: '/liquidacion/novedades', claves: ['liquidacion.novedades.gestionar'] },
  { prefijo: '/liquidacion/individual', claves: ['liquidacion.individual.procesar'] },
  { prefijo: '/liquidacion/general', claves: ['liquidacion.general.procesar'] },
  { prefijo: '/liquidacion/transferir-novedades', claves: ['liquidacion.transferir_novedades.procesar'] },
  { prefijo: '/liquidacion/planilla-no-docentes', claves: ['liquidacion.planilla_no_docentes.ver'] },
  { prefijo: '/liquidacion/afip-sicore', claves: ['liquidacion.afip_sicore.generar'] },
  { prefijo: '/liquidacion/sac', claves: ['liquidacion.sac.generar'] },
  { prefijo: '/liquidacion/sijp', claves: ['liquidacion.sijp.generar'] },
  { prefijo: '/liquidacion/libro-sueldos-digital', claves: ['liquidacion.libro_sueldos_digital.generar'] },

  // --- Designaciones ---
  { prefijo: '/designaciones/general', claves: ['designaciones.general.gestionar'] },
  { prefijo: '/designaciones/asig-cursos', claves: ['designaciones.asig_cursos.gestionar'] },
  { prefijo: '/designaciones/autorizar-novedades', claves: ['designaciones.autorizar_novedades.gestionar'] },
  { prefijo: '/designaciones/cargos-clase', claves: ['designaciones.cargos_clase.gestionar'] },
  { prefijo: '/designaciones/anotador', claves: ['designaciones.anotador.gestionar'] },
  { prefijo: '/designaciones/duplicar-cargos-clase', claves: ['designaciones.duplicar_cargos_clase.procesar'] },
  { prefijo: '/designaciones/actualizar-cargos-clase', claves: ['designaciones.actualizar_cargos_clase.procesar'] },
  { prefijo: '/designaciones/cursos', claves: ['designaciones.cursos.ver'] },
  { prefijo: '/designaciones/fusionar-todos', claves: ['designaciones.fusionar_todos.procesar'] },

  // --- Movimientos ---
  { prefijo: '/movimientos/santander-individual', claves: ['movimientos.santander_individual.generar'] },
  { prefijo: '/movimientos/otros-bancos-individual', claves: ['movimientos.otros_bancos_individual.generar'] },
  { prefijo: '/movimientos/santander', claves: ['movimientos.santander.generar'] },
  { prefijo: '/movimientos/otros-bancos', claves: ['movimientos.otros_bancos.generar'] },
  { prefijo: '/movimientos/excluidos', claves: ['movimientos.excluidos.gestionar'] },

  // --- Consultas ---
  { prefijo: '/consultas/bonos-dependencia', claves: ['consultas.bonos_dependencia.ver'] },
  { prefijo: '/consultas/bono-individual', claves: ['consultas.bono_individual.ver'] },
  { prefijo: '/consultas/comparacion-meses', claves: ['consultas.comparacion_meses.ver'] },
  { prefijo: '/consultas/totales-generales', claves: ['consultas.totales_generales.ver'] },
  { prefijo: '/consultas/totales-codigo', claves: ['consultas.totales_codigo.ver'] },
  { prefijo: '/consultas/detalle-codigo', claves: ['consultas.detalle_codigo.ver'] },
  { prefijo: '/consultas/libro-sueldos', claves: ['consultas.libro_sueldos.ver'] },
  { prefijo: '/consultas/docentes-sede', claves: ['consultas.docentes_sede.ver'] },
  { prefijo: '/consultas/designacion-docentes', claves: ['consultas.designacion_docentes.ver'] },
  { prefijo: '/consultas/cursos-docente', claves: ['consultas.cursos_docente.ver'] },
  { prefijo: '/consultas/cursos-contratado', claves: ['consultas.cursos_contratado.ver'] },
  { prefijo: '/consultas/fusion-docente', claves: ['consultas.fusion_docente.ver'] },
  { prefijo: '/consultas/planilla-liquidables', claves: ['consultas.planilla_liquidables.ver'] },
  { prefijo: '/consultas/cargos-periodo', claves: ['consultas.cargos_periodo.ver'] },
  { prefijo: '/consultas/cursos-periodo', claves: ['consultas.cursos_periodo.ver'] },
  { prefijo: '/consultas/basicos-periodo', claves: ['consultas.basicos_periodo.ver'] },
  { prefijo: '/consultas/cantidad-cargos', claves: ['consultas.cantidad_cargos.ver'] },
  { prefijo: '/consultas/historico-cargos', claves: ['consultas.historico_cargos.ver'] },
  { prefijo: '/consultas/cargos-clase-facultad', claves: ['consultas.cargos_clase_facultad.ver'] },

  // --- Contabilidad ---
  { prefijo: '/contabilidad/imputacion-individual', claves: ['contabilidad.imputacion_individual.generar'] },
  { prefijo: '/contabilidad/imputacion-masiva', claves: ['contabilidad.imputacion_masiva.generar'] },
  { prefijo: '/contabilidad/formulario-931', claves: ['contabilidad.formulario_931.ver'] },
  { prefijo: '/contabilidad/imputaciones-cargos-clase', claves: ['contabilidad.imputaciones_cargos_clase.ver'] },
  { prefijo: '/contabilidad/imputaciones-cargos', claves: ['contabilidad.imputaciones_cargos.ver'] },
  { prefijo: '/contabilidad/imputaciones-codigos', claves: ['contabilidad.imputaciones_codigos.ver'] },

  // --- Administrador ---
  { prefijo: '/personas', claves: ['administrador.personas.editar'] },
  { prefijo: '/categorias', claves: ['administrador.categorias.editar'] },
  { prefijo: '/codigos', claves: ['administrador.codigos.editar'] },
  { prefijo: '/clases', claves: ['administrador.clases.editar'] },
  { prefijo: '/cargos-clase', claves: ['administrador.cargos_clase.editar'] },
  { prefijo: '/adicionales', claves: ['administrador.adicionales.editar'] },
  { prefijo: '/control-periodo', claves: ['administrador.control_periodo.editar'] },
  { prefijo: '/limite-novedades', claves: ['administrador.limite_novedades.editar'] },
  { prefijo: '/sedes', claves: ['administrador.sedes.editar'] },
  { prefijo: '/usuarios', claves: ['administrador.usuarios.administrar'] },
];

const ORDENADAS = [...REGLAS].sort((a, b) => b.prefijo.length - a.prefijo.length);

/** Devuelve las claves que habilitan la URL, o null si la ruta es libre. */
export function permisoParaUrl(url: string): string[] | null {
  const limpia = url.split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';
  for (const regla of ORDENADAS) {
    if (limpia === regla.prefijo || limpia.startsWith(`${regla.prefijo}/`)) {
      return regla.claves;
    }
  }
  return null;
}

/** true si la URL no declara permiso o si alguna de sus claves está habilitada. */
export function rutaHabilitada(
  url: string,
  tienePermiso: (clave: string) => boolean,
): boolean {
  const claves = permisoParaUrl(url);
  if (!claves || claves.length === 0) return true;
  return claves.some((clave) => tienePermiso(clave));
}
