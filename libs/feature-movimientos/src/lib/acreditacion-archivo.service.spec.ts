import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AcreditacionArchivoService } from './acreditacion-archivo.service';
import { ArchivoAcreditacionRequest } from './movimientos.models';

describe('AcreditacionArchivoService', () => {
  let service: AcreditacionArchivoService;
  let httpMock: HttpTestingController;

  const base = '/api/haberes';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AcreditacionArchivoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('genera el archivo del banco indicado con el body completo', () => {
    const request: ArchivoAcreditacionRequest = {
      anho: 2026,
      mes: 11,
      fechaPago: '2026-11-30',
      numEnvio: 3,
      salida: 'A',
      dependenciaId: 7,
      cci: true,
      individual: false,
    };

    service.generar('otrosbancos', request).subscribe();

    const peticion = httpMock.expectOne(`${base}/core/acreditacion/archivo/otrosbancos`);
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toEqual(request);
    peticion.flush({
      nombreArchivo: 'otrosbancos-2026-11-cci.txt',
      contenido: 'SEFE',
      cantidad: 1,
      total: 100,
      periodoAcreditado: true,
      rechazos: [],
    });
  });

  it('prepara un legajo puntual', () => {
    service.prepararLegajo(123, 2026, 11).subscribe();

    const peticion = httpMock.expectOne(`${base}/core/legajobanco/preparar/123/2026/11`);
    expect(peticion.request.method).toBe('POST');
    peticion.flush({ anho: 2026, mes: 11, filas: [], sinCbu: [], sinLiquidacion: [] });
  });

  it('prepara el período completo', () => {
    service.prepararPeriodo(2026, 11).subscribe();

    const peticion = httpMock.expectOne(`${base}/core/legajobanco/preparar/2026/11`);
    expect(peticion.request.method).toBe('POST');
    peticion.flush({ anho: 2026, mes: 11, filas: [], sinCbu: [], sinLiquidacion: [] });
  });

  it('elimina los CBUs del período', () => {
    service.eliminarPeriodo(2026, 11).subscribe();

    const peticion = httpMock.expectOne(`${base}/core/legajobanco/periodo/2026/11`);
    expect(peticion.request.method).toBe('DELETE');
    peticion.flush(null);
  });
});
