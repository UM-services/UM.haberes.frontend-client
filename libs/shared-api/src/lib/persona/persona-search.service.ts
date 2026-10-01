import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of, switchMap } from 'rxjs';

import { Persona } from '../auth/auth.service';

/**
 * Texto de presentación de la persona (equivale a clsMODPersona.apellidoNombre
 * del cliente legacy).
 */
export function textoPersona(persona: Persona): string {
  const apellidoNombre = (persona.apellidoNombre ?? '').trim();
  if (apellidoNombre) {
    return apellidoNombre;
  }
  return [persona.apellido ?? '', persona.nombre ?? '']
    .map((parte) => String(parte).trim())
    .filter((parte) => parte.length > 0)
    .join(', ');
}

/**
 * Acceso único al buscador de personas de haberes-core (/api/haberes/core/persona),
 * replicando la estrategia del repository legacy clsREPPersona:
 *
 *  - collectionSearch: la cadena se parte por espacios y cada palabra viaja
 *    como condición a POST /search; el core aplica LIKE '%palabra%' con AND
 *    sobre la columna `search` de vw_persona_search, orden apellido/nombre
 *    y top 50 (JpaPersonaSearchRepositoryCustomImpl).
 *  - findByLegajoId / findByDocumento: GET exactos que los formularios usan
 *    al presionar ENTER sobre los campos Legajo y Documento.
 */
@Injectable({ providedIn: 'root' })
export class PersonaSearchService {
  private readonly http = inject(HttpClient);
  private readonly personaUrl = '/api/haberes/core/persona';

  /**
   * Búsqueda de estrategia legacy: divide el término en palabras (el core las
   * combina con AND) y, si no hay coincidencias de texto y el término es un
   * número, reintenta como legajo exacto. Desde el primer carácter: el modal
   * legacy buscaba en cada pulsación, sin umbral mínimo.
   */
  buscar(termino: string): Observable<Persona[]> {
    const limpio = termino.trim();
    if (limpio.length === 0) {
      return of([]);
    }
    return this.searchPersonas(limpio).pipe(
      switchMap((coincidencias) => {
        if (coincidencias.length > 0 || !/^\d+$/.test(limpio)) {
          return of(coincidencias);
        }
        return this.getPersonaByLegajo(Number(limpio)).pipe(map((persona) => [persona]));
      })
    );
  }

  searchPersonas(termino: string): Observable<Persona[]> {
    // El backend espera la lista de palabras (equivalente al Split(chain, " ") del VB6);
    // se filtran las vacías para no enviar condiciones que matcheen todo.
    const palabras = termino
      .split(' ')
      .map((palabra) => palabra.trim())
      .filter((palabra) => palabra.length > 0);
    if (palabras.length === 0) {
      return of([]);
    }
    return this.http.post<Persona[]>(`${this.personaUrl}/search`, palabras);
  }

  getPersonaByLegajo(legajoId: number): Observable<Persona> {
    return this.http.get<Persona>(`${this.personaUrl}/${legajoId}`);
  }

  getPersonaByDocumento(documento: number | string): Observable<Persona> {
    return this.http.get<Persona>(`${this.personaUrl}/documento/${documento}`);
  }
}
