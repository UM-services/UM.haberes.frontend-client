/**
 * Modelos de Asignación de Cargos ETEC.
 *
 * Un cargo ETEC es una categoría con `puntos > 0` y `docente = 1`; su importe no es el
 * básico de la categoría sino `puntos × valorPuntoEtec + montoFijoCargo` del período. La
 * asignación al legajo vive en `etec_asignacion_cargo`, no en `cargo`.
 */

export interface CategoriaEtec {
  categoriaId: number;
  nombre: string;
  basico: number;
  docente: number;
  noDocente: number;
  liquidaPorHora: number;
  estadoDocente?: number;
  puntos: number | null;
}

export interface Dependencia {
  dependenciaId: number;
  nombre: string;
  acronimo?: string;
}

export interface AsignacionEtec {
  asignacionCargoId: number;
  legajoId: number;
  categoriaId: number;
  dependenciaId: number | null;
  fechaAlta: string;
  fechaBaja: string | null;
  observaciones: string | null;
  categoriaNombre: string | null;
  dependenciaNombre: string | null;
  personaApellido: string | null;
  personaNombre: string | null;
}

export interface AsignacionEtecRequest {
  legajoId: number;
  categoriaId: number;
  dependenciaId: number;
  fechaAlta: string;
  fechaBaja: string | null;
  observaciones: string | null;
}

/** Pérdida de presentismo de una asignación de cargo ETEC en un período. */
export interface PresentismoEtec {
  presentismoId: number;
  asignacionCargoId: number;
  anho: number;
  mes: number;
  motivo: string;
  legajoId?: number | null;
  categoriaId?: number | null;
  dependenciaId?: number | null;
  categoriaNombre?: string | null;
  dependenciaNombre?: string | null;
  personaApellido?: string | null;
  personaNombre?: string | null;
}

export interface PresentismoEtecRequest {
  asignacionCargoId: number;
  anho: number;
  mes: number;
  motivo: string;
}

export interface PresentismoEtecUpdateRequest {
  motivo: string;
}

/** Pérdida de presentismo de los cargos ETEC por horas de un legajo en un período. */
export interface PresentismoHorasEtec {
  presentismoHorasId: number | null;
  legajoId: number;
  anho: number;
  mes: number;
  motivo: string | null;
  personaApellido?: string | null;
  personaNombre?: string | null;
  tieneCargosHoras: boolean;
}

export interface PresentismoHorasRequest {
  legajoId: number;
  anho: number;
  mes: number;
  motivo: string;
}

export interface PresentismoHorasUpdateRequest {
  motivo: string;
}

/** Estado del período según `acreditacion`. `acreditado = 1` cierra las escrituras. */
export interface AcreditacionPeriodo {
  acreditacionId: number;
  anho: number;
  mes: number;
  acreditado: number;
  limiteNovedades?: string | null;
}

/** Recorte del control del período que necesita la pantalla. */
export interface ControlPeriodo {
  anho: number;
  mes: number;
  valorPuntoEtec: number | null;
  montoFijoCargo: number | null;
}

export interface CatalogosEtec {
  cargos: CategoriaEtec[];
  dependencias: Dependencia[];
}

export interface Periodo {
  anho: number;
  mes: number;
}

/** Regla de negocio: sólo se asignan categorías con puntos marcadas como docentes. */
export function esCargoEtec(categoria: CategoriaEtec): boolean {
  return Number(categoria.puntos ?? 0) > 0 && categoria.docente === 1;
}

export function puntosDe(categoria: CategoriaEtec | null | undefined): number | null {
  if (!categoria) {
    return null;
  }
  const puntos = Number(categoria.puntos ?? 0);
  return puntos > 0 ? puntos : null;
}

export function periodoActual(): Periodo {
  const hoy = new Date();
  return { anho: hoy.getFullYear(), mes: hoy.getMonth() + 1 };
}

export function sumarMes(periodo: Periodo, delta: number): Periodo {
  const indice = periodo.anho * 12 + (periodo.mes - 1) + delta;
  return { anho: Math.floor(indice / 12), mes: (indice % 12) + 1 };
}

export function textoPeriodo(periodo: Periodo): string {
  return `${String(periodo.mes).padStart(2, '0')}/${periodo.anho}`;
}

/** Fecha de hoy en formato `yyyy-MM-dd`, sin corrimientos de zona horaria. */
export function fechaHoy(): string {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${hoy.getFullYear()}-${mes}-${dia}`;
}

export function estadoAsignacion(asignacion: AsignacionEtec): string {
  return asignacion.fechaBaja ? 'Baja' : 'Vigente';
}
