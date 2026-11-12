/**
 * Modelos de Asignación de Cargos No Docentes.
 *
 * El backend devuelve `categoria` y `dependencia` embebidas en cada cargo y
 * `facultad` embebida en cada facultad habilitada, así que la grilla no
 * necesita resolver ids contra los catálogos.
 */

export interface Categoria {
  categoriaId: number;
  nombre: string;
  basico: number;
  docente: number;
  noDocente: number;
  liquidaPorHora: number;
}

export interface Dependencia {
  dependenciaId: number;
  nombre: string;
  acronimo?: string;
}

export interface Facultad {
  facultadId: number;
  nombre: string;
  reducido?: string;
}

export interface Cargo {
  cargoId: number;
  legajoId: number;
  fechaAlta: string;
  fechaBaja: string | null;
  dependenciaId: number;
  categoriaId: number;
  jornada: number;
  presentismo: number;
  horasJornada: number;
  categoria?: Categoria | null;
  dependencia?: Dependencia | null;
}

export interface CargoRequest {
  legajoId: number;
  fechaAlta: string;
  fechaBaja: string | null;
  dependenciaId: number;
  categoriaId: number;
  jornada: number;
  presentismo: number;
  horasJornada: number;
}

export interface PersonaFacultad {
  personaFacultadId: number;
  legajoId: number;
  facultadId: number;
  facultad?: Facultad | null;
}

export interface CatalogosAsignacionCargo {
  categorias: Categoria[];
  dependencias: Dependencia[];
  facultades: Facultad[];
}

/** Valor para `<input type="date">` a partir del ISO que devuelve haberes-core. */
export function fechaInput(valor: string | null | undefined): string {
  return valor ? valor.slice(0, 10) : '';
}

/**
 * Reconstruye la fecha con el mismo horario y offset que devolvió el backend
 * (formato `yyyy-MM-dd'T'HH:mm:ssXX`) para no correr el día.
 */
export function fechaPayload(original: string | null | undefined, fecha: string): string {
  const horario = original?.match(/T(\d{2}:\d{2}:\d{2})/)?.[1] ?? '00:00:00';
  const offsetOriginal = original?.match(/(Z|[+-]\d{2}:?\d{2})$/)?.[1];
  const offset = !offsetOriginal
    ? '+0000'
    : offsetOriginal === 'Z'
      ? 'Z'
      : offsetOriginal.replace(':', '');
  return `${fecha}T${horario}${offset}`;
}

/** Fecha corta para la grilla (`dd/mm/aaaa`). */
export function textoFecha(valor: string | null | undefined): string {
  const fecha = fechaInput(valor);
  if (!fecha) {
    return '—';
  }
  const [anho, mes, dia] = fecha.split('-');
  return `${dia}/${mes}/${anho}`;
}

/** Jornada legible: el legado la ocultaba cuando el cargo se liquida por hora. */
export function textoJornada(jornada: number, horasJornada: number | null | undefined): string {
  if (Number(horasJornada ?? 0) > 0) {
    return '';
  }
  if (jornada === 2) {
    return 'Completa';
  }
  if (jornada === 1) {
    return 'Media';
  }
  return '—';
}

/** Fecha de hoy en formato `yyyy-MM-dd`, sin corrimientos de zona horaria. */
export function fechaHoy(): string {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${hoy.getFullYear()}-${mes}-${dia}`;
}
