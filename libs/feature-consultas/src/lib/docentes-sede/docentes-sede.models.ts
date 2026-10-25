/** Contrato de `GET /api/haberes/report/ui/docentesSede/data/{facultadId}/{geograficaId}/{anho}/{mes}`. */
export interface DocentesSedeData {
  anho: number;
  mes: number;
  facultad: string;
  geografica: string;
  cursos: CursoDocentesSede[];
}

export interface CursoDocentesSede {
  nombre: string;
  periodo: string;
  filas: FilaDocentesSede[];
}

export interface FilaDocentesSede {
  cargo: string;
  docente: string;
  designacion: string;
  horas: string;
  desarraigo: string;
}
