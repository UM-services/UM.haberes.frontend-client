/** Contrato de `GET /api/haberes/report/ui/cursosContratado/data/{anho}/{mes}`. */
export interface CursosContratadoData {
  anho: number;
  mes: number;
  filas: FilaCursosContratado[];
}

export interface FilaCursosContratado {
  cuit: string;
  apellidoNombre: string;
  periodo: string;
  facultad: string;
  sede: string;
  curso: string;
  cargo: string;
  horas: string;
  dictado: string;
}
