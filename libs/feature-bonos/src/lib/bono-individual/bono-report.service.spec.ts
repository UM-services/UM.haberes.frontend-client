import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { BonoReportService } from './bono-report.service';
import { BonoImpresionResponse, IntegridadBonoResponse } from './bono.models';

describe('BonoReportService', () => {
  let service: BonoReportService;
  let http: HttpTestingController;

  const impresion: BonoImpresionResponse = {
    bonoImpresionId: 10,
    legajoId: 123,
    anho: 2026,
    mes: 8,
    legajoIdSolicitud: 999,
    fecha: '2026-09-20T12:00:00+00',
    ipAddress: '10.0.0.5'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BonoReportService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(BonoReportService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('verificarIntegridad pide GET a /bono/{legajoId}/{anho}/{mes}/integridad', () => {
    const respuesta: IntegridadBonoResponse = {
      legajoId: 123,
      anho: 2026,
      mes: 8,
      ok: false,
      faltantes: ['ITEM', 'LEGAJO_CONTROL']
    };
    let resultado: IntegridadBonoResponse | undefined;

    service.verificarIntegridad(123, 2026, 8).subscribe((r) => (resultado = r));

    const req = http.expectOne('/api/haberes/core/bono/123/2026/8/integridad');
    expect(req.request.method).toBe('GET');
    req.flush(respuesta);

    expect(resultado).toEqual(respuesta);
  });

  it('prepare invoca el recálculo de actividad sin registrar auditoría', () => {
    let resultado: { actividadId: number } | undefined;

    service.prepare(123, 2026, 8).subscribe((r) => (resultado = r));

    const req = http.expectOne('/api/haberes/core/bono/123/2026/8/prepare');
    expect(req.request.method).toBe('POST');
    req.flush({ actividadId: 5, legajoId: 123, anho: 2026, mes: 8, docente: 1, otras: 0, clases: 0, dependenciaId: 10 });

    expect(resultado?.actividadId).toBe(5);
  });

  it('downloadBonoPdf pide el PDF al endpoint /ui/generatePdf sin IP en la URL', () => {
    const pdf = new Blob(['%PDF-1.4'], { type: 'application/pdf' });
    let resultado: Blob | undefined;

    service.downloadBonoPdf(123, 2026, 8).subscribe((r) => (resultado = r));

    const req = http.expectOne('/api/haberes/report/bono/ui/generatePdf/123/2026/8');
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');
    req.flush(pdf);

    expect(resultado).toBe(pdf);
  });

  it('registrarAuditoria audita en el core resolviendo la IP server-side', () => {
    let resultado: BonoImpresionResponse | undefined;

    service.registrarAuditoria(123, 2026, 8, 999).subscribe((r) => (resultado = r));

    const req = http.expectOne('/api/haberes/core/bono/123/2026/8/auditoria');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ legajoIdSolicitud: 999 });
    req.flush(impresion);

    expect(resultado).toEqual(impresion);
  });

  it('sendPrepare envía mail e identidad de solicitud', () => {
    let resultado: BonoImpresionResponse | undefined;

    service
      .sendPrepare(123, 2026, 8, { mailInstitucional: 'a@um.edu.ar', legajoIdSolicitud: 999 })
      .subscribe((r) => (resultado = r));

    const req = http.expectOne('/api/haberes/core/bono/123/2026/8/send-prepare');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      mailInstitucional: 'a@um.edu.ar',
      legajoIdSolicitud: 999
    });
    req.flush(impresion);

    expect(resultado).toEqual(impresion);
  });

  it('sendBono pide el envío al endpoint /ui/sendBono sin IP y espera texto plano', () => {
    let resultado: string | undefined;

    service.sendBono(123, 2026, 8).subscribe((r) => (resultado = r));

    const req = http.expectOne('/api/haberes/report/bono/ui/sendBono/123/2026/8');
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('text');
    req.flush('Bono enviado');

    expect(resultado).toBe('Bono enviado');
  });

  it('getContacto lee el mail institucional por legajo', () => {
    let resultado: { mailInstitucional?: string } | undefined;

    service.getContacto(123).subscribe((r) => (resultado = r));

    const req = http.expectOne('/api/haberes/core/contacto/123');
    expect(req.request.method).toBe('GET');
    req.flush({ legajoId: 123, mailInstitucional: 'a@um.edu.ar' });

    expect(resultado?.mailInstitucional).toBe('a@um.edu.ar');
  });

  it('validateMail consulta al tool del core con el mail en un array', () => {
    let resultado: boolean | undefined;

    service.validateMail('a@um.edu.ar').subscribe((r) => (resultado = r));

    const req = http.expectOne('/api/haberes/core/tool/mailvalidate');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(['a@um.edu.ar']);
    req.flush(true);

    expect(resultado).toBe(true);
  });

  it('getHistorialAuditoria devuelve la lista de impresiones', () => {
    let resultado: BonoImpresionResponse[] | undefined;

    service.getHistorialAuditoria(123, 2026, 8).subscribe((r) => (resultado = r));

    const req = http.expectOne('/api/haberes/core/bono/123/2026/8/auditoria');
    expect(req.request.method).toBe('GET');
    req.flush([impresion]);

    expect(resultado).toEqual([impresion]);
  });
});
