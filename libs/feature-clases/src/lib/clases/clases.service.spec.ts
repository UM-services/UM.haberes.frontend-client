import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_URL } from '@haberes/shared-api';

import { ClasesService } from './clases.service';

describe('ClasesService', () => {
  let service: ClasesService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: '/api/haberes' },
      ],
    });
    service = TestBed.inject(ClasesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lista las clases', () => {
    let resultado: unknown;
    service.getClases().subscribe((v) => (resultado = v));

    const req = http.expectOne('/api/haberes/core/clase/');
    expect(req.request.method).toBe('GET');
    req.flush([{ claseId: 1, nombre: 'A', valorHora: 100 }]);

    expect(resultado).toEqual([{ claseId: 1, nombre: 'A', valorHora: 100 }]);
  });

  it('crea una clase con POST', () => {
    const payload = { claseId: 7, nombre: 'Nueva', valorHora: 250 };
    service.create(payload).subscribe();

    const req = http.expectOne('/api/haberes/core/clase/');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(payload);
  });

  it('actualiza por id y elimina por id', () => {
    service.update(7, { claseId: 7, nombre: 'Editada', valorHora: 300 }).subscribe();
    const put = http.expectOne('/api/haberes/core/clase/7');
    expect(put.request.method).toBe('PUT');
    put.flush({ claseId: 7, nombre: 'Editada', valorHora: 300 });

    service.delete(7).subscribe();
    const del = http.expectOne('/api/haberes/core/clase/7');
    expect(del.request.method).toBe('DELETE');
    del.flush(null);
  });
});
