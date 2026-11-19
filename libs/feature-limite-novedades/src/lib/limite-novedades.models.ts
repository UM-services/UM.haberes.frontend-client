/**
 * Contrato REST del registro `acreditacion` del período (`haberes-core`) y reglas
 * de conversión del límite de novedades.
 *
 * Hay un único registro por `(anho, mes)`. La pantalla sólo edita
 * `limiteNovedades`; el resto de los campos los actualizan el asiento contable y
 * la acreditación bancaria.
 */

export interface Acreditacion {
  acreditacionId: number | null;
  anho: number;
  mes: number;
  acreditado: number | null;
  limiteNovedades: string | null;
  fechaContable: string | null;
  ordenContable: number | null;
  sueldosOriginal: number | null;
  sueldosAjustados: number | null;
  contribucionesPatronales: number | null;
}

/** `POST /acreditacion/` — alta del período con el límite. */
export interface AcreditacionCreateRequest {
  anho: number;
  mes: number;
  limiteNovedades: string;
}

/** `PATCH /acreditacion/{id}` — único campo que edita esta pantalla. */
export interface LimiteNovedadesPatchRequest {
  limiteNovedades: string;
}

export const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
] as const;

export function mesAnterior(anho: number, mes: number): { anho: number; mes: number } {
  return mes === 1 ? { anho: anho - 1, mes: 12 } : { anho, mes: mes - 1 };
}

export function mesSiguiente(anho: number, mes: number): { anho: number; mes: number } {
  return mes === 12 ? { anho: anho + 1, mes: 1 } : { anho, mes: mes + 1 };
}

export function textoPeriodo(anho: number, mes: number): string {
  return `${MESES[mes - 1] ?? mes} ${anho}`;
}

/** Fecha legible `dd/mm/aaaa` a partir de un `yyyy-MM-dd`. */
export function textoFecha(fecha: string): string {
  if (!fecha) return '';
  const [anho, mes, dia] = fecha.split('-');
  return `${dia}/${mes}/${anho}`;
}

const ART = 'America/Argentina/Buenos_Aires';

/**
 * Los registros heredados guardaron el límite como medianoche UTC, que en ART es
 * el día anterior a las 21:00. Un valor nuevo es el fin del día ART y se lee como
 * `…T02:59:59Z` del día siguiente, así que nunca cae en esta forma.
 */
const MEDIANOCHE_UTC = /T00:00:00(?:\.\d+)?(?:Z|\+00:?00)$/;

/** Fecha (`yyyy-MM-dd`) que representa el límite guardado. */
export function fechaLimiteVisible(valor: string | null | undefined): string {
  if (!valor) return '';
  if (MEDIANOCHE_UTC.test(valor)) return valor.slice(0, 10);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ART,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(valor));
}

/**
 * Payload del backend: fin del día elegido, hora de Argentina. El offset va sin
 * dos puntos (`-0300`) porque los DTOs del slice usan el patrón `XX`.
 */
export function fechaLimitePayload(fecha: string): string {
  return fecha ? `${fecha}T23:59:59-0300` : '';
}

/** Cierre efectivo (instante) del límite elegido, para mostrar el corte. */
export function cierreLimite(fecha: string): Date | null {
  return fecha ? new Date(`${fecha}T23:59:59-03:00`) : null;
}

export type EstadoCarga = 'acreditado' | 'cerrada' | 'abierta' | 'sin-limite';

/**
 * Estado real de la carga, con la misma comparación que usan el anotador y la
 * asignación de cursos: `acreditado = 1` manda y, si no, se compara el instante
 * guardado contra ahora (los registros heredados cortan a las 21:00 ART).
 */
export function estadoCarga(
  registro: Acreditacion | null,
  ahora: Date = new Date(),
): EstadoCarga {
  if (registro?.acreditado === 1) return 'acreditado';
  if (!registro?.limiteNovedades) return 'sin-limite';
  return ahora > new Date(registro.limiteNovedades) ? 'cerrada' : 'abierta';
}
