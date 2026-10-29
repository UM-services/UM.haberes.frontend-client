/** Contrato de `GET /api/haberes/report/ui/basicosPeriodo/data/{anho}/{mes}`. */
export interface BasicosPeriodoData {
  anho: number;
  mes: number;
  filas: FilaBasicosPeriodo[];
}

export interface FilaBasicosPeriodo {
  legajoId: string;
  apellidoNombre: string;
  dependencia: string;
  claseCodigo: string;
  categoriaCargo: string;
  basico: string;
  horasJornada: string;
  jornada: string;
}
