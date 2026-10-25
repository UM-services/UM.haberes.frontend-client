/** Contrato de `GET /api/haberes/report/ui/comparacionCodigos/data/{anho}/{mes}`. */
export interface ComparacionCodigosData {
  anho: number;
  mes: number;
  filas: FilaComparacionCodigos[];
}

export interface FilaComparacionCodigos {
  codigoId: number;
  nombre: string;
  novedades: string;
  liquidado: string;
  diferencia: string;
}
