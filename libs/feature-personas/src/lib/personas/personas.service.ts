import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { API_URL, Persona } from '@haberes/shared-api';

export interface Contacto {
  legajoId: number;
  fijo?: string | null;
  movil?: string | null;
  mailPersonal?: string | null;
  mailInstitucional?: string | null;
}

export interface Dependencia {
  dependenciaId: number;
  nombre: string;
  acronimo?: string | null;
}

export interface LegajoBanco {
  legajoBancoId: number | null;
  legajoId: number;
  anho: number;
  mes: number;
  cbu: string;
  fijo: number;
  porcentaje: number;
  resto: number;
}

export interface AntiguedadPeriodo {
  antiguedadId: number;
  legajoId: number;
  anho: number;
  mes: number;
  mesesDocentes?: number | null;
  mesesAdministrativos?: number | null;
}

/**
 * Campos editables de la ficha. Sólo se envían al backend los que cambiaron:
 * `PATCH /persona/{legajoId}` aplica exclusivamente lo informado.
 */
export interface PersonaPatch {
  documento?: number;
  apellido?: string;
  nombre?: string;
  nacimiento?: string;
  altaDocente?: string;
  ajusteDocente?: number;
  altaAdministrativa?: string;
  ajusteAdministrativo?: number;
  estadoCivil?: string;
  situacionId?: number;
  reemplazoDesarraigo?: number;
  mitadDesarraigo?: number;
  cuil?: string;
  posgrado?: number;
  estado?: number;
  liquida?: string;
  estadoAfip?: number;
  dependenciaId?: number;
  salida?: string;
  obraSocial?: number;
  actividadAfip?: number;
  localidadAfip?: number;
  situacionAfip?: number;
  modeloContratacionAfip?: number;
  directivoEtec?: number;
}

/** Valor para `<input type="date">` a partir del ISO que devuelve haberes-core. */
export function fechaInput(valor: string | null | undefined): string {
  return valor ? valor.slice(0, 10) : '';
}

/**
 * Reconstruye la fecha con el mismo horario y offset que devolvió el backend
 * (el formato esperado es `yyyy-MM-dd'T'HH:mm:ssXX`), para no correr el día.
 */
export function fechaPayload(original: string | null | undefined, fecha: string): string {
  const horario = original?.match(/T(\d{2}:\d{2}:\d{2})/)?.[1] ?? '00:00:00';
  const offsetOriginal = original?.match(/(Z|[+-]\d{2}:?\d{2})$/)?.[1];
  // El backend declara el patrón `XX` (sin dos puntos en el offset).
  const offset = !offsetOriginal
    ? '+0000'
    : offsetOriginal === 'Z'
      ? 'Z'
      : offsetOriginal.replace(':', '');
  return `${fecha}T${horario}${offset}`;
}

@Injectable({ providedIn: 'root' })
export class PersonasService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = inject(API_URL, { optional: true }) || '/api/haberes';

  private get personaUrl(): string {
    return `${this.apiBase}/core/persona`;
  }

  private get contactoUrl(): string {
    return `${this.apiBase}/core/contacto`;
  }

  getPersona(legajoId: number): Observable<Persona> {
    return this.http.get<Persona>(`${this.personaUrl}/${legajoId}`);
  }

  getPersonaPorDocumento(documento: number): Observable<Persona> {
    return this.http.get<Persona>(`${this.personaUrl}/documento/${documento}`);
  }

  /** Aplica únicamente los campos informados (endpoint aditivo del backend). */
  patchPersona(legajoId: number, patch: PersonaPatch): Observable<Persona> {
    return this.http.patch<Persona>(`${this.personaUrl}/${legajoId}`, patch);
  }

  getContacto(legajoId: number): Observable<Contacto | null> {
    return this.http
      .get<Contacto>(`${this.contactoUrl}/${legajoId}`)
      .pipe(catchError(() => of(null)));
  }

  saveContacto(contacto: Contacto, existe: boolean): Observable<Contacto> {
    return existe
      ? this.http.put<Contacto>(`${this.contactoUrl}/${contacto.legajoId}`, contacto)
      : this.http.post<Contacto>(`${this.contactoUrl}/`, contacto);
  }

  /** Valida un mail contra el backend (misma regla que usaba la aplicación anterior). */
  validarMail(mail: string): Observable<boolean> {
    return this.http.post<boolean>(`${this.apiBase}/core/tool/mailvalidate`, [mail]);
  }

  getDependencias(): Observable<Dependencia[]> {
    return this.http.get<Dependencia[]>(`${this.apiBase}/core/dependencia/`);
  }

  getLegajosBanco(legajoId: number): Observable<LegajoBanco[]> {
    return this.http.get<LegajoBanco[]>(`${this.apiBase}/core/legajobanco/legajo/${legajoId}`);
  }

  saveLegajoBanco(banco: LegajoBanco, existe: boolean): Observable<LegajoBanco> {
    return existe && banco.legajoBancoId
      ? this.http.put<LegajoBanco>(`${this.apiBase}/core/legajobanco/${banco.legajoBancoId}`, banco)
      : this.http.post<LegajoBanco>(`${this.apiBase}/core/legajobanco/`, banco);
  }

  getAntiguedad(legajoId: number, anho: number, mes: number): Observable<AntiguedadPeriodo> {
    return this.http.get<AntiguedadPeriodo>(
      `${this.apiBase}/core/antiguedad/last/${legajoId}/${anho}/${mes}`,
    );
  }

  calcularAntiguedad(legajoId: number, anho: number, mes: number): Observable<void> {
    return this.http.get<void>(
      `${this.apiBase}/core/antiguedad/calculate/${legajoId}/${anho}/${mes}`,
    );
  }
}
