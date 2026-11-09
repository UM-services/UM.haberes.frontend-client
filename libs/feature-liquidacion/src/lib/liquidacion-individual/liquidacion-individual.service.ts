import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  CodigoBusqueda,
  FichaLiquidacionIndividual,
  NovedadRegistradaResponse,
  RegistroNovedadRequest,
  ResumenGeneracionCargosResponse,
  ResultadoProcesoResponse
} from './liquidacion-individual.models';

/**
 * Cliente del slice `liquidacion-individual` de haberes-core.
 *
 * Las escrituras envían `X-Legajo-Solicitante`: el backend resuelve actor e IP para la
 * auditoría y no acepta una IP provista por el navegador.
 */
@Injectable({ providedIn: 'root' })
export class LiquidacionIndividualService {
  private readonly http = inject(HttpClient);

  private readonly url = '/api/haberes/core/liquidacion-individual';
  private readonly codigoUrl = '/api/haberes/core/codigo';

  ficha(legajoId: number, anho: number, mes: number): Observable<FichaLiquidacionIndividual> {
    return this.http.get<FichaLiquidacionIndividual>(`${this.url}/${legajoId}/${anho}/${mes}`);
  }

  generarCargos(legajoId: number, anho: number, mes: number,
                solicitante: number | null): Observable<ResumenGeneracionCargosResponse> {
    return this.http.post<ResumenGeneracionCargosResponse>(
      `${this.url}/${legajoId}/${anho}/${mes}/cargos`, {}, this.headers(solicitante)
    );
  }

  liquidar(legajoId: number, anho: number, mes: number, forzar: boolean,
           solicitante: number | null): Observable<ResultadoProcesoResponse> {
    return this.http.post<ResultadoProcesoResponse>(
      `${this.url}/${legajoId}/${anho}/${mes}/liquidar`, { forzar }, this.headers(solicitante)
    );
  }

  eliminarLiquidacion(legajoId: number, anho: number, mes: number, forzar: boolean,
                      solicitante: number | null): Observable<ResultadoProcesoResponse> {
    return this.http.delete<ResultadoProcesoResponse>(
      `${this.url}/${legajoId}/${anho}/${mes}/${forzar}`, this.headers(solicitante)
    );
  }

  registrarNovedad(legajoId: number, anho: number, mes: number, body: RegistroNovedadRequest,
                   solicitante: number | null): Observable<NovedadRegistradaResponse> {
    return this.http.post<NovedadRegistradaResponse>(
      `${this.url}/${legajoId}/${anho}/${mes}/novedad`, body, this.headers(solicitante)
    );
  }

  eliminarNovedad(legajoId: number, anho: number, mes: number, novedadId: number, forzar: boolean,
                  solicitante: number | null): Observable<ResultadoProcesoResponse> {
    return this.http.delete<ResultadoProcesoResponse>(
      `${this.url}/${legajoId}/${anho}/${mes}/novedad/${novedadId}/${forzar}`, this.headers(solicitante)
    );
  }

  /** Búsqueda de códigos para el editor de novedades (misma que usa el legacy). */
  buscarCodigos(termino: string): Observable<CodigoBusqueda[]> {
    return this.http.get<CodigoBusqueda[]>(`${this.codigoUrl}/search/${encodeURIComponent(termino)}`);
  }

  private headers(solicitante: number | null): { headers: Record<string, string> } {
    return solicitante === null
      ? { headers: {} }
      : { headers: { 'X-Legajo-Solicitante': String(solicitante) } };
  }
}
