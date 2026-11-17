import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_URL } from '@haberes/shared-api';

import { Formulario931Service } from './formulario-931.service';
import { SeguridadSocial, SeguridadSocialRequest } from './formulario-931.models';

describe('Formulario931Service', () => {
  let service: Formulario931Service;
  let http: HttpTestingController;

  const periodo: SeguridadSocial = {
    seguridadSocialId: 7,
    anho: 2026,
    mes: 11,
    cc351: 100,
    cc301: 200,
    cc352: 300,
    cc302: 400,
    cc312: 500,
    cc028: 600,
    created: '2026-11-01T10:00:00+0000',
    updated: '2026-11-02T10:00:00+0000',
  };

  const payload: SeguridadSocialRequest = {
    anho: 2026,
    mes: 11,
    cc351: 100,
    cc301: 200,
    cc352: 300,
    cc302: 400,
    cc312: 500,
    cc028: 600,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: '/api/haberes' },
      ],
    });
    service = TestBed.inject(Formulario931Service);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('consulta el período por el endpoint opcional', () => {
    let resultado: SeguridadSocial | null | undefined;
    service.getPeriodo(2026, 11).subscribe((valor) => (resultado = valor));

    const request = http.expectOne(
      '/api/haberes/core/seguridadSocial/unique/2026/11/opcional',
    );
    expect(request.request.method).toBe('GET');
    request.flush(periodo);

    expect(resultado).toEqual(periodo);
  });

  it('devuelve null cuando el período todavía no tiene datos', () => {
    let resultado: SeguridadSocial | null | undefined = periodo;
    service.getPeriodo(2026, 1).subscribe((valor) => (resultado = valor));

    http.expectOne('/api/haberes/core/seguridadSocial/unique/2026/1/opcional').flush(null);

    expect(resultado).toBeNull();
  });

  it('crea el período con un POST del payload completo', () => {
    service.crear(payload).subscribe();

    const request = http.expectOne('/api/haberes/core/seguridadSocial/');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
    request.flush(periodo);
  });

  it('actualiza el período con el id en la ruta y sin id en el cuerpo', () => {
    service.actualizar(payload, 7).subscribe();

    const request = http.expectOne('/api/haberes/core/seguridadSocial/7');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(payload);
    expect(request.request.body.seguridadSocialId).toBeUndefined();
    request.flush(periodo);
  });
});
