/** Contrato de `GET /api/haberes/report/ui/cargosPeriodo/data/{anho}/{mes}`. */
export interface CargosPeriodoData {
  anho: number;
  mes: number;
  filas: FilaCargosPeriodo[];
}

export interface FilaCargosPeriodo {
  legajoId: string;
  apellidoNombre: string;
  periodo: string;
  dependenciaId: string;
  dependenciaNombre: string;
  categoriaId: string;
  categoriaNombre: string;
}
