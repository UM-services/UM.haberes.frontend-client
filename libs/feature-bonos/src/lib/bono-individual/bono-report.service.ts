import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  ActividadResponse,
  AuditoriaBonoRequest,
  BonoImpresionResponse,
  Contacto,
  IntegridadBonoResponse,
  SendBonoRequest
} from './bono.models';

// El browser no puede conocer la IP del puesto, por eso la auditoria NUNCA envia una IP:
// el core la resuelve server-side (ClientIpResolver: X-Forwarded-For -> X-Real-IP ->
// remoteAddr). Los endpoints de reporte exclusivos del front son /ui/generatePdf y
// /ui/sendBono y NO auditan (ver BonoController.java de um.haberes.report-service);
// las rutas legacy generatePdf/sendBono con {ipAddress} quedan solo para el cliente VB6.

@Injectable({ providedIn: 'root' })
export class BonoReportService {
  private readonly http = inject(HttpClient);

  private readonly bonoUrl = '/api/haberes/core/bono';
  // Encontrado en clsCtlPrint.cls: url_haberes & "api/haberes/report/bono/generatePdf" & ...
  private readonly reportBonoUrl = '/api/haberes/report/bono';
  private readonly contactoUrl = '/api/haberes/core/contacto';
  // Encontrado en modValidate.bas: validateMail llama a "api/haberes/core/tool/mailvalidate"
  private readonly toolUrl = '/api/haberes/core/tool';

  validateMail(mail: string): Observable<boolean> {
    return this.http.post<boolean>(`${this.toolUrl}/mailvalidate`, [mail]);
  }

  verificarIntegridad(legajoId: number, anho: number, mes: number): Observable<IntegridadBonoResponse> {
    return this.http.get<IntegridadBonoResponse>(`${this.bonoUrl}/${legajoId}/${anho}/${mes}/integridad`);
  }

  prepare(legajoId: number, anho: number, mes: number): Observable<ActividadResponse> {
    return this.http.post<ActividadResponse>(`${this.bonoUrl}/${legajoId}/${anho}/${mes}/prepare`, {});
  }

  downloadBonoPdf(legajoId: number, anho: number, mes: number): Observable<Blob> {
    const url = `${this.reportBonoUrl}/ui/generatePdf/${legajoId}/${anho}/${mes}`;
    return this.http.get(url, { responseType: 'blob' });
  }

  registrarAuditoria(
    legajoId: number,
    anho: number,
    mes: number,
    legajoIdSolicitud: number
  ): Observable<BonoImpresionResponse> {
    const body: AuditoriaBonoRequest = { legajoIdSolicitud };
    return this.http.post<BonoImpresionResponse>(`${this.bonoUrl}/${legajoId}/${anho}/${mes}/auditoria`, body);
  }

  sendPrepare(
    legajoId: number,
    anho: number,
    mes: number,
    request: SendBonoRequest
  ): Observable<BonoImpresionResponse> {
    return this.http.post<BonoImpresionResponse>(`${this.bonoUrl}/${legajoId}/${anho}/${mes}/send-prepare`, request);
  }

  sendBono(legajoId: number, anho: number, mes: number): Observable<string> {
    const url = `${this.reportBonoUrl}/ui/sendBono/${legajoId}/${anho}/${mes}`;
    return this.http.get(url, { responseType: 'text' });
  }

  getContacto(legajoId: number): Observable<Contacto> {
    return this.http.get<Contacto>(`${this.contactoUrl}/${legajoId}`);
  }

  getHistorialAuditoria(legajoId: number, anho: number, mes: number): Observable<BonoImpresionResponse[]> {
    return this.http.get<BonoImpresionResponse[]>(`${this.bonoUrl}/${legajoId}/${anho}/${mes}/auditoria`);
  }
}
