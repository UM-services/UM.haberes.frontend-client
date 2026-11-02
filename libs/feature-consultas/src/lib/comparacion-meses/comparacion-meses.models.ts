/** Contrato de `GET /api/haberes/report/ui/comparacionRemuneraciones/data/{anho}/{mes}/{anhoAnterior}/{mesAnterior}`. */
export interface ComparacionRemuneracionesData {
  anho: number;
  mes: number;
  anhoAnterior: number;
  mesAnterior: number;
  dependencias: DependenciaComparacion[];
}

export interface DependenciaComparacion {
  nombre: string;
  filas: FilaComparacionRemuneraciones[];
}

export interface FilaComparacionRemuneraciones {
  legajoId: string;
  apellidoNombre: string;
  brutoAnterior: string;
  brutoActual: string;
  brutoDiferencia: string;
  brutoPorcentaje: string;
  netoAnterior: string;
  netoActual: string;
  netoDiferencia: string;
}
