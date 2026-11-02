import { provideHttpClient, HttpErrorResponse } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ConsultasReportService } from './consultas-report.service';
import { TotalesGeneralesData } from './totales-generales/totales-generales.models';

describe('ConsultasReportService', () => {
  let service: ConsultasReportService;
  let http: HttpTestingController;

  const datos: TotalesGeneralesData = {
    anho: 2026,
    mes: 9,
    grupos: [{ nombre: 'Total', filas: [{ codigoId: '100', nombre: 'Sueldo', total: '1' }], subtotal: '1' }]
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ConsultasReportService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(ConsultasReportService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('data pide el DTO del reporte con los parámetros en el path', () => {
    let resultado: TotalesGeneralesData | undefined;

    service.data<TotalesGeneralesData>('totalesGenerales', [2026, 9]).subscribe((r) => (resultado = r));

    const req = http.expectOne('/api/haberes/report/ui/totalesGenerales/data/2026/9');
    expect(req.request.method).toBe('GET');
    req.flush(datos);

    expect(resultado).toEqual(datos);
  });

  it('data sin parámetros no agrega la barra final al path', () => {
    service.data<{ filas: unknown[] }>('liquidables', []).subscribe();

    http.expectOne('/api/haberes/report/ui/liquidables/data').flush({ filas: [] });
  });

  it('descargar pide el formato pedido como blob', () => {
    let resultado: Blob | undefined;

    service.descargar('totalesGenerales', 'xlsx', [2026, 9]).subscribe((r) => (resultado = r));

    const req = http.expectOne('/api/haberes/report/ui/totalesGenerales/xlsx/2026/9');
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob(['xlsx']));

    expect(resultado).toBeInstanceOf(Blob);
  });

  it('descargarLibroSueldosDigital pide el ZIP por POST con los legajos', () => {
    service.descargarLibroSueldosDigital(2026, 9, [1001, 1002]).subscribe();

    const req = http.expectOne('/api/haberes/report/ui/libroSueldos/lsd/2026/9');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual([1001, 1002]);
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob(['zip']));
  });

  it('mensajeDeError distingue el 401 del resto', () => {
    expect(service.mensajeDeError(new HttpErrorResponse({ status: 401 }), 'otro')).toContain('sesión');
    expect(service.mensajeDeError(new Error('boom'), 'otro')).toBe('otro');
  });
});
