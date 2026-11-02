/** Contrato de `GET /api/haberes/report/ui/cursosPeriodo/data/{anho}/{mes}`. */
export interface CursosPeriodoData {
  anho: number;
  mes: number;
  filas: FilaCursosPeriodo[];
}

export interface FilaCursosPeriodo {
  legajoId: string;
  apellidoNombre: string;
  periodo: string;
  facultad: string;
  sede: string;
  curso: string;
  cargo: string;
  horas: string;
  dictado: string;
}
