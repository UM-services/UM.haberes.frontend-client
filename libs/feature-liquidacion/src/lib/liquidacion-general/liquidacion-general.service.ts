import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  EstadoLegajoGeneral,
  InicioProcesoGeneralResponse,
  PadronLiquidacionGeneral,
  ProcesoGeneral,
  ResultadoLegajoGeneral
} from './liquidacion-general.models';

/**
 * Cliente del slice `liquidacion-general` de haberes-core.
 *
 * Las escrituras envían `X-Legajo-Solicitante` para que el backend resuelva el actor de la
 * auditoría. Los procesos masivos devuelven 202 y se siguen por polling.
 */
@Injectable({ providedIn: 'root' })
export class LiquidacionGeneralService {
  private readonly http = inject(HttpClient);

  private readonly url = '/api/haberes/core/liquidacion-general';
  private readonly sheetUrl = '/api/haberes/core/sheet';

  padron(anho: number, mes: number): Observable<PadronLiquidacionGeneral> {
    return this.http.get<PadronLiquidacionGeneral>(`${this.url}/${anho}/${mes}`);
  }

  generarCargos(anho: number, mes: number, solicitante: number | null): Observable<InicioProcesoGeneralResponse> {
    return this.http.post<InicioProcesoGeneralResponse>(
      `${this.url}/${anho}/${mes}/cargos`, {}, this.headers(solicitante)
    );
  }

  liquidar(anho: number, mes: number, forzar: boolean,
           solicitante: number | null): Observable<InicioProcesoGeneralResponse> {
    return this.http.post<InicioProcesoGeneralResponse>(
      `${this.url}/${anho}/${mes}/liquidar`, { forzar }, this.headers(solicitante)
    );
  }

  eliminar(anho: number, mes: number, forzar: boolean,
           solicitante: number | null): Observable<InicioProcesoGeneralResponse> {
    return this.http.post<InicioProcesoGeneralResponse>(
      `${this.url}/${anho}/${mes}/eliminar`, { forzar }, this.headers(solicitante)
    );
  }

  proceso(procesoId: string): Observable<ProcesoGeneral> {
    return this.http.get<ProcesoGeneral>(`${this.url}/proceso/${procesoId}`);
  }

  detalle(procesoId: string, resultado: EstadoLegajoGeneral): Observable<ResultadoLegajoGeneral[]> {
    return this.http.get<ResultadoLegajoGeneral[]>(`${this.url}/proceso/${procesoId}/detalle/${resultado}`);
  }

  procesos(anho: number, mes: number): Observable<ProcesoGeneral[]> {
    return this.http.get<ProcesoGeneral[]>(`${this.url}/procesos/${anho}/${mes}`);
  }

  descargarPersonales(): Observable<Blob> {
    return this.http.get(`${this.sheetUrl}/generatePersonales`, { responseType: 'blob' });
  }

  descargarSalida(anho: number, mes: number): Observable<Blob> {
    return this.http.get(`${this.sheetUrl}/generateitems/${anho}/${mes}`, { responseType: 'blob' });
  }

  private headers(solicitante: number | null): { headers: Record<string, string> } {
    return solicitante === null
      ? { headers: {} }
      : { headers: { 'X-Legajo-Solicitante': String(solicitante) } };
  }
}
