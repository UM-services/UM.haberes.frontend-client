import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '@haberes/shared-api';

import { SijpResponse, VarianteSijp } from './sijp.models';

/** Único cliente HTTP de la pantalla Generar SIJP. */
@Injectable({ providedIn: 'root' })
export class SijpService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = inject(API_URL, { optional: true }) || '/api/haberes';

  generar(anho: number, mes: number, variante: VarianteSijp): Observable<SijpResponse> {
    return this.http.get<SijpResponse>(`${this.apiBase}/core/sijp/${anho}/${mes}/${variante}`);
  }
}
