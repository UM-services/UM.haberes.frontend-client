/**
 * Novedad de curso enviada por una facultad (alta, baja o cambio de un cargo
 * docente). El backend devuelve la entidad completa, con curso, cargo tipo y
 * persona embebidos, así que la pantalla no necesita catálogos.
 */
export interface NovedadCurso {
  cursoCargoNovedadId: number;
  cursoId: number;
  anho: number;
  mes: number;
  cargoTipoId: number;
  legajoId: number;
  horasSemanales: number | null;
  horasTotales: number | null;
  desarraigo: number;
  alta: number;
  baja: number;
  cambio: number;
  solicitud: string | null;
  autorizado: number;
  rechazado: number;
  respuesta: string | null;
  curso?: NovedadCurso_Curso | null;
  cargoTipo?: NovedadCurso_CargoTipo | null;
  persona?: NovedadCurso_Persona | null;
}

export interface NovedadCurso_Curso {
  cursoId: number;
  nombre: string;
  facultadId: number;
  geograficaId: number;
  facultad?: { facultadId: number; nombre: string; reducido?: string } | null;
  geografica?: { geograficaId: number; nombre: string; reducido?: string } | null;
}

export interface NovedadCurso_CargoTipo {
  cargoTipoId: number;
  nombre: string;
}

export interface NovedadCurso_Persona {
  legajoId: number;
  apellido: string;
  nombre: string;
  apellidoNombre?: string;
}

export type TipoNovedad = 'alta' | 'baja';
export type EstadoNovedad = 'pendiente' | 'autorizada' | 'rechazada';

/** Los seis padrones que el sistema legado mostraba en paralelo. */
export interface PadronesNovedades {
  pendienteAlta: NovedadCurso[];
  pendienteBaja: NovedadCurso[];
  autorizadaAlta: NovedadCurso[];
  autorizadaBaja: NovedadCurso[];
  rechazadaAlta: NovedadCurso[];
  rechazadaBaja: NovedadCurso[];
}

export function padronVacio(): PadronesNovedades {
  return {
    pendienteAlta: [],
    pendienteBaja: [],
    autorizadaAlta: [],
    autorizadaBaja: [],
    rechazadaAlta: [],
    rechazadaBaja: []
  };
}

/** Fila ya resuelta para la tabla. */
export interface NovedadCursoVm {
  novedad: NovedadCurso;
  legajo: number;
  docente: string;
  facultad: string;
  sede: string;
  curso: string;
  cargo: string;
  horas: number | null;
  desarraigo: boolean;
  solicitud: string;
  respuesta: string;
}
