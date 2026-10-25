/** Contrato de `GET /api/haberes/report/ui/designacionesDocente/data/{anho}/{mes}`. */
export interface DesignacionesDocenteData {
  anho: number;
  mes: number;
  docentes: DocenteDesignaciones[];
}

export interface DocenteDesignaciones {
  legajoId: number;
  apellidoNombre: string;
  filas: FilaDesignacion[];
}

export interface FilaDesignacion {
  facultad: string;
  sede: string;
  espacio: string;
  horas: string;
  cargo: string;
  designacion: string;
  horasDesignacion: string;
  dictado: string;
}
