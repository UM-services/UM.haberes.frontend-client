/**
 * Contrato de `GET /api/haberes/core/sijp/{anho}/{mes}/{variante}`.
 *
 * El archivo SIJP es una tira de registros de 499 caracteres (windows-1252, CRLF), uno por
 * legajo liquidado. El backend lo devuelve en Base64 junto con la cantidad de registros para
 * poder mostrar un resumen antes de descargarlo.
 */
export type VarianteSijp = 'normal' | 'etec';

export interface LegajoOmitidoSijp {
  legajoId: number;
  apellidoNombre: string;
  motivo: string;
}

export interface SijpResponse {
  nombreArchivo: string;
  variante: 'NORMAL' | 'ETEC';
  contenido: string;
  cantidadRegistros: number;
  omitidos: LegajoOmitidoSijp[];
  advertencias: string[];
}

export interface OpcionVarianteSijp {
  valor: VarianteSijp;
  etiqueta: string;
  descripcion: string;
}

export const VARIANTES_SIJP: readonly OpcionVarianteSijp[] = [
  {
    valor: 'normal',
    etiqueta: 'Normal',
    descripcion: 'Tratamiento previsional general de los legajos liquidados del período.'
  },
  {
    valor: 'etec',
    etiqueta: 'ETEC',
    descripcion: 'Variante ETEC: descuenta el aporte solidario y ajusta los legajos sólo ETEC.'
  }
];
