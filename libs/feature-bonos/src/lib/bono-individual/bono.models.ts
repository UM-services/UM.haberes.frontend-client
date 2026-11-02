export type FaltanteBono =
  | 'DEPENDENCIA'
  | 'LIQUIDACION'
  | 'ITEM'
  | 'ACTIVIDAD'
  | 'LEGAJO_CONTROL';

export interface IntegridadBonoResponse {
  legajoId: number;
  anho: number;
  mes: number;
  ok: boolean;
  faltantes: FaltanteBono[];
}

export interface ActividadResponse {
  actividadId: number;
  legajoId: number;
  anho: number;
  mes: number;
  docente: number;
  otras: number;
  clases: number;
  dependenciaId: number | null;
}

export interface BonoImpresionResponse {
  bonoImpresionId: number;
  legajoId: number;
  anho: number;
  mes: number;
  legajoIdSolicitud: number | null;
  fecha: string;
  ipAddress: string;
}

export interface AuditoriaBonoRequest {
  legajoIdSolicitud?: number;
}

export interface SendBonoRequest {
  mailInstitucional: string;
  legajoIdSolicitud?: number;
}

/** Resumen de `POST /api/haberes/core/bono/dependencia/{dep}/{a}/{m}/{salida}/print-prepare`. */
export interface BonoDependenciaPrepareResponse {
  dependenciaId: number;
  anho: number;
  mes: number;
  salida: string;
  total: number;
  preparados: number;
  fallidos: { legajoId: number; motivo: string }[];
}

export interface Contacto {
  legajoId: number;
  fijo?: string;
  movil?: string;
  mailPersonal?: string;
  mailInstitucional?: string;
}
