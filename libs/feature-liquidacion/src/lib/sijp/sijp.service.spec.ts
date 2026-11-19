import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_URL } from '@haberes/shared-api';

import { SijpResponse } from './sijp.models';
import { SijpService } from './sijp.service';

describe('SijpService', () => {
  let service: SijpService;
  let http: HttpTestingController;

  const respuesta: SijpResponse = {
    nombreArchivo: 'sijp-2026-11.txt',
    variante: 'NORMAL',
    contenido: 'bGluZWE=',
    cantidadRegistros: 1,
    omitidos: [],
    advertencias: []
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: '/api/haberes' }
      ]
    });
    service = TestBed.inject(SijpService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('pide el archivo normal del período', () => {
    let recibido: SijpResponse | null = null;
    service.generar(2026, 11, 'normal').subscribe((value) => (recibido = value));

    const req = http.expectOne('/api/haberes/core/sijp/2026/11/normal');
    expect(req.request.method).toBe('GET');
    req.flush(respuesta);

    expect(recibido).toEqual(respuesta);
  });

  it('usa la variante etec en la ruta', () => {
    service.generar(2026, 11, 'etec').subscribe();

    http.expectOne('/api/haberes/core/sijp/2026/11/etec').flush(respuesta);
  });

  it('propaga el error del backend', () => {
    let status = 0;
    service.generar(2026, 11, 'normal').subscribe({ error: (error) => (status = error.status) });

    http
      .expectOne('/api/haberes/core/sijp/2026/11/normal')
      .flush({ detail: 'No hay legajos liquidados en el período' }, { status: 422, statusText: 'Unprocessable Entity' });

    expect(status).toBe(422);
  });
});
