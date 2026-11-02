/** Contrato de `GET /api/haberes/report/ui/detalleCodigo/data/{codigoId}/{anho}/{mes}`. */
export interface DetalleCodigoData {
  codigoId: string;
  codigoNombre: string;
  filas: FilaDetalleCodigo[];
}

export interface FilaDetalleCodigo {
  legajoId: string;
  apellidoNombre: string;
  liquidado: string;
  novedad: string;
  cantidad: string;
}
