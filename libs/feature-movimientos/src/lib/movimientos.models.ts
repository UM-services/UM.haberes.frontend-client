/** Contratos de la API de generación de archivos bancarios (haberes-core). */

export type Banco = 'santander' | 'otrosbancos';

export interface LegajoAcreditarRequest {
  legajoId: number;
  cbu: string;
  acreditado?: number | null;
}

export interface ArchivoAcreditacionRequest {
  anho: number;
  mes: number;
  /** ISO yyyy-MM-dd (sin hora): evita corrimientos por zona horaria. */
  fechaPago: string;
  numEnvio?: number;
  /** "A" administrativos, "D" docentes, "T" todos. */
  salida?: string;
  dependenciaId?: number;
  /** Mayor a cero: universo por novedades del código. */
  codigoId?: number;
  cci?: boolean;
  individual?: boolean;
  legajos?: LegajoAcreditarRequest[];
}

export interface RechazoAcreditacion {
  legajoId: number;
  apellidoNombre: string;
  motivo: string;
  importe?: number | null;
  subtotal?: number | null;
}

export interface ArchivoAcreditacionResponse {
  nombreArchivo: string;
  /** Contenido del archivo en Base64 (650 caracteres por línea, CRLF, ANSI). */
  contenido: string;
  cantidad: number;
  total: number;
  periodoAcreditado: boolean;
  rechazos: RechazoAcreditacion[];
  advertencias: string[];
}

export interface FilaAcreditacion {
  legajoBancoId: number;
  legajoId: number;
  cbu: string;
  fijo?: number | null;
  porcentaje?: number | null;
  resto?: number | null;
  acreditado?: number | null;
  apellidoNombre: string;
  cuil?: string | null;
}

export interface PreparacionAcreditacion {
  anho: number;
  mes: number;
  totalAcreditado: number;
  filas: FilaAcreditacion[];
  sinCbu: number[];
  sinLiquidacion: number[];
}

export interface Excluido {
  excluidoId?: number;
  legajoId: number;
  anho: number;
  mes: number;
  fecha?: string | null;
  observaciones?: string;
}

export interface ExcluidosReporte {
  anho: number;
  mes: number;
  filas: {
    legajoId: string;
    apellidoNombre: string;
    importe: string;
    observaciones: string;
    fecha: string;
  }[];
}

export interface Dependencia {
  dependenciaId: number;
  nombre: string;
}

export interface Codigo {
  codigoId: number;
  nombre: string;
}
