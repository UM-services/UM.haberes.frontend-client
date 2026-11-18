/** Contrato REST de la pantalla de liquidación general. */

export interface AccionesLiquidacionGeneral {
  hayControl: boolean;
  puedeGenerarCargos: boolean;
  puedeLiquidar: boolean;
  puedeEliminar: boolean;
}

export interface ResumenLiquidacionGeneral {
  total: number;
  docentes: number;
  noDocentes: number;
  conNovedades: number;
  liquidados: number;
  bloqueados: number;
  netoNegativo: number;
  netoCero: number;
  totalNeto: number | null;
}

export interface FilaLiquidacionGeneral {
  orden: number;
  legajoId: number;
  apellido: string | null;
  nombre: string | null;
  estado: number | null;
  liquida: string | null;
  dependenciaId: number | null;
  salida: string | null;
  esDocente: boolean;
  esNoDocente: boolean;
  tieneNovedades: boolean;
  liquidado: boolean;
  bloqueado: boolean;
  totalRemunerativo: number | null;
  totalNoRemunerativo: number | null;
  totalDeduccion: number | null;
  totalNeto: number | null;
}

export interface PadronLiquidacionGeneral {
  anho: number;
  mes: number;
  acciones: AccionesLiquidacionGeneral;
  resumen: ResumenLiquidacionGeneral;
  filas: FilaLiquidacionGeneral[];
}

export type TipoProcesoGeneral = 'CARGOS' | 'LIQUIDAR' | 'ELIMINAR';
export type EstadoProcesoGeneral = 'EN_CURSO' | 'COMPLETADO' | 'FALLIDO';
export type EstadoLegajoGeneral = 'LIQUIDADO' | 'ELIMINADO' | 'GENERADO' | 'OMITIDO' | 'FALLIDO';

export interface ProcesoGeneral {
  procesoId: string;
  tipo: TipoProcesoGeneral;
  anho: number;
  mes: number;
  estado: EstadoProcesoGeneral;
  total: number;
  procesados: number;
  progreso: number;
  exitosos: number;
  omitidos: number;
  fallidos: number;
  forzar: boolean;
  iniciadoPor: number | null;
  iniciadoEn: string | null;
  finalizadoEn: string | null;
  mensaje: string | null;
}

export interface InicioProcesoGeneralResponse {
  iniciado: boolean;
  proceso: ProcesoGeneral | null;
  motivo: string | null;
  mensaje: string | null;
}

export interface ResultadoLegajoGeneral {
  detalleId: number;
  legajoId: number;
  apellido: string | null;
  nombre: string | null;
  resultado: EstadoLegajoGeneral;
  motivo: string | null;
  detalle: string | null;
  totalNeto: number | null;
  registradoEn: string | null;
}
