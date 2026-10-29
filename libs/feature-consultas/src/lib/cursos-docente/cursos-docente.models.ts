/** Contrato de `GET /api/haberes/report/ui/cursoDocente/data/{anho}/{mes}`. */
export interface CursosDocenteData {
  anho: number;
  mes: number;
  docentes: DocenteCursos[];
}

export interface DocenteCursos {
  legajoId: number;
  apellidoNombre: string;
  filas: FilaCursoDocente[];
}

export interface FilaCursoDocente {
  facultad: string;
  sede: string;
  espacio: string;
  horas: string;
  cargo: string;
  basico: string;
  anual: string;
  semestre1: string;
  semestre2: string;
}
