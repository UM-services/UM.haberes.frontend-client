import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_URL } from '@haberes/shared-api';

import { SedesService } from './sedes.service';

describe('SedesService', () => {
  let service: SedesService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: '/api/haberes' },
      ],
    });
    service = TestBed.inject(SedesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lista las sedes', () => {
    service.getSedes().subscribe();
    const req = http.expectOne('/api/haberes/core/geografica/');
    expect(req.request.method).toBe('GET');
    req.flush([{ geograficaId: 1, nombre: 'Central' }]);
  });

  it('actualiza una sede sin enviar el id en el body', () => {
    const payload = {
      nombre: 'Central',
      reducido: 'CEN',
      desarraigo: 1500,
      geograficaIdReemplazo: null,
    };
    service.update(1, payload).subscribe();

    const req = http.expectOne('/api/haberes/core/geografica/1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(payload);
    req.flush({ geograficaId: 1, ...payload });
  });
});
