import { Persona } from '@haberes/shared-api';

import { NovedadCurso } from '../autorizar-novedades/autorizar-novedades.models';

/** Facultad embebida en la anotación (sólo lo necesario para mostrar). */
export interface FacultadResumen {
  facultadId: number;
  nombre: string;
  reducido?: string;
}

/**
 * Anotación enviada por una facultad. El backend devuelve la entidad completa
 * con `persona` y `facultad` embebidas.
 */
export interface AnotacionFacultad {
  anotadorId: number;
  legajoId: number;
  anho: number;
  mes: number;
  facultadId: number | null;
  anotacion: string | null;
  visado: number;
  ipVisado: string | null;
  user: string | null;
  respuesta: string | null;
  autorizado: number;
  rechazado: number;
  rectorado: number;
  transferido: number;
  persona?: Persona | null;
  facultad?: FacultadResumen | null;
}

/**
 * Novedad de cargo pendiente del período. `transferido` viene en la entidad
 * del backend y no forma parte del modelo de la pantalla de autorización.
 */
export interface CargoNovedad extends NovedadCurso {
  transferido: number;
}

/** Estado de acreditación del período (404 = todavía no hay registro). */
export interface AcreditacionPeriodo {
  anho: number;
  mes: number;
  acreditado: number;
  limiteNovedades: number | null;
}

export type ProcesoTransferencia = 'anotador' | 'cargos';

export interface FilaTransferenciaError {
  legajoId: number;
  referencia: string;
  mensaje: string;
}

export interface ResumenTransferencia {
  total: number;
  exitosos: number;
  salteados: number;
  errores: FilaTransferenciaError[];
}

export interface ProgresoTransferencia {
  procesados: number;
  total: number;
}
