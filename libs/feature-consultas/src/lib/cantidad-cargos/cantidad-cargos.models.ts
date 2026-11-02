/** Contrato de `GET /api/haberes/report/ui/cantidadCargos/data/{anho}/{mes}`. */
export interface CantidadCargosData {
  anho: number;
  mes: number;
  filas: FilaCantidadCargos[];
}

export interface FilaCantidadCargos {
  facultad: string;
  sede: string;
  legajoId: string;
  apellidoNombre: string;
  anuales: number;
  semestre1: number;
  semestre2: number;
  bruto: string;
}
