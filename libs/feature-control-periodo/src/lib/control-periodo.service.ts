import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '@haberes/shared-api';

import { ControlPeriodo, ControlPeriodoRequest, ModoLiquidacion } from './control-periodo.models';

/**
 * Único cliente HTTP de la pantalla Control del Período.
 *
 * - `getPeriodo` usa el endpoint opcional: devuelve `null` cuando el período
 *   todavía no tiene datos (200 con cuerpo vacío), sin confundirlo con un error.
 * - `copiarAnterior` es atómico en el backend y responde 409 si el período ya
 *   tiene datos o 404 si el mes anterior está vacío.
 */
@Injectable({ providedIn: 'root' })
export class ControlPeriodoService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = inject(API_URL, { optional: true }) || '/api/haberes';

  private get url(): string {
    return `${this.apiBase}/core/control`;
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
}
