import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_URL } from '@haberes/shared-api';

import { CargosClaseService } from './cargos-clase.service';

describe('CargosClaseService', () => {
  let service: CargosClaseService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: '/api/haberes' },
      ],
    });
    service = TestBed.inject(CargosClaseService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lista cargos y clases', () => {
    service.getCargos().subscribe();
    http.expectOne('/api/haberes/core/cargoclase/').flush([]);

    service.getClases().subscribe();
    http.expectOne('/api/haberes/core/clase/').flush([]);
  });

  it('crea y actualiza por id', () => {
    const cargo = { cargoClaseId: null, nombre: 'Profesor', claseId: 2 };
    service.create(cargo).subscribe();
    const post = http.expectOne('/api/haberes/core/cargoclase/');
    expect(post.request.method).toBe('POST');
    post.flush({ ...cargo, cargoClaseId: 9 });

    service.update(9, { ...cargo, cargoClaseId: 9 }).subscribe();
    const put = http.expectOne('/api/haberes/core/cargoclase/9');
    expect(put.request.method).toBe('PUT');
    put.flush({ ...cargo, cargoClaseId: 9 });
  });

  it('pide el detalle por cargo, año y mes', () => {
    service.getDetalle(9, 2026, 10).subscribe();
    const req = http.expectOne('/api/haberes/core/cargoclasedetalle/cargoclase/9/2026/10');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });
});
