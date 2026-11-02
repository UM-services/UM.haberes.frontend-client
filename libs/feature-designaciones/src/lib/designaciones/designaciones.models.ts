/**
 * Modelos del control de designaciones de un docente.
 *
 * Reflejan la forma real de las respuestas de haberes-core: los endpoints de
 * curso_cargo / curso_fusion devuelven las claves foráneas (facultadId,
 * geograficaId, categoriaId, ...) sin el objeto anidado, por eso la pantalla
 * resuelve los nombres con los catálogos (`CatalogosDesignaciones`).
 */

export interface Facultad {
  facultadId: number;
  nombre: string;
  reducido?: string;
}

export interface Geografica {
  geograficaId: number;
  nombre: string;
  reducido?: string;
}

export interface Dependencia {
  dependenciaId: number;
  nombre: string;
  facultadId: number;
  geograficaId: number;
}

export interface Categoria {
  categoriaId: number;
  nombre: string;
  basico: number;
}

export interface CargoTipo {
  cargoTipoId: number;
  nombre: string;
}

export interface DesignacionTipo {
  designacionTipoId: number;
  nombre: string;
}

export interface Curso {
  cursoId: number;
  nombre: string;
  facultadId: number;
  geograficaId: number;
  anual: number;
  semestre1: number;
  semestre2: number;
}

export interface CursoCargo {
  cursoCargoId: number;
  cursoId: number;
  anho: number;
  mes: number;
  cargoTipoId: number;
  legajoId: number;
  horasSemanales: number;
  designacionTipoId: number;
  categoriaId: number;
  desarraigo: number;
  curso?: Curso | null;
  categoria?: Categoria | null;
}

export interface CursoFusion {
  cursoFusionId: number;
  legajoId: number;
  anho: number;
  mes: number;
  facultadId: number;
  geograficaId: number;
  cargoTipoId: number;
  designacionTipoId: number;
  anual: number;
  categoriaId: number;
}

export interface CargoLiquidacion {
  cargoLiquidacionId: number;
  legajoId: number;
  anho: number;
  mes: number;
  dependenciaId: number;
  categoriaId: number;
  categoriaNombre?: string | null;
  categoriaBasico?: number | null;
  dependencia?: Dependencia | null;
  categoria?: Categoria | null;
}

export interface Novedad {
  novedadId: number;
  legajoId: number;
  anho: number;
  mes: number;
  codigoId: number;
  importe: number | null;
}

/** Catálogos necesarios para mostrar nombres en lugar de ids. */
export interface CatalogosDesignaciones {
  facultades: Map<number, Facultad>;
  geograficas: Map<number, Geografica>;
  dependencias: Map<number, Dependencia>;
  categorias: Map<number, Categoria>;
  cargoTipos: Map<number, CargoTipo>;
  designacionTipos: Map<number, DesignacionTipo>;
}

/** Filas ya resueltas para la tabla de designaciones liquidadas. */
export interface DesignacionLiquidadaVm {
  facultad: string;
  sede: string;
  designacion: string;
  importe: number;
}

/** Filas ya resueltas para la tabla de cursos asignados. */
export interface CursoAsignadoVm {
  facultad: string;
  sede: string;
  curso: string;
  horas: number | null;
  cargo: string;
  designacion: string;
  importe: number;
  desarraigo: boolean;
  anual: boolean;
  semestre1: boolean;
  semestre2: boolean;
}

/** Filas ya resueltas para la tabla de designaciones fusionadas. */
export interface DesignacionFusionadaVm {
  facultad: string;
  sede: string;
  cargo: string;
  designacion: string;
  categoria: string;
  importe: number;
}
