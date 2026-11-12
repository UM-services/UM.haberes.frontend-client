/**
 * Contrato REST del registro `control` del período (`haberes-core`).
 *
 * Es el conjunto de parámetros que usa la liquidación mensual: ventana de
 * liquidación, fechas de pago y depósito, alícuotas, topes SIJP, adicionales y
 * modo de liquidación. Hay un único registro por `(anho, mes)`.
 */

export interface ModoLiquidacion {
  modoLiquidacionId: number;
  descripcion: string;
}

export interface ControlPeriodo {
  controlId: number | null;
  anho: number;
  mes: number;
  fechaDesde: string | null;
  fechaHasta: string | null;
  fechaPago: string | null;
  fechaDeposito: string | null;
  aporteJubilatorio: string | null;
  depositoBanco: string | null;
  doctorado: number | null;
  maestria: number | null;
  especializacion: number | null;
  familiaNumerosa: number | null;
  escuelaPrimaria: number | null;
  escuelaSecundaria: number | null;
  escuelaPrimariaNumerosa: number | null;
  escuelaSecundariaNumerosa: number | null;
  prenatal: number | null;
  libre: number | null;
  ayudaEscolar: number | null;
  matrimonio: number | null;
  nacimiento: number | null;
  funcionDireccion: number | null;
  mayorResponsabilidadPatrimonial: number | null;
  polimedb: number | null;
  polimedo: number | null;
  montoeci: number | null;
  valampo: number | null;
  jubilaem: number | null;
  inssjpem: number | null;
  osociaem: number | null;
  jubilpat: number | null;
  inssjpat: number | null;
  osocipat: number | null;
  ansalpat: number | null;
  salfapat: number | null;
  minimoAporte: number | null;
  maximoAporte: number | null;
  mincontr: number | null;
  maximo1sijp: number | null;
  maximo2sijp: number | null;
  maximo3sijp: number | null;
  maximo4sijp: number | null;
  maximo5sijp: number | null;
  estadoDocenteTitular: number | null;
  estadoDocenteAdjunto: number | null;
  estadoDocenteAuxiliar: number | null;
  adicionalHoraCargoClase: number | null;
  horaReferenciaEtec: number | null;
  valorPuntoEtec: number | null;
  modoLiquidacionId: number | null;
  modoLiquidacion?: ModoLiquidacion | null;
}

/** Payload de `POST /control/` y `PUT /control/{controlId}` (el id va en la ruta). */
export type ControlPeriodoRequest = Omit<ControlPeriodo, 'controlId' | 'modoLiquidacion'>;

/** Importes editables del período. */
export const CAMPOS_IMPORTE = [
  'doctorado',
  'maestria',
  'especializacion',
  'familiaNumerosa',
  'escuelaPrimaria',
  'escuelaSecundaria',
  'escuelaPrimariaNumerosa',
  'escuelaSecundariaNumerosa',
  'prenatal',
  'libre',
  'ayudaEscolar',
  'matrimonio',
  'nacimiento',
  'funcionDireccion',
  'mayorResponsabilidadPatrimonial',
  'polimedb',
  'polimedo',
  'montoeci',
  'valampo',
  'jubilaem',
  'inssjpem',
  'osociaem',
  'jubilpat',
  'inssjpat',
  'osocipat',
  'ansalpat',
  'salfapat',
  'minimoAporte',
  'maximoAporte',
  'mincontr',
  'maximo1sijp',
  'maximo2sijp',
  'maximo3sijp',
  'maximo4sijp',
  'maximo5sijp',
  'estadoDocenteTitular',
  'estadoDocenteAdjunto',
  'estadoDocenteAuxiliar',
  'adicionalHoraCargoClase',
  'horaReferenciaEtec',
  'valorPuntoEtec',
] as const;

export type CampoImporte = (typeof CAMPOS_IMPORTE)[number];

export type ImportesControl = Record<CampoImporte, number | null>;

export interface CampoImporteControl {
  campo: CampoImporte;
  label: string;
}

export interface SeccionImportes {
  id: string;
  titulo: string;
  descripcion: string;
  campos: CampoImporteControl[];
}

/**
 * Agrupación semántica de los importes (fuente única de etiquetas y orden).
 * Reemplaza las filas del formulario de escritorio sin cambiar los nombres.
 */
export const SECCIONES_IMPORTES: SeccionImportes[] = [
  {
    id: 'adicionales',
    titulo: 'Adicionales por título y familia',
    descripcion: 'Importes de adicionales por título, estado civil y grupo familiar.',
    campos: [
      { campo: 'doctorado', label: 'Doctorado' },
      { campo: 'maestria', label: 'Maestría' },
      { campo: 'especializacion', label: 'Especialización' },
      { campo: 'familiaNumerosa', label: 'Familia numerosa' },
      { campo: 'escuelaPrimaria', label: 'Escuela primaria' },
      { campo: 'escuelaSecundaria', label: 'Escuela media' },
      { campo: 'escuelaPrimariaNumerosa', label: 'Escuela primaria numerosa' },
      { campo: 'escuelaSecundariaNumerosa', label: 'Escuela media numerosa' },
      { campo: 'prenatal', label: 'Pre-natal' },
      { campo: 'libre', label: 'Libre' },
      { campo: 'ayudaEscolar', label: 'Ayuda escolar' },
      { campo: 'matrimonio', label: 'Matrimonio' },
      { campo: 'nacimiento', label: 'Nacimiento' },
      { campo: 'funcionDireccion', label: 'Función directiva' },
      {
        campo: 'mayorResponsabilidadPatrimonial',
        label: 'Mayor responsabilidad patrimonial',
      },
      { campo: 'polimedb', label: 'Polimedb' },
      { campo: 'polimedo', label: 'Polimedo' },
      { campo: 'montoeci', label: 'Monto ECI' },
      { campo: 'valampo', label: 'Val-Ampo' },
    ],
  },
  {
    id: 'aportes',
    titulo: 'Aportes y contribuciones',
    descripcion: 'Alícuotas del empleado y del empleador, y mínimos del período.',
    campos: [
      { campo: 'jubilaem', label: 'Jubilación empleado' },
      { campo: 'inssjpem', label: 'INSSJP empleado' },
      { campo: 'osociaem', label: 'O. Social empleado' },
      { campo: 'jubilpat', label: 'Jubilación patronal' },
      { campo: 'inssjpat', label: 'INSSJP patronal' },
      { campo: 'osocipat', label: 'O. Social patronal' },
      { campo: 'ansalpat', label: 'ANSAL patronal' },
      { campo: 'salfapat', label: 'Salario familiar patronal' },
      { campo: 'minimoAporte', label: 'Mínimo aporte' },
      { campo: 'maximoAporte', label: 'Máximo aporte' },
      { campo: 'mincontr', label: 'Mínimo control' },
    ],
  },
  {
    id: 'sijp',
    titulo: 'Topes SIJP',
    descripcion: 'Bases imponibles máximas usadas por AFIP y el cálculo de aportes.',
    campos: [
      { campo: 'maximo1sijp', label: 'SIJP máximo 1' },
      { campo: 'maximo2sijp', label: 'SIJP máximo 2' },
      { campo: 'maximo3sijp', label: 'SIJP máximo 3' },
      { campo: 'maximo4sijp', label: 'SIJP máximo 4' },
      { campo: 'maximo5sijp', label: 'SIJP máximo 5' },
    ],
  },
  {
    id: 'etec',
    titulo: 'Estados docentes y ETEC',
    descripcion: 'Valores por estado docente y parámetros de referencia de ETEC.',
    campos: [
      { campo: 'estadoDocenteTitular', label: 'Estado docente titular' },
      { campo: 'estadoDocenteAdjunto', label: 'Estado docente adjunto' },
      { campo: 'estadoDocenteAuxiliar', label: 'Estado docente auxiliar' },
      { campo: 'adicionalHoraCargoClase', label: 'Adicional hora cargo clase' },
      { campo: 'horaReferenciaEtec', label: 'Hora referencia ETEC' },
      { campo: 'valorPuntoEtec', label: 'Valor punto ETEC' },
    ],
  },
];

/** Estado editable del formulario (las fechas viajan como `yyyy-MM-dd`). */
export interface ControlPeriodoForm {
  controlId: number | null;
  fechaDesde: string;
  fechaHasta: string;
  fechaPago: string;
  fechaDeposito: string;
  aporteJubilatorio: string;
  depositoBanco: string;
  modoLiquidacionId: number | null;
  importes: ImportesControl;
}

export function importesVacios(): ImportesControl {
  return CAMPOS_IMPORTE.reduce((importes, campo) => {
    importes[campo] = 0;
    return importes;
  }, {} as ImportesControl);
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
