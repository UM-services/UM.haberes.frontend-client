/** Contrato de `GET /api/haberes/report/ui/bonoDependencia/data/{anho}/{mes}/{dependenciaId}/{salida}`. */
export interface BonosDependenciaData {
  anho: number;
  mes: number;
  dependenciaId: string;
  salida: string;
  filas: FilaBonoDependencia[];
}

export interface FilaBonoDependencia {
  legajoId: string;
  apellidoNombre: string;
  mailInstitucional: string;
  bonoEnviado: boolean;
}

/** Resultado del envío masivo, por legajo. */
export interface ResultadoEnvioBono {
  legajoId: string;
  apellidoNombre: string;
  mensaje: string;
  ok: boolean;
}
