/** Contrato REST de la pantalla de liquidación individual. */

export interface PersonaFicha {
  legajoId: number;
  documento: number | string | null;
  apellido: string;
  nombre: string;
  estado: number | null;
  liquida: string | null;
  dependenciaId: number | null;
  salida: string | null;
}

export interface ControlFicha {
  controlId: number;
  anho: number;
  mes: number;
  modoLiquidacionId: number | null;
}

export interface LiquidacionFicha {
  liquidacionId: number;
  bloqueado: number;
  estado: number | null;
  liquida: string | null;
  totalRemunerativo: number | null;
  totalNoRemunerativo: number | null;
  totalDeduccion: number | null;
  totalNeto: number | null;
  fechaLiquidacion: string | null;
  fechaAcreditacion: string | null;
}

export interface AntiguedadFicha {
  mesesDocentes: number | null;
  mesesAdministrativos: number | null;
  indiceDocente: number | null;
  indiceAdministrativo: number | null;
}

export interface CargoFicha {
  cargoLiquidacionId: number;
  dependenciaId: number | null;
  dependenciaAcronimo: string | null;
  fechaDesde: string | null;
  fechaHasta: string | null;
  categoriaNombre: string | null;
  categoriaBasico: number | null;
  estadoDocente: number | null;
  horasJornada: number | null;
  jornada: number;
  presentismo: number;
  situacion: string | null;
}

export interface CargoConClaseFicha {
  cargoClaseDetalleId: number;
  descripcion: string;
  facultadReducido: string | null;
  sedeNombre: string | null;
  periodoDesde: number | null;
  periodoHasta: number | null;
  horas: number;
  valorHora: number | null;
}

export interface NovedadFicha {
  novedadId: number;
  codigoId: number;
  codigoNombre: string | null;
  importe: number | null;
  value: string | null;
  observaciones: string | null;
}

export interface ItemFicha {
  itemId: number;
  codigoId: number;
  codigoNombre: string | null;
  importe: number | null;
}

export interface AccionesFicha {
  puedeGenerarCargos: boolean;
  puedeLiquidar: boolean;
  puedeEliminarLiquidacion: boolean;
  puedeEditarNovedades: boolean;
  bloqueado: boolean;
  motivoBloqueo: string | null;
}

export interface FichaLiquidacionIndividual {
  legajoId: number;
  anho: number;
  mes: number;
  persona: PersonaFicha | null;
  control: ControlFicha | null;
  liquidacion: LiquidacionFicha | null;
  antiguedad: AntiguedadFicha | null;
  cargosDocentes: CargoFicha[];
  cargosNoDocentes: CargoFicha[];
  cargosConClase: CargoConClaseFicha[];
  novedades: NovedadFicha[];
  items: ItemFicha[];
  acciones: AccionesFicha;
}

export interface ResultadoProcesoResponse {
  resultado: string;
  mensaje: string;
}

export interface ResumenGeneracionCargosResponse extends ResultadoProcesoResponse {
  docentes: number;
  noDocentes: number;
}

export interface NovedadRegistradaResponse extends ResultadoProcesoResponse {
  novedad: NovedadFicha | null;
}

export interface RegistroNovedadRequest {
  codigoId: number;
  importe: number | null;
  valor: string | null;
  observaciones: string | null;
  forzar: boolean;
}

export interface CodigoBusqueda {
  codigoId: number;
  nombre: string;
  docente: number | null;
  noDocente: number | null;
  search: string;
}

export const RESULTADOS_EXITOSOS = ['LIQUIDADO', 'ELIMINADA', 'GENERADOS', 'GUARDADA'] as const;
