/** Contrato de `GET /api/haberes/report/ui/cargosClasePeriodo/data/{facultadId}/{anho}/{mes}`. */
export interface CargosClasePeriodoData {
  anho: number;
  mes: number;
  facultad: string;
  sedes: SedeCargosClase[];
}

export interface SedeCargosClase {
  nombre: string;
  filas: FilaCargoClase[];
}

export interface FilaCargoClase {
  legajoId: number;
  apellidoNombre: string;
  cargo: string;
  descripcion: string;
  periodoDesde: number | null;
  periodoHasta: number | null;
  horas: number | null;
  clase: string;
}
