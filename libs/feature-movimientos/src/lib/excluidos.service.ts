import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, of, throwError } from 'rxjs';
import { API_URL } from '@haberes/shared-api';

import { Excluido, ExcluidosReporte } from './movimientos.models';

/** ABM de excluidos (core) y planilla de excluidos (report). */
@Injectable({ providedIn: 'root' })
export class ExcluidosService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = inject(API_URL, { optional: true }) || '/api/haberes';

  private get url(): string {
    return `${this.apiBase}/core/excluido`;
  }

  private get reportUrl(): string {
    return `${this.apiBase}/report/ui/excluidos`;
  }

  listar(anho: number, mes: number): Observable<Excluido[]> {
    return this.http.get<Excluido[]>(`${this.url}/periodo/${anho}/${mes}`);
  }

  /** El core responde 400 cuando el legajo no está excluido en el período. */
  buscar(legajoId: number, anho: number, mes: number): Observable<Excluido | null> {
    return this.http.get<Excluido>(`${this.url}/unique/${legajoId}/${anho}/${mes}`).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 400 || err.status === 404) {
          return of(null);
        }
        return throwError(() => err);
      }),
    );
  }

  crear(excluido: Excluido): Observable<Excluido> {
    return this.http.post<Excluido>(`${this.url}/`, excluido);
  }

  actualizar(excluido: Excluido, excluidoId: number): Observable<Excluido> {
    return this.http.put<Excluido>(`${this.url}/${excluidoId}`, excluido);
  }

  eliminar(legajoId: number, anho: number, mes: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/unique/${legajoId}/${anho}/${mes}`);
  }

  reporte(anho: number, mes: number): Observable<ExcluidosReporte> {
    return this.http.get<ExcluidosReporte>(`${this.reportUrl}/data/${anho}/${mes}`);
  }

  pdf(anho: number, mes: number): Observable<Blob> {
    return this.http.get(`${this.reportUrl}/pdf/${anho}/${mes}`, { responseType: 'blob' });
  }

  xlsx(anho: number, mes: number): Observable<Blob> {
    return this.http.get(`${this.reportUrl}/xlsx/${anho}/${mes}`, { responseType: 'blob' });
  }
}
