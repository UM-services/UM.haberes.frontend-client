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

/**
 * Estado del job de generación del PDF consolidado:
 * `POST /api/haberes/report/ui/bonoDependencia/pdf/{anho}/{mes}/{dependenciaId}/{salida}`.
 */
export interface BonoDependenciaPdfJob {
  jobId: string;
  estado: 'EN_PROCESO' | 'LISTO' | 'ERROR';
  procesados: number;
  total: number;
  mensaje: string | null;
  fallidos: readonly { legajoId: string; motivo: string }[];
}
