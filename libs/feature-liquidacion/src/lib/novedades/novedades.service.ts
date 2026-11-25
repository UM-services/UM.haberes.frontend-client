import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, throwError } from 'rxjs';

import { CodigoBusqueda } from '../liquidacion-individual/liquidacion-individual.models';
import {
  AcreditacionPeriodo,
  ArchivoNovedades,
  Novedad,
  NovedadPendiente,
  NovedadRequest,
  NovedadesTransferencia
} from './novedades.models';

/**
 * Cliente del slice `novedad` de haberes-core.
 *
 * La pantalla consume los endpoints que ya usaba el legacy: no hay cambios de contrato.
 * Las escrituras envían `X-Legajo-Solicitante` para la auditoría (actor e IP los resuelve
 * el backend).
 */
@Injectable({ providedIn: 'root' })
export class NovedadesService {
  private readonly http = inject(HttpClient);

  private readonly url = '/api/haberes/core';

  /** Novedades del código en el período (grilla principal). */
  novedadesPorCodigo(codigoId: number, anho: number, mes: number): Observable<Novedad[]> {
    return this.http.get<Novedad[]>(`${this.url}/novedad/codigo/${codigoId}/${anho}/${mes}`);
  }

  /**
   * Clave única lógica (legajo, período, código, dependencia).
   *
   * El alta manual siempre busca con dependencia nula. El backend responde 400 cuando no
   * existe: se traduce a `null` y el componente decide entre alta y actualización.
   */
  novedadUnica(legajoId: number, anho: number, mes: number, codigoId: number,
               dependenciaId: number | null = null): Observable<Novedad | null> {
    const dependencia = dependenciaId === null ? 'null' : String(dependenciaId);
    return this.http
      .get<Novedad>(`${this.url}/novedad/unique/${legajoId}/${anho}/${mes}/${codigoId}/${dependencia}`)
      .pipe(catchError((error: { status?: number }) => error.status === 400 ? of(null) : throwError(() => error)));
  }

  /** Filas con `importado = 1`: importadas por Excel y transferidas del mes anterior. */
  importadasDelPeriodo(anho: number, mes: number): Observable<Novedad[]> {
    return this.http.get<Novedad[]>(`${this.url}/novedad/importado/1/${anho}/${mes}`);
  }

  /** Staging de la planilla subida, pendiente de consolidar. */
  pendientesDeImportar(anho: number, mes: number): Observable<NovedadPendiente[]> {
    return this.http.get<NovedadPendiente[]>(`${this.url}/novedadupload/pendiente/${anho}/${mes}/1`);
  }

  /** Estado del período. 404 = todavía no hay registro de acreditación (período abierto). */
  acreditacionDelPeriodo(anho: number, mes: number): Observable<AcreditacionPeriodo | null> {
    return this.http
      .get<AcreditacionPeriodo>(`${this.url}/acreditacion/periodo/${anho}/${mes}`)
      .pipe(catchError((error: { status?: number }) => error.status === 404 ? of(null) : throwError(() => error)));
  }

  /** Búsqueda de códigos por id o nombre (misma que usa Liquidación Individual). */
  buscarCodigos(termino: string): Observable<CodigoBusqueda[]> {
    return this.http.get<CodigoBusqueda[]>(`${this.url}/codigo/search/${encodeURIComponent(termino)}`);
  }

  crear(novedad: NovedadRequest, solicitante: number | null): Observable<Novedad> {
    return this.http.post<Novedad>(`${this.url}/novedad/`, novedad, this.headers(solicitante));
  }

  actualizar(novedadId: number, novedad: NovedadRequest, solicitante: number | null): Observable<Novedad> {
    return this.http.put<Novedad>(`${this.url}/novedad/${novedadId}`, novedad, this.headers(solicitante));
  }

  eliminar(novedadId: number, solicitante: number | null): Observable<void> {
    return this.http.delete<void>(`${this.url}/novedad/${novedadId}`, this.headers(solicitante));
  }

  /** Baja de todo el período (todos los códigos y legajos). */
  eliminarPeriodo(anho: number, mes: number, solicitante: number | null): Observable<void> {
    return this.http.delete<void>(`${this.url}/novedad/periodo/${anho}/${mes}`, this.headers(solicitante));
  }

  /**
   * Sube la planilla al staging. El endpoint responde texto plano con las advertencias de
   * lectura (legajos inexistentes, hojas sin encabezado), por eso `responseType: 'text'`.
   */
  subirArchivo(archivo: ArchivoNovedades, anho: number, mes: number, stepByStep: boolean,
               solicitante: number | null): Observable<string> {
    return this.http.post(`${this.url}/novedadfile/upload/${anho}/${mes}/${stepByStep}`, archivo, {
      headers: this.headerMap(solicitante),
      responseType: 'text'
    });
  }

  /** Consolida el staging del período en `novedad` (409 si la clave única está duplicada). */
  importar(anho: number, mes: number, solicitante: number | null): Observable<void> {
    return this.http.get<void>(`${this.url}/novedadfile/import/${anho}/${mes}`, this.headers(solicitante));
  }

  /** Copia las novedades transferibles del mes anterior al período. */
  transferir(anho: number, mes: number, solicitante: number | null): Observable<NovedadesTransferencia> {
    return this.http.post<NovedadesTransferencia>(
      `${this.url}/novedadfile/transfer/${anho}/${mes}`, null, this.headers(solicitante));
  }

  private headers(solicitante: number | null): { headers: Record<string, string> } {
    return { headers: this.headerMap(solicitante) };
  }

  private headerMap(solicitante: number | null): Record<string, string> {
    return solicitante === null
      ? {}
      : { 'X-Legajo-Solicitante': String(solicitante) };
  }
}
