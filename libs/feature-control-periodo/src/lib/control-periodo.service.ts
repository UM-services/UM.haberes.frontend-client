import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '@haberes/shared-api';

import {
  ControlEtec,
  ControlEtecRequest,
  ControlPeriodo,
  ControlPeriodoRequest,
  EscalaArraigoEtec,
  EscalaArraigoEtecRequest,
  EscalaHoraEtec,
  EscalaHoraEtecRequest,
  ModoLiquidacion,
} from './control-periodo.models';

/**
 * Único cliente HTTP de la pantalla Control del Período.
 *
 * - `getPeriodo` y `getControlEtec` usan los endpoints opcionales: devuelven `null`
 *   cuando el período todavía no tiene datos (200 con cuerpo vacío), sin confundirlo
 *   con un error.
 * - `copiarAnterior` y `copiarControlEtecAnterior` son atómicos en el backend y
 *   responden 409 si el período ya tiene datos o 404 si el mes anterior está vacío.
 * - El control ETEC (`control_etec`) es independiente del control general: guarda el
 *   valor del punto, el monto fijo y los porcentajes del circuito por puntos.
 */
@Injectable({ providedIn: 'root' })
export class ControlPeriodoService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = inject(API_URL, { optional: true }) || '/api/haberes';

  private get url(): string {
    return `${this.apiBase}/core/control`;
  }

  private get urlEtec(): string {
    return `${this.apiBase}/core/etec/control`;
  }

  private get urlArraigo(): string {
    return `${this.apiBase}/core/etec/arraigo/escala`;
  }

  private get urlHora(): string {
    return `${this.apiBase}/core/etec/hora/escala`;
  }

  getPeriodo(anho: number, mes: number): Observable<ControlPeriodo | null> {
    return this.http.get<ControlPeriodo | null>(`${this.url}/periodo/${anho}/${mes}/opcional`);
  }

  getModos(): Observable<ModoLiquidacion[]> {
    return this.http.get<ModoLiquidacion[]>(`${this.apiBase}/core/modoLiquidacion/`);
  }

  crear(control: ControlPeriodoRequest): Observable<ControlPeriodo> {
    return this.http.post<ControlPeriodo>(`${this.url}/`, control);
  }

  actualizar(control: ControlPeriodoRequest, controlId: number): Observable<ControlPeriodo> {
    return this.http.put<ControlPeriodo>(`${this.url}/${controlId}`, control);
  }

  copiarAnterior(anho: number, mes: number): Observable<ControlPeriodo> {
    return this.http.post<ControlPeriodo>(`${this.url}/copiar/${anho}/${mes}`, null);
  }

  getControlEtec(anho: number, mes: number): Observable<ControlEtec | null> {
    return this.http.get<ControlEtec | null>(`${this.urlEtec}/${anho}/${mes}/opcional`);
  }

  guardarControlEtec(
    anho: number,
    mes: number,
    control: ControlEtecRequest,
  ): Observable<ControlEtec> {
    return this.http.post<ControlEtec>(`${this.urlEtec}/${anho}/${mes}`, control);
  }

  copiarControlEtecAnterior(anho: number, mes: number): Observable<ControlEtec> {
    return this.http.post<ControlEtec>(`${this.urlEtec}/copiar/${anho}/${mes}`, null);
  }

  getEscalaArraigo(): Observable<EscalaArraigoEtec[]> {
    return this.http.get<EscalaArraigoEtec[]>(this.urlArraigo);
  }

  guardarEscalaArraigo(tramos: EscalaArraigoEtecRequest[]): Observable<EscalaArraigoEtec[]> {
    return this.http.put<EscalaArraigoEtec[]>(this.urlArraigo, tramos);
  }

  getEscalaHora(anho: number, mes: number): Observable<EscalaHoraEtec[]> {
    return this.http.get<EscalaHoraEtec[]>(`${this.urlHora}/${anho}/${mes}`);
  }

  guardarEscalaHora(
    anho: number,
    mes: number,
    tramos: EscalaHoraEtecRequest[],
  ): Observable<EscalaHoraEtec[]> {
    return this.http.put<EscalaHoraEtec[]>(`${this.urlHora}/${anho}/${mes}`, tramos);
  }
}
