import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '@haberes/shared-api';

import { SeguridadSocial, SeguridadSocialRequest } from './formulario-931.models';

/**
 * Único cliente HTTP de la pantalla Totales del Formulario 931.
 *
 * - `getPeriodo` usa el endpoint opcional: devuelve `null` cuando el período
 *   todavía no tiene datos (200 con cuerpo vacío), sin confundirlo con un error.
 * - `crear` y `actualizar` son excluyentes: el `PUT` es un reemplazo total y
 *   lleva el `seguridadSocialId` sólo en la ruta.
 */
@Injectable({ providedIn: 'root' })
export class Formulario931Service {
  private readonly http = inject(HttpClient);
  private readonly apiBase = inject(API_URL, { optional: true }) || '/api/haberes';

  private get url(): string {
    return `${this.apiBase}/core/seguridadSocial`;
  }

  getPeriodo(anho: number, mes: number): Observable<SeguridadSocial | null> {
    return this.http.get<SeguridadSocial | null>(`${this.url}/unique/${anho}/${mes}/opcional`);
  }

  crear(payload: SeguridadSocialRequest): Observable<SeguridadSocial> {
    return this.http.post<SeguridadSocial>(`${this.url}/`, payload);
  }

  actualizar(payload: SeguridadSocialRequest, seguridadSocialId: number): Observable<SeguridadSocial> {
    return this.http.put<SeguridadSocial>(`${this.url}/${seguridadSocialId}`, payload);
  }
}
