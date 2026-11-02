import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_URL } from '@haberes/shared-api';

import { PersonasService, fechaInput, fechaPayload } from './personas.service';

describe('PersonasService', () => {
  let service: PersonasService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: '/api/haberes' },
      ],
    });
    service = TestBed.inject(PersonasService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('envía sólo los campos modificados por PATCH', () => {
    service.patchPersona(7, { apellido: 'Gómez' }).subscribe();

    const req = http.expectOne('/api/haberes/core/persona/7');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ apellido: 'Gómez' });
    req.flush({ legajoId: 7, apellido: 'Gómez' });
  });

  it('devuelve null cuando la persona no tiene contacto', () => {
    let resultado: unknown = 'pendiente';
    service.getContacto(7).subscribe((v) => (resultado = v));

    http
      .expectOne('/api/haberes/core/contacto/7')
      .flush({ detail: 'not found' }, { status: 404, statusText: 'Not Found' });

    expect(resultado).toBeNull();
  });

  it('crea o actualiza el contacto según exista', () => {
    const contacto = {
      legajoId: 7,
      fijo: '1',
      movil: '2',
      mailPersonal: 'a@b.c',
      mailInstitucional: '',
    };

    service.saveContacto(contacto, false).subscribe();
    const post = http.expectOne('/api/haberes/core/contacto/');
    expect(post.request.method).toBe('POST');
    post.flush(contacto);

    service.saveContacto(contacto, true).subscribe();
    const put = http.expectOne('/api/haberes/core/contacto/7');
    expect(put.request.method).toBe('PUT');
    put.flush(contacto);
  });

  it('pide CBU, antigüedad y cálculo por legajo y período', () => {
    service.getLegajosBanco(7).subscribe();
    http.expectOne('/api/haberes/core/legajobanco/legajo/7').flush([]);

    service.getAntiguedad(7, 2026, 10).subscribe();
    http.expectOne('/api/haberes/core/antiguedad/last/7/2026/10').flush({});

    service.calcularAntiguedad(7, 2026, 10).subscribe();
    http.expectOne('/api/haberes/core/antiguedad/calculate/7/2026/10').flush(null);
  });
});

describe('helpers de fecha', () => {
  it('extrae la fecha para el input', () => {
    expect(fechaInput('1980-05-12T03:00:00+0000')).toBe('1980-05-12');
    expect(fechaInput(null)).toBe('');
  });

  it('conserva horario y offset al reconstruir el payload', () => {
    expect(fechaPayload('1980-05-12T03:00:00+0000', '1980-06-01')).toBe('1980-06-01T03:00:00+0000');
    expect(fechaPayload(null, '1980-06-01')).toBe('1980-06-01T00:00:00+0000');
    expect(fechaPayload('1980-05-12T03:00:00-03:00', '1980-06-01')).toBe(
      '1980-06-01T03:00:00-0300',
    );
  });
});
