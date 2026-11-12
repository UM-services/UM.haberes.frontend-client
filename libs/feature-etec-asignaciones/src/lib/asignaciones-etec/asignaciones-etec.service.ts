import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';

import {
  AsignacionEtec,
  AsignacionEtecRequest,
  CatalogosEtec,
  CategoriaEtec,
  ControlPeriodo,
  Dependencia,
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
  private readonly controlUrl = '/api/haberes/core/control';

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

  /** `200` con cuerpo vacío cuando el período todavía no tiene control cargado. */
  valorPunto(anho: number, mes: number): Observable<ControlPeriodo | null> {
    return this.http.get<ControlPeriodo | null>(`${this.controlUrl}/periodo/${anho}/${mes}/opcional`);
  }

  private headers(solicitante: number | null): { headers: Record<string, string> } {
    return solicitante === null
      ? { headers: {} }
      : { headers: { 'X-Legajo-Solicitante': String(solicitante) } };
  }
}
