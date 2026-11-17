/**
 * Totales del Formulario 931 (`seguridad_social` en haberes-core).
 *
 * Un único registro por `(año, mes)` con los seis totales que el operador copia
 * de AFIP. Los nombres `ccNNN` son los del backend y del legado: no cambiar.
 */
export interface SeguridadSocial {
  seguridadSocialId: number | null;
  anho: number;
  mes: number;
  cc351: number | null;
  cc301: number | null;
  cc352: number | null;
  cc302: number | null;
  cc312: number | null;
  cc028: number | null;
  created?: string | null;
  updated?: string | null;
}

/** Payload de escritura: el id va en la ruta del `PUT` y las fechas de auditoría no se envían. */
export interface SeguridadSocialRequest extends Importes931 {
  anho: number;
  mes: number;
}

export type CampoFormulario931 = 'cc351' | 'cc301' | 'cc352' | 'cc302' | 'cc312' | 'cc028';

export type Importes931 = Record<CampoFormulario931, number | null>;

export interface Formulario931Form extends Importes931 {
  seguridadSocialId: number | null;
}

export interface CampoFormulario931Def {
  campo: CampoFormulario931;
  etiqueta: string;
}

/**
 * Orden visual del formulario legado: fila 1 (351, 301, 352) y fila 2
 * (302, 312, 028). Se mantiene para no romper la memoria del operador.
 */
export const CAMPOS_931: ReadonlyArray<CampoFormulario931Def> = [
  { campo: 'cc351', etiqueta: 'Código 351' },
  { campo: 'cc301', etiqueta: 'Código 301' },
  { campo: 'cc352', etiqueta: 'Código 352' },
  { campo: 'cc302', etiqueta: 'Código 302' },
  { campo: 'cc312', etiqueta: 'Código 312' },
  { campo: 'cc028', etiqueta: 'Código 028' },
];

export function importesVacios(): Importes931 {
  return CAMPOS_931.reduce((importes, { campo }) => {
    importes[campo] = 0;
    return importes;
  }, {} as Importes931);
}

export function formularioVacio(): Formulario931Form {
  return { seguridadSocialId: null, ...importesVacios() };
}

export function mesAnterior(anho: number, mes: number): { anho: number; mes: number } {
  return mes === 1 ? { anho: anho - 1, mes: 12 } : { anho, mes: mes - 1 };
}

export function mesSiguiente(anho: number, mes: number): { anho: number; mes: number } {
  return mes === 12 ? { anho: anho + 1, mes: 1 } : { anho, mes: mes + 1 };
}

export function textoPeriodo(anho: number, mes: number): string {
  return `${String(mes).padStart(2, '0')}/${anho}`;
}

export function importe(valor: number | null | undefined): number {
  return valor == null ? 0 : Number(valor);
}

/**
 * Total de aportes que usa la imputación masiva del sistema legado
 * (`frmAsiento.frm`): 351 + 352 + 312 + 028. No se persiste.
 */
export function totalAportes(importes: Importes931): number {
  return (
    importe(importes.cc351) + importe(importes.cc352) + importe(importes.cc312) + importe(importes.cc028)
  );
}

/**
 * Total de leyes sociales que usa la imputación masiva del sistema legado
 * (`frmAsiento.frm`): 028 + 301 + 302 + 312 + 351 + 352. No se persiste.
 */
export function totalLeyesSociales(importes: Importes931): number {
  return CAMPOS_931.reduce((total, { campo }) => total + importe(importes[campo]), 0);
}
