/** Contrato de `GET /api/haberes/report/ui/fusionDocente/data/{anho}/{mes}`. */
export interface FusionDocenteData {
  anho: number;
  mes: number;
  filas: FilaFusion[];
}

export interface FilaFusion {
  legajoId: string;
  apellidoNombre: string;
  facultad: string;
  sede: string;
  cargo: string;
  basico: string;
}
