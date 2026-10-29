/** Contrato de `GET /api/haberes/report/ui/totalesCodigo/data/{anho}/{mes}`. */
export interface TotalesCodigoData {
  anho: number;
  mes: number;
  filas: FilaTotalesCodigo[];
}

export interface FilaTotalesCodigo {
  codigoId: number;
  nombre: string;
  novedades: string;
  liquidado: string;
  diferencia: string;
}
