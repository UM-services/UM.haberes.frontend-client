import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_URL } from '@haberes/shared-api';

import { AdicionalesService } from './adicionales.service';

describe('AdicionalesService', () => {
  let service: AdicionalesService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: '/api/haberes' },
      ],
    });
    service = TestBed.inject(AdicionalesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lista las tablas de adicional', () => {
    service.getTablas().subscribe();
    http.expectOne('/api/haberes/core/adicionalCursoTabla/').flush([]);
  });

  it('lista los rangos de una tabla', () => {
    service.getRangos(4).subscribe();
    http.expectOne('/api/haberes/core/adicionalCursoRango/tabla/4').flush([]);
  });

  it('agrega un rango y lo elimina por id', () => {
    const rango = { horasDesde: 1, horasHasta: 10, porcentaje: 15, adicionalCursoTablaId: 4 };
    service.addRango(rango).subscribe();
    const post = http.expectOne('/api/haberes/core/adicionalCursoRango/');
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual(rango);
    post.flush({ adicionalCursoRangoId: 8, ...rango });

    service.deleteRango(8).subscribe();
    const del = http.expectOne('/api/haberes/core/adicionalCursoRango/8');
    expect(del.request.method).toBe('DELETE');
    del.flush(null);
  });
});
