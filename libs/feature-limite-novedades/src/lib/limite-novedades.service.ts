import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, throwError } from 'rxjs';
import { API_URL } from '@haberes/shared-api';

import {
  Acreditacion,
  AcreditacionCreateRequest,
  LimiteNovedadesPatchRequest,
} from './limite-novedades.models';

/**
 * Único cliente HTTP de la pantalla Límite de Novedades.
 *
 * - `getPeriodo` usa el endpoint existente por período: el backend responde 404
 *   cuando todavía no hay registro y acá se traduce a `null` (período nuevo).
 * - `actualizarLimite` usa el `PATCH` parcial: sólo viaja el límite, de modo que
 *   nunca se pisan los datos contables del registro.
 */
@Injectable({ providedIn: 'root' })
export class LimiteNovedadesService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = inject(API_URL, { optional: true }) || '/api/haberes';

  private get url(): string {
    return `${this.apiBase}/core/acreditacion`;
  }

  getPeriodo(anho: number, mes: number): Observable<Acreditacion | null> {
    return this.http.get<Acreditacion>(`${this.url}/periodo/${anho}/${mes}`).pipe(
      catchError((err) => (err?.status === 404 ? of(null) : throwError(() => err))),
    );
  }

  crear(request: AcreditacionCreateRequest): Observable<Acreditacion> {
    return this.http.post<Acreditacion>(`${this.url}/`, request);
  }

  actualizarLimite(
    request: LimiteNovedadesPatchRequest,
    acreditacionId: number,
  ): Observable<Acreditacion> {
    return this.http.patch<Acreditacion>(`${this.url}/${acreditacionId}`, request);
  }
}
