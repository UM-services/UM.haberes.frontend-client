/** Contrato de `GET /api/haberes/report/ui/totalesGenerales/data/{anho}/{mes}`. */
export interface TotalesGeneralesData {
  anho: number;
  mes: number;
  grupos: GrupoTotales[];
}

export interface GrupoTotales {
  nombre: string;
  filas: FilaTotales[];
  subtotal: string;
}

export interface FilaTotales {
  codigoId: string;
  nombre: string;
  total: string;
}
