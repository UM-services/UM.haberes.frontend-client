/** Contrato de `GET /api/haberes/report/ui/libroSueldos/data/{anho}/{mes}`. */
export interface LibroSueldosData {
  anho: number;
  mes: number;
  filas: FilaLibroSueldos[];
}

export interface FilaLibroSueldos {
  legajoId: string;
  apellidoNombre: string;
  cuil: string;
  dependencia: string;
  remunerativo: string;
  noRemunerativo: string;
  deducciones: string;
  neto: string;
}
