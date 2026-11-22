import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, forkJoin, map, of, throwError } from 'rxjs';

import {
  AcreditacionPeriodo,
  AsignacionEtec,
  AsignacionEtecRequest,
  CatalogosEtec,
  CategoriaEtec,
  ControlPeriodo,
  Dependencia,
  PresentismoEtec,
  PresentismoEtecRequest,
  PresentismoEtecUpdateRequest,
  PresentismoHorasEtec,
  PresentismoHorasRequest,
  PresentismoHorasUpdateRequest,
  esCargoEtec
} from './asignaciones-etec.models';

/**
 * Cliente de la pantalla Asignación de Cargos ETEC.
 *
 * Lee el catálogo de cargos del circuito ETEC (`haberes-etec`) y persiste siempre por
 * `/api/haberes/etec/asignacion-cargo`: las validaciones de cargo, fechas y solape viven
 * ahí, y `haberes-etec` es quien escribe `etec_asignacion_cargo` en core.
 *
 * Las escrituras envían `X-Legajo-Solicitante` para que core resuelva el actor de la
 * auditoría (etec lo propaga por Feign).
 */
@Injectable({ providedIn: 'root' })
export class AsignacionesEtecService {
  private readonly http = inject(HttpClient);

  private readonly cargoUrl = '/api/haberes/etec/cargo';
  private readonly asignacionUrl = '/api/haberes/etec/asignacion-cargo';
  private readonly dependenciaUrl = '/api/haberes/core/dependencia';
  private readonly controlUrl = '/api/haberes/etec/control';
  private readonly presentismoUrl = '/api/haberes/etec/presentismo';
  private readonly presentismoHorasUrl = '/api/haberes/etec/presentismo-horas';
  private readonly acreditacionUrl = '/api/haberes/core/acreditacion';

  catalogos(): Observable<CatalogosEtec> {
    return forkJoin({
      cargos: this.http.get<CategoriaEtec[]>(`${this.cargoUrl}/`),
      dependencias: this.http.get<Dependencia[]>(`${this.dependenciaUrl}/`)
    }).pipe(
      map(({ cargos, dependencias }) => ({
        cargos: cargos.filter(esCargoEtec),
        dependencias
      }))
    );
  }

  asignaciones(legajoId: number): Observable<AsignacionEtec[]> {
    return this.http.get<AsignacionEtec[]>(`${this.asignacionUrl}/legajo/${legajoId}`);
  }

  crear(body: AsignacionEtecRequest, solicitante: number | null): Observable<AsignacionEtec> {
    return this.http.post<AsignacionEtec>(`${this.asignacionUrl}/`, body, this.headers(solicitante));
  }

  actualizar(
    asignacionCargoId: number,
    body: AsignacionEtecRequest,
    solicitante: number | null
  ): Observable<AsignacionEtec> {
    return this.http.put<AsignacionEtec>(
      `${this.asignacionUrl}/${asignacionCargoId}`,
      body,
      this.headers(solicitante)
    );
  }

  eliminar(asignacionCargoId: number, solicitante: number | null): Observable<void> {
    return this.http.delete<void>(`${this.asignacionUrl}/${asignacionCargoId}`, this.headers(solicitante));
  }

  /** `200` con cuerpo vacío cuando el período todavía no tiene control ETEC cargado. */
  valorPunto(anho: number, mes: number): Observable<ControlPeriodo | null> {
    return this.http.get<ControlPeriodo | null>(`${this.controlUrl}/${anho}/${mes}/opcional`);
  }

  /** Pérdidas de presentismo registradas para el legajo en el período. */
  presentismos(legajoId: number, anho: number, mes: number): Observable<PresentismoEtec[]> {
    return this.http.get<PresentismoEtec[]>(
      `${this.presentismoUrl}/legajo/${legajoId}/periodo/${anho}/${mes}`
    );
  }

  crearPresentismo(body: PresentismoEtecRequest, solicitante: number | null): Observable<PresentismoEtec> {
    return this.http.post<PresentismoEtec>(`${this.presentismoUrl}/`, body, this.headers(solicitante));
  }

  actualizarPresentismo(
    presentismoId: number,
    body: PresentismoEtecUpdateRequest,
    solicitante: number | null
  ): Observable<PresentismoEtec> {
    return this.http.put<PresentismoEtec>(
      `${this.presentismoUrl}/${presentismoId}`,
      body,
      this.headers(solicitante)
    );
  }

  eliminarPresentismo(presentismoId: number, solicitante: number | null): Observable<void> {
    return this.http.delete<void>(`${this.presentismoUrl}/${presentismoId}`, this.headers(solicitante));
  }

  /** Estado del presentismo por horas del legajo/período (incluye si tiene cargos por horas). */
  presentismoHoras(legajoId: number, anho: number, mes: number): Observable<PresentismoHorasEtec> {
    return this.http.get<PresentismoHorasEtec>(
      `${this.presentismoHorasUrl}/legajo/${legajoId}/periodo/${anho}/${mes}`
    );
  }

  crearPresentismoHoras(
    body: PresentismoHorasRequest,
    solicitante: number | null
  ): Observable<PresentismoHorasEtec> {
    return this.http.post<PresentismoHorasEtec>(
      `${this.presentismoHorasUrl}/`,
      body,
      this.headers(solicitante)
    );
  }

  actualizarPresentismoHoras(
    presentismoHorasId: number,
    body: PresentismoHorasUpdateRequest,
    solicitante: number | null
  ): Observable<PresentismoHorasEtec> {
    return this.http.put<PresentismoHorasEtec>(
      `${this.presentismoHorasUrl}/${presentismoHorasId}`,
      body,
      this.headers(solicitante)
    );
  }

  eliminarPresentismoHoras(presentismoHorasId: number, solicitante: number | null): Observable<void> {
    return this.http.delete<void>(
      `${this.presentismoHorasUrl}/${presentismoHorasId}`,
      this.headers(solicitante)
    );
  }

  /** Estado del período. 404 = todavía no hay registro de acreditación (período abierto). */
  acreditacionDelPeriodo(anho: number, mes: number): Observable<AcreditacionPeriodo | null> {
    return this.http
      .get<AcreditacionPeriodo>(`${this.acreditacionUrl}/periodo/${anho}/${mes}`)
      .pipe(catchError((error: { status?: number }) => error.status === 404 ? of(null) : throwError(() => error)));
  }

  private headers(solicitante: number | null): { headers: Record<string, string> } {
    return solicitante === null
      ? { headers: {} }
      : { headers: { 'X-Legajo-Solicitante': String(solicitante) } };
  }
}
