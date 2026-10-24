import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Anotaciones de las facultades.
 *
 * El módulo Novedades trabaja por facultad (la de la sesión); el módulo
 * Liquidación es global y consulta el período completo, además de visar
 * (autorizar / rechazar) las anotaciones pendientes.
 */
@Injectable({ providedIn: 'root' })
export class AnotadorService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/haberes/core/anotador';
  private readonly acreditacionUrl = '/api/haberes/core/acreditacion';
  private readonly reportUrl = '/api/haberes/report/anotador';

  getPendientes(facultadId: number, anho: number, mes: number): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl + '/pendientefacultad/' + facultadId + '/' + anho + '/' + mes);
  }

  getRevisados(facultadId: number, anho: number, mes: number): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl + '/revisadofacultad/' + facultadId + '/' + anho + '/' + mes);
  }

  /** Pendientes de todas las facultades (módulo global). */
  getPendientesPeriodo(anho: number, mes: number): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl + '/pendiente/' + anho + '/' + mes);
  }

  /** Revisadas de todas las facultades (módulo global). */
  getRevisadosPeriodo(anho: number, mes: number): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl + '/revisado/' + anho + '/' + mes);
  }

  getHistorial(legajoId: number): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl + '/legajo/' + legajoId);
  }

  getAcreditacion(anho: number, mes: number): Observable<any> {
    return this.http.get<any>(this.acreditacionUrl + '/periodo/' + anho + '/' + mes);
  }

  addAnotacion(anotacion: any): Observable<any> {
    return this.http.post<any>(this.baseUrl + '/', anotacion);
  }

  /**
   * Visa la anotación (autorizar o rechazar) con la respuesta del revisor.
   * La IP del puesto la resuelve el servidor: el browser no la conoce.
   */
  visar(anotadorId: number, autorizado: boolean, respuesta: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/visar/${anotadorId}`, { autorizado, respuesta });
  }

  downloadPendientesReport(facultadId: number, anho: number, mes: number): Observable<Blob> {
    return this.http.get(`${this.reportUrl}/anotadorPendientes/${facultadId}/${anho}/${mes}`, { responseType: 'blob' });
  }

  downloadRevisadosReport(facultadId: number, anho: number, mes: number): Observable<Blob> {
    return this.http.get(`${this.reportUrl}/anotadorAutorizadosRechazados/${facultadId}/${anho}/${mes}`, { responseType: 'blob' });
  }

  /** Reporte consolidado de pendientes (módulo global). */
  downloadPendientesPeriodoReport(anho: number, mes: number): Observable<Blob> {
    return this.http.get(`${this.reportUrl}/anotadorPendientes/periodo/${anho}/${mes}`, { responseType: 'blob' });
  }

  /** Reporte consolidado de autorizados y rechazados (módulo global). */
  downloadRevisadosPeriodoReport(anho: number, mes: number): Observable<Blob> {
    return this.http.get(`${this.reportUrl}/anotadorAutorizadosRechazados/periodo/${anho}/${mes}`, { responseType: 'blob' });
  }
}
