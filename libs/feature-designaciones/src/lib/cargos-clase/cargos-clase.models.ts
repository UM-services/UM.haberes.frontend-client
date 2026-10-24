/**
 * Modelos de Cargos con Clase (asignación por legajo y duplicación por período).
 *
 * El backend devuelve las entidades completas, con facultad, sede, dependencia,
 * cargo con clase y persona embebidos, así que no hacen falta catálogos para
 * mostrar los nombres.
 */

export interface Clase {
  claseId: number;
  nombre: string;
  valorHora: number;
}

export interface CargoClase {
  cargoClaseId: number;
  nombre: string;
  claseId: number;
  clase?: Clase | null;
}

export interface Facultad {
  facultadId: number;
  nombre: string;
  reducido?: string;
}

export interface Geografica {
  geograficaId: number;
  nombre: string;
  reducido?: string;
}

export interface Dependencia {
  dependenciaId: number;
  nombre: string;
  acronimo?: string;
  facultadId: number;
  geograficaId: number;
}

export interface PersonaResumen {
  legajoId: number;
  apellido: string;
  nombre: string;
  apellidoNombre?: string;
  documento?: number;
}

export interface CargoClasePeriodo {
  cargoClasePeriodoId: number;
  legajoId: number;
  cargoClaseId: number;
  dependenciaId: number;
  facultadId: number;
  geograficaId: number;
  periodoDesde: number;
  periodoHasta: number;
  horas: number;
  valorHora: number;
  aplicaAdicional: number;
  descripcion: string | null;
  persona?: PersonaResumen | null;
  cargoClase?: CargoClase | null;
  dependencia?: Dependencia | null;
  facultad?: Facultad | null;
  geografica?: Geografica | null;
}

export interface CargoClaseDetalle {
  cargoClaseDetalleId: number;
  legajoId: number;
  anho: number;
  mes: number;
  cargoClaseId: number;
  dependenciaId: number;
  facultadId: number;
  geograficaId: number;
  horas: number;
  valorHora: number;
  aplicaAdicional: number;
  cargoClasePeriodoId: number;
  liquidado: number;
  persona?: PersonaResumen | null;
  cargoClase?: CargoClase | null;
  dependencia?: Dependencia | null;
  facultad?: Facultad | null;
  geografica?: Geografica | null;
  cargoClasePeriodo?: CargoClasePeriodo | null;
}

export interface Antiguedad {
  legajoId: number;
  anho: number;
  mes: number;
  mesesDocentes: number;
  mesesAdministrativos: number;
}

/** Payload del proceso de alta (cargoclasetool). */
export interface CargoClasePeriodoPayload {
  legajoId: number;
  cargoClaseId: number;
  dependenciaId: number;
  facultadId: number;
  geograficaId: number;
  periodoDesde: number;
  periodoHasta: number;
  horas: number;
  aplicaAdicional: number;
  descripcion: string;
}

/** Período en formato AAAAMM, como lo persiste el backend. */
export interface Periodo {
  anho: number;
  mes: number;
}

export function periodoDeNumero(valor: number | null | undefined): Periodo {
  const numero = Math.trunc(valor ?? 0);
  return { anho: Math.trunc(numero / 100), mes: numero % 100 };
}

export function numeroDePeriodo(periodo: Periodo): number {
  return periodo.anho * 100 + periodo.mes;
}

/** Texto "AAAA/MM" o "MM/AAAA" para las grillas. */
export function periodoTexto(valor: number | null | undefined): string {
  const periodo = periodoDeNumero(valor);
  if (!periodo.anho || !periodo.mes) {
    return '—';
  }
  return `${String(periodo.mes).padStart(2, '0')}/${periodo.anho}`;
}

/** Meses a "X años Y meses", como mostraba el formulario legado. */
export function mesesATexto(meses: number): string {
  const anhos = Math.trunc(meses / 12);
  const resto = meses % 12;
  if (anhos === 0) {
    return `${resto} mes(es)`;
  }
  return resto === 0 ? `${anhos} año(s)` : `${anhos} año(s) ${resto} mes(es)`;
}

/** Incrementa o decrementa un período en un mes. */
export function moverMes(periodo: Periodo, incremento: number): Periodo {
  let mes = periodo.mes + incremento;
  let anho = periodo.anho;
  if (mes > 12) {
    mes = 1;
    anho++;
  }
  if (mes < 1) {
    mes = 12;
    anho--;
  }
  return { anho, mes };
}
