/** Contrato de `GET /api/haberes/report/ui/liquidables/data`. */
export interface LiquidablesData {
  filas: FilaLiquidables[];
}

export interface FilaLiquidables {
  legajoId: string;
  apellidoNombre: string;
  estado: string;
  dependenciaId: string;
  dependenciaNombre: string;
}
