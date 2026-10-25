import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

/**
 * Acceso único a los reportes del módulo Liquidación en haberes-report.
 *
 * Todos los endpoints nuevos viven bajo `/api/haberes/report/ui/**` y comparten los mismos
 * parámetros para la tabla (`data`) y las descargas (`pdf`, `xlsx`), de modo que lo que se ve
 * en pantalla y lo que se descarga salen del mismo contenido del backend.
 *
 * La API key la inyecta el gateway: el navegador no la conoce ni la envía.
 */
@Injectable({ providedIn: 'root' })
export class ConsultasReportService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/haberes/report/ui';

  /** Contenido del reporte ya calculado, para la tabla (un DTO por reporte). */
  data<T>(reporte: string, params: readonly (string | number)[]): Observable<T> {
    return this.http.get<T>(this.url(reporte, 'data', params));
  }

  /** Descarga del reporte en el formato pedido, con los mismos parámetros que la tabla. */
  descargar(
    reporte: string,
    formato: 'pdf' | 'xlsx',
    params: readonly (string | number)[]
  ): Observable<Blob> {
    return this.http.get(this.url(reporte, formato, params), { responseType: 'blob' });
  }

  /**
   * ZIP del Libro de Sueldos Digital para los legajos visibles. Va por `POST` porque el cuerpo
   * lleva la lista de legajos y no entra en el patrón de path de `descargar`.
   */
  descargarLibroSueldosDigital(
    anho: number,
    mes: number,
    legajoIds: readonly number[]
  ): Observable<Blob> {
    return this.http.post(`${this.baseUrl}/libroSueldos/lsd/${anho}/${mes}`, legajoIds, {
      responseType: 'blob'
    });
  }

  /**
   * Envío del bono de un legajo desde la pantalla por dependencia. Devuelve el mensaje de
   * negocio del report-service (`Envío de Correo Ok!!` o el error).
   */
  enviarBonoDependencia(legajoId: number, anho: number, mes: number): Observable<string> {
    return this.http.get(`${this.baseUrl}/bonoDependencia/sendBono/${legajoId}/${anho}/${mes}`, {
      responseType: 'text'
    });
  }

  /** Mensaje de negocio para un error HTTP, sin exponer detalles técnicos al usuario. */  mensajeDeError(error: unknown, porDefecto: string): string {
    if (error instanceof HttpErrorResponse && error.status === 401) {
      return 'La sesión no está autorizada para consultar reportes. Vuelva a iniciar sesión.';
    }
    return porDefecto;
  }

  private url(reporte: string, recurso: string, params: readonly (string | number)[]): string {
    const base = `${this.baseUrl}/${reporte}/${recurso}`;
    if (params.length === 0) {
      return base;
    }
    const path = params.map((valor) => encodeURIComponent(String(valor))).join('/');
    return `${base}/${path}`;
  }
}
