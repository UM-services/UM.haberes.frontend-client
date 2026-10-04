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

export interface Contacto {
  legajoId: number;
  fijo?: string;
  movil?: string;
  mailPersonal?: string;
  mailInstitucional?: string;
}
