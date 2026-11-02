import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CargosClaseActualizarService } from './cargos-clase-actualizar.service';

describe('CargosClaseActualizarService', () => {
  let service: CargosClaseActualizarService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CargosClaseActualizarService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(CargosClaseActualizarService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('dispara el recálculo de valores hora del período en el core', () => {
    service.actualizarPeriodo(2026, 8).subscribe();

    const req = http.expectOne('/api/haberes/core/cargoclasetool/update/periodo/2026/8');
    expect(req.request.method).toBe('GET');
    req.flush(null);
  });
});
