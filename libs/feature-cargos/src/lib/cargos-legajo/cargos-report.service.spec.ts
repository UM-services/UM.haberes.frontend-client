import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CargosReportService } from './cargos-report.service';

describe('CargosReportService', () => {
  let service: CargosReportService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CargosReportService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(CargosReportService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('descarga el detalle de cargos como blob del servicio report', () => {
    service
      .downloadCargosReport(123, 2026, 8, 2)
      .subscribe();

    const req = http.expectOne('/api/haberes/report/bono/detalleCargos/123/2026/8/2');
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob(['pdf']));
  });

  it('descarga el reporte de docentes por sede como blob', () => {
    service
      .downloadDocentesSedeReport(2, 5, 2026, 8)
      .subscribe();

    const req = http.expectOne('/api/haberes/report/docentes/docentesSede/2/5/2026/8');
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob(['pdf']));
  });

  it('pide las geográficas al core', () => {
    let resultado: unknown;
    service.getGeograficas().subscribe((v) => (resultado = v));

    const req = http.expectOne('/api/haberes/core/geografica/');
    req.flush([{ geograficaId: 1, nombre: 'Sede Central' }]);

    expect(resultado).toEqual([{ geograficaId: 1, nombre: 'Sede Central' }]);
  });
});
