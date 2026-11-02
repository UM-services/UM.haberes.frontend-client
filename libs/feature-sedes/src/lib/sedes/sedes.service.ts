import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '@haberes/shared-api';

export interface Sede {
  geograficaId: number;
  nombre: string;
  reducido?: string | null;
  desarraigo?: number | null;
  geograficaIdReemplazo?: number | null;
}

/** Payload de `PUT /geografica/{id}`: el id viaja en la ruta, no en el body. */
export interface SedeRequest {
  nombre: string;
  reducido: string | null;
  desarraigo: number;
  geograficaIdReemplazo: number | null;
}

@Injectable({ providedIn: 'root' })
export class SedesService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = inject(API_URL, { optional: true }) || '/api/haberes';

  private get url(): string {
    return `${this.apiBase}/core/geografica`;
  }

  getSedes(): Observable<Sede[]> {
    return this.http.get<Sede[]>(`${this.url}/`);
  }

  update(geograficaId: number, sede: SedeRequest): Observable<Sede> {
    return this.http.put<Sede>(`${this.url}/${geograficaId}`, sede);
  }
}
