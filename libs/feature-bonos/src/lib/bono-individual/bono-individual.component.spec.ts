import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { AuthService } from '@haberes/shared-api';

import { BonoIndividualComponent, BonoPersona } from './bono-individual.component';
import { BonoImpresionResponse, IntegridadBonoResponse } from './bono.models';

describe('BonoIndividualComponent', () => {
  let component: BonoIndividualComponent;
  let httpMock: HttpTestingController;

  const persona: BonoPersona = {
    legajoId: 123,
    documento: 30123456,
    apellido: 'García',
    nombre: 'Ana'
  };

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
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { currentUser$: of({ legajoId: 999 }) } }
      ]
    });
    component = TestBed.createComponent(BonoIndividualComponent).componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('debe crearse', () => {
    expect(component).toBeTruthy();
  });

  it('carga el mail institucional del contacto al seleccionar una persona', () => {
    component.seleccionarPersona(persona);

    const req = httpMock.expectOne('/api/haberes/core/contacto/123');
    expect(req.request.method).toBe('GET');
    req.flush({ legajoId: 123, mailInstitucional: 'ana@um.edu.ar' });

    expect(component.personaSeleccionada()).toEqual(persona);
    expect(component.mailInstitucional()).toBe('ana@um.edu.ar');
  });

  it('verificarIntegridad muestra los mensajes de faltantes del core', () => {
    component.seleccionarPersona(persona);
    httpMock.expectOne('/api/haberes/core/contacto/123').flush({ legajoId: 123 });

    component.anho.set(2026);
    component.mes.set(8);
    component.verificarIntegridad();

    const req = httpMock.expectOne('/api/haberes/core/bono/123/2026/8/integridad');
    const respuesta: IntegridadBonoResponse = {
      legajoId: 123,
      anho: 2026,
      mes: 8,
      ok: false,
      faltantes: ['ITEM', 'LEGAJO_CONTROL']
    };
    req.flush(respuesta);

    expect(component.integridad()).toEqual(respuesta);
    expect(component.mensajesFaltantes()).toEqual([
      'ERROR: Falta ITEM',
      'ERROR: Falta CONTROL DE LEGAJO'
    ]);
  });

  it('imprimir recalcula la actividad, abre el PDF de /ui y audita en el core', () => {
    const openSpy = vi.spyOn(window, 'open').mockReturnValue({} as Window);
    component.seleccionarPersona(persona);
    httpMock.expectOne('/api/haberes/core/contacto/123').flush({ legajoId: 123 });

    component.anho.set(2026);
    component.mes.set(8);
    component.imprimir();

    const prepare = httpMock.expectOne('/api/haberes/core/bono/123/2026/8/prepare');
    expect(prepare.request.method).toBe('POST');
    prepare.flush({
      actividadId: 5,
      legajoId: 123,
      anho: 2026,
      mes: 8,
      docente: 1,
      otras: 0,
      clases: 0,
      dependenciaId: 10
    });

    const pdf = httpMock.expectOne('/api/haberes/report/bono/ui/generatePdf/123/2026/8');
    expect(pdf.request.responseType).toBe('blob');
    pdf.flush(new Blob(['%PDF-1.4'], { type: 'application/pdf' }));

    expect(openSpy).toHaveBeenCalled();
    expect(component.isPrinting()).toBe(false);

    // La auditoria la registra el core (IP real resuelta server-side), no el report.
    const auditoria = httpMock.expectOne('/api/haberes/core/bono/123/2026/8/auditoria');
    expect(auditoria.request.method).toBe('POST');
    expect(auditoria.request.body).toEqual({ legajoIdSolicitud: 999 });
    auditoria.flush(impresion);

    expect(component.error()).toBeNull();
    openSpy.mockRestore();
  });

  it('si el visor queda bloqueado, descarga con el nombre apellido.nombre.legajo.anho.mes.pdf', () => {
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
    let descargaNombre = '';
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(function (this: HTMLAnchorElement) {
        descargaNombre = this.download;
      });

    component.seleccionarPersona(persona);
    httpMock.expectOne('/api/haberes/core/contacto/123').flush({ legajoId: 123 });
    component.anho.set(2026);
    component.mes.set(8);
    component.imprimir();

    const prepare = httpMock.expectOne('/api/haberes/core/bono/123/2026/8/prepare');
    prepare.flush({
      actividadId: 5,
      legajoId: 123,
      anho: 2026,
      mes: 8,
      docente: 1,
      otras: 0,
      clases: 0,
      dependenciaId: 10
    });

    // El backend ya puede responder con Content-Type application/pdf; igual se fuerza.
    const pdf = httpMock.expectOne('/api/haberes/report/bono/ui/generatePdf/123/2026/8');
    pdf.flush(new Blob(['%PDF-1.4'], { type: 'application/octet-stream' }));

    const auditoria = httpMock.expectOne('/api/haberes/core/bono/123/2026/8/auditoria');
    auditoria.flush(impresion);

    expect(descargaNombre).toBe('García.Ana.123.2026.8.pdf');
    openSpy.mockRestore();
    clickSpy.mockRestore();
  });

  it('imprimir con 400 consulta la integridad y muestra los faltantes sin pedir el PDF', () => {
    component.seleccionarPersona(persona);
    httpMock.expectOne('/api/haberes/core/contacto/123').flush({ legajoId: 123 });

    const anho = component.anho();
    const mes = component.mes();
    component.imprimir();

    const prepare = httpMock.expectOne(`/api/haberes/core/bono/123/${anho}/${mes}/prepare`);
    prepare.flush({ message: 'sin liquidacion' }, { status: 400, statusText: 'Bad Request' });

    const check = httpMock.expectOne(`/api/haberes/core/bono/123/${anho}/${mes}/integridad`);
    const rechazo: IntegridadBonoResponse = {
      legajoId: 123,
      anho,
      mes,
      ok: false,
      faltantes: ['LIQUIDACION']
    };
    check.flush(rechazo);

    expect(component.integridad()).toEqual(rechazo);
    expect(component.mensajesFaltantes()).toEqual(['ERROR: Falta LIQUIDACIÓN']);
    httpMock.expectNone(`/api/haberes/report/bono/ui/generatePdf/123/${anho}/${mes}`);
  });

  it('enviar prepara el envío y muestra la respuesta del report service', () => {
    component.seleccionarPersona(persona);
    httpMock.expectOne('/api/haberes/core/contacto/123').flush({ legajoId: 123 });

    component.anho.set(2026);
    component.mes.set(8);
    component.onMailInput('ana@um.edu.ar');
    component.enviar();

    const sendPrepare = httpMock.expectOne('/api/haberes/core/bono/123/2026/8/send-prepare');
    expect(sendPrepare.request.body).toEqual({
      mailInstitucional: 'ana@um.edu.ar',
      legajoIdSolicitud: 999
    });
    sendPrepare.flush(impresion);

    const send = httpMock.expectOne('/api/haberes/report/bono/ui/sendBono/123/2026/8');
    expect(send.request.responseType).toBe('text');
    send.flush('Bono enviado correctamente');

    expect(component.exito()).toBe('Bono enviado correctamente');
    expect(component.isSending()).toBe(false);
  });

  it('no permite imprimir sin legajo seleccionado', () => {
    component.imprimir();

    expect(component.error()).toBe('Seleccione un legajo.');
    httpMock.expectNone(
      `/api/haberes/core/bono/123/${component.anho()}/${component.mes()}/prepare`
    );
  });
});
