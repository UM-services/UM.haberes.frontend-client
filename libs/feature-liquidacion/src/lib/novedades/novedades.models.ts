import { Persona } from '@haberes/shared-api';

/** Contrato REST de la pantalla de novedades por código y período. */

export interface CodigoResumen {
  codigoId: number;
  nombre: string;
  transferible?: number | null;
}

export interface DependenciaResumen {
  dependenciaId: number;
  nombre?: string | null;
  acronimo?: string | null;
}

/** Fila de `novedad` del período, tal como la devuelve haberes-core. */
export interface Novedad {
  novedadId: number;
  legajoId: number;
  anho: number;
  mes: number;
  codigoId: number;
  dependenciaId: number | null;
  importe: number | null;
  value: string | null;
  observaciones: string | null;
  importado: number | null;
  novedadUploadId: number | null;
  persona?: Persona | null;
  codigo?: CodigoResumen | null;
  dependencia?: DependenciaResumen | null;
}

/** Fila del staging de importación (`novedad_upload` con `pendiente = 1`). */
export interface NovedadPendiente {
  novedadUploadId: number;
  legajoId: number;
  anho: number;
  mes: number;
  codigoId: number;
  dependenciaId: number | null;
  importe: number | null;
  value: string | null;
  pendiente: number;
  persona?: Persona | null;
  codigo?: CodigoResumen | null;
  dependencia?: DependenciaResumen | null;
}

/**
 * Request de `POST /novedad/` y `PUT /novedad/{novedadId}`.
 *
 * El backend hace reemplazo total en el `PUT`, así que `importado` y `novedadUploadId` se
 * reenvían con el valor del registro leído para no pisarlos.
 */
export interface NovedadRequest {
  legajoId: number;
  anho: number;
  mes: number;
  codigoId: number;
  dependenciaId: number | null;
  importe: number;
  value: string;
  observaciones: string;
  importado: number;
  novedadUploadId: number | null;
}

/** Estado del período según `acreditacion`. `acreditado = 1` cierra las novedades. */
export interface AcreditacionPeriodo {
  acreditacionId: number;
  anho: number;
  mes: number;
  acreditado: number;
  limiteNovedades: string | null;
  fechaContable?: string | null;
  ordenContable?: number | null;
}

/** Planilla que se envía a `POST /novedadfile/upload/{anho}/{mes}/{stepByStep}`. */
export interface ArchivoNovedades {
  filename: string;
  base64: string;
}
