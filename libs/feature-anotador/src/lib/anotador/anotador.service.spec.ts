import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AnotadorService } from './anotador.service';

describe('AnotadorService', () => {
  let service: AnotadorService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AnotadorService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(AnotadorService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('pide los pendientes por facultad, año y mes', () => {
    let resultado: unknown;
    service.getPendientes(2, 2026, 8).subscribe((v) => (resultado = v));

    const req = http.expectOne('/api/haberes/core/anotador/pendientefacultad/2/2026/8');
    expect(req.request.method).toBe('GET');
    req.flush([{ legajoId: 1 }]);

    expect(resultado).toEqual([{ legajoId: 1 }]);
  });

  it('pide los revisados por facultad, año y mes', () => {
    service.getRevisados(2, 2026, 8).subscribe();

    http.expectOne('/api/haberes/core/anotador/revisadofacultad/2/2026/8').flush([]);
  });

  it('pide el historial de anotaciones por legajo', () => {
    service.getHistorial(123).subscribe();

    http.expectOne('/api/haberes/core/anotador/legajo/123').flush([]);
  });

  it('pide la acreditación del período', () => {
    let resultado: unknown;
    service.getAcreditacion(2026, 8).subscribe((v) => (resultado = v));

    const req = http.expectOne('/api/haberes/core/acreditacion/periodo/2026/8');
    req.flush({ acreditado: false });

    expect(resultado).toEqual({ acreditado: false });
  });

  it('envía la anotación como cuerpo del POST', () => {
    const anotacion = { legajoId: 123, anho: 2026, mes: 8, tipo: 'ALTA' };
    service.addAnotacion(anotacion).subscribe();

    const req = http.expectOne('/api/haberes/core/anotador/');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(anotacion);
    req.flush({ ok: true });
  });
});
