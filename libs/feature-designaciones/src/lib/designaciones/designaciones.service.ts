import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  CargoLiquidacion,
  CargoTipo,
  Categoria,
  CursoCargo,
  CursoFusion,
  Dependencia,
  DesignacionTipo,
  Facultad,
  Geografica,
  Novedad
} from './designaciones.models';

/**
 * Datos del control de designaciones de un docente.
 *
 * El módulo Liquidación es global (sin facultad): usa los endpoints por legajo.
 * El módulo Novedades es de facultad: usa los endpoints filtrados por
 * `facultadId`. La pantalla decide el modo y esta clase arma la URL.
 *
 * La búsqueda de personas NO vive acá: todas las pantallas usan el buscador
 * estándar (ui-persona-search + PersonaSearchService).
 */
@Injectable({ providedIn: 'root' })
export class DesignacionesService {
  private readonly http = inject(HttpClient);

  private readonly cursoCargoUrl = '/api/haberes/core/cursoCargo';
  private readonly cursoFusionUrl = '/api/haberes/core/cursofusion';
  private readonly cargoLiquidacionUrl = '/api/haberes/core/cargoliquidacion';
  private readonly novedadUrl = '/api/haberes/core/novedad';
  private readonly toolUrl = '/api/haberes/core/designaciontool';
  private readonly reportUrl = '/api/haberes/report/designacionesDetalle';

  private readonly facultadUrl = '/api/haberes/core/facultad';
  private readonly geograficaUrl = '/api/haberes/core/geografica';
  private readonly dependenciaUrl = '/api/haberes/core/dependencia';
  private readonly categoriaUrl = '/api/haberes/core/categoria';
  private readonly cargoTipoUrl = '/api/haberes/core/cargotipo';
  private readonly designacionTipoUrl = '/api/haberes/core/designaciontipo';

  /** Cursos asignados: sin facultad recorre todas las facultades del docente. */
  getCursosCargo(legajoId: number, anho: number, mes: number, facultadId: number | null): Observable<CursoCargo[]> {
    const url =
      facultadId === null
        ? `${this.cursoCargoUrl}/legajo/${legajoId}/${anho}/${mes}`
        : `${this.cursoCargoUrl}/facultad/${legajoId}/${anho}/${mes}/${facultadId}`;
    return this.http.get<CursoCargo[]>(url);
  }

  /** Designaciones fusionadas: mismo criterio de facultad que los cursos. */
  getCursosFusion(legajoId: number, anho: number, mes: number, facultadId: number | null): Observable<CursoFusion[]> {
    const url =
      facultadId === null
        ? `${this.cursoFusionUrl}/legajo/${legajoId}/${anho}/${mes}`
        : `${this.cursoFusionUrl}/legajofacultad/${legajoId}/${anho}/${mes}/${facultadId}`;
    return this.http.get<CursoFusion[]>(url);
  }

  /** Cargos docentes efectivamente liquidados en el período indicado. */
  getCargoLiquidacionDocente(legajoId: number, anho: number, mes: number): Observable<CargoLiquidacion[]> {
    return this.http.get<CargoLiquidacion[]>(
      `${this.cargoLiquidacionUrl}/legajodocente/${legajoId}/${anho}/${mes}`
    );
  }

  /**
   * Diferencia de designaciones del período: novedad de código 27 sin
   * dependencia. El backend responde 400 cuando no existe, así que el
   * llamador debe tratar el error como "sin diferencia".
   */
  getDiferenciaDesignaciones(legajoId: number, anho: number, mes: number): Observable<Novedad> {
    return this.http.get<Novedad>(`${this.novedadUrl}/unique/${legajoId}/${anho}/${mes}/27/null`);
  }

  /** Recalcula designación/categoría de los cursos del legajo. */
  redesignar(legajoId: number, anho: number, mes: number): Observable<void> {
    return this.http.get<void>(`${this.toolUrl}/redesignarbylegajo/${legajoId}/${anho}/${mes}`);
  }

  /**
   * Re-fusión completa del legajo (reset + fusionar + desarraigo) en una sola
   * operación de servidor. `forzar` re-fusiona un legajo ya fusionado.
   */
  fusionar(legajoId: number, anho: number, mes: number, forzar: boolean): Observable<void> {
    return this.http.post<void>(`${this.toolUrl}/fusionar/${legajoId}/${anho}/${mes}`, { forzar });
  }

  /** Detalle de designaciones del legajo en PDF (salida oficial del control). */
  descargarDetalle(legajoId: number, anho: number, mes: number): Observable<Blob> {
    return this.http.get(`${this.reportUrl}/${legajoId}/${anho}/${mes}`, { responseType: 'blob' });
  }

  // --- Catálogos (una sola carga por pantalla) ---

  getFacultades(): Observable<Facultad[]> {
    return this.http.get<Facultad[]>(`${this.facultadUrl}/`);
  }

  getGeograficas(): Observable<Geografica[]> {
    return this.http.get<Geografica[]>(`${this.geograficaUrl}/`);
  }

  getDependencias(): Observable<Dependencia[]> {
    return this.http.get<Dependencia[]>(`${this.dependenciaUrl}/`);
  }

  getCategorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.categoriaUrl}/`);
  }

  getCargoTipos(): Observable<CargoTipo[]> {
    return this.http.get<CargoTipo[]>(`${this.cargoTipoUrl}/`);
  }

  getDesignacionTipos(): Observable<DesignacionTipo[]> {
    return this.http.get<DesignacionTipo[]>(`${this.designacionTipoUrl}/`);
  }
}
