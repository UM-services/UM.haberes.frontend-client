import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '@haberes/shared-api';

import {
  ArchivoAcreditacionRequest,
  ArchivoAcreditacionResponse,
  Banco,
  PreparacionAcreditacion,
} from './movimientos.models';

/**
 * Cliente del generador de archivos bancarios.
 *
 * Los endpoints son aditivos en haberes-core: no reemplazan ni modifican los
 * contratos que ya consume el cliente VB6.
 */
@Injectable({ providedIn: 'root' })
export class AcreditacionArchivoService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = inject(API_URL, { optional: true }) || '/api/haberes';

  private get url(): string {
    return `${this.apiBase}/core/acreditacion/archivo`;
  }

  private get legajoBancoUrl(): string {
    return `${this.apiBase}/core/legajobanco`;
  }

  generar(banco: Banco, request: ArchivoAcreditacionRequest): Observable<ArchivoAcreditacionResponse> {
    return this.http.post<ArchivoAcreditacionResponse>(`${this.url}/${banco}`, request);
  }

  prepararLegajo(legajoId: number, anho: number, mes: number): Observable<PreparacionAcreditacion> {
    return this.http.post<PreparacionAcreditacion>(
      `${this.legajoBancoUrl}/preparar/${legajoId}/${anho}/${mes}`,
      {},
    );
  }

  prepararPeriodo(anho: number, mes: number): Observable<PreparacionAcreditacion> {
    return this.http.post<PreparacionAcreditacion>(`${this.legajoBancoUrl}/preparar/${anho}/${mes}`, {});
  }

  eliminarPeriodo(anho: number, mes: number): Observable<void> {
    return this.http.delete<void>(`${this.legajoBancoUrl}/periodo/${anho}/${mes}`);
  }
}
