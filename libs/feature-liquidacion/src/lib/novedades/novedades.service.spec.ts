import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { NovedadesService } from './novedades.service';
import { AcreditacionPeriodo, Novedad, NovedadPendiente } from './novedades.models';

describe('NovedadesService', () => {
  let service: NovedadesService;
  let http: HttpTestingController;

  const novedad: Novedad = {
    novedadId: 77,
    legajoId: 1001,
    anho: 2026,
    mes: 11,
    codigoId: 27,
    dependenciaId: null,
    importe: 1500.5,
    value: null,
    observaciones: 'obs',
    importado: 0,
    novedadUploadId: null,
    persona: { legajoId: 1001, apellido: 'PEREZ', nombre: 'ANA' },
    codigo: { codigoId: 27, nombre: 'PRESENTISMO' },
    dependencia: null
  };

  const pendiente: NovedadPendiente = {
    novedadUploadId: 9,
    legajoId: 1001,
    anho: 2026,
    mes: 11,
    codigoId: 27,
    dependenciaId: null,
    importe: 100,
    value: null,
    pendiente: 1,
    persona: null,
    codigo: null,
    dependencia: null
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NovedadesService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(NovedadesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('novedadesPorCodigo pide las novedades del código y período', () => {
    let resultado: Novedad[] | undefined;

    service.novedadesPorCodigo(27, 2026, 11).subscribe((r) => (resultado = r));

    const req = http.expectOne('/api/haberes/core/novedad/codigo/27/2026/11');
    expect(req.request.method).toBe('GET');
    req.flush([novedad]);

    expect(resultado?.length).toBe(1);
  });

  it('novedadUnica usa el literal null en la dependencia', () => {
    service.novedadUnica(1001, 2026, 11, 27).subscribe();

    const req = http.expectOne('/api/haberes/core/novedad/unique/1001/2026/11/27/null');
    expect(req.request.method).toBe('GET');
    req.flush(novedad);
  });

  it('novedadUnica traduce el 400 a null', () => {
    let resultado: Novedad | null | undefined = undefined;

    service.novedadUnica(1001, 2026, 11, 27).subscribe((r) => (resultado = r));

    http.expectOne('/api/haberes/core/novedad/unique/1001/2026/11/27/null')
      .flush({ message: 'No existe' }, { status: 400, statusText: 'Bad Request' });

    expect(resultado).toBeNull();
  });

  it('novedadUnica propaga los errores que no son 400', () => {
    let status: number | undefined;

    service.novedadUnica(1001, 2026, 11, 27).subscribe({
      error: (error: { status: number }) => (status = error.status)
    });

    http.expectOne('/api/haberes/core/novedad/unique/1001/2026/11/27/null')
      .flush({ message: 'Duplicada' }, { status: 500, statusText: 'Server Error' });

    expect(status).toBe(500);
  });

  it('crear envía el body completo y el legajo solicitante', () => {
    service.crear({
      legajoId: 1001,
      anho: 2026,
      mes: 11,
      codigoId: 27,
      dependenciaId: null,
      importe: 0,
      value: 'S',
      observaciones: '',
      importado: 0,
      novedadUploadId: null
    }, 999).subscribe();

    const req = http.expectOne('/api/haberes/core/novedad/');
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('X-Legajo-Solicitante')).toBe('999');
    expect(req.request.body).toEqual({
      legajoId: 1001,
      anho: 2026,
      mes: 11,
      codigoId: 27,
      dependenciaId: null,
      importe: 0,
      value: 'S',
      observaciones: '',
      importado: 0,
      novedadUploadId: null
    });
    req.flush(novedad, { status: 201, statusText: 'Created' });
  });

  it('actualizar usa el novedadId y el header', () => {
    service.actualizar(77, {
      legajoId: 1001,
      anho: 2026,
      mes: 11,
      codigoId: 27,
      dependenciaId: null,
      importe: 100,
      value: '',
      observaciones: '',
      importado: 1,
      novedadUploadId: 55
    }, 999).subscribe();

    const req = http.expectOne('/api/haberes/core/novedad/77');
    expect(req.request.method).toBe('PUT');
    expect(req.request.headers.get('X-Legajo-Solicitante')).toBe('999');
    expect(req.request.body.importado).toBe(1);
    expect(req.request.body.novedadUploadId).toBe(55);
    req.flush(novedad);
  });

  it('eliminar y eliminarPeriodo usan DELETE', () => {
    service.eliminar(77, 999).subscribe();
    const baja = http.expectOne('/api/haberes/core/novedad/77');
    expect(baja.request.method).toBe('DELETE');
    baja.flush(null, { status: 204, statusText: 'No Content' });

    service.eliminarPeriodo(2026, 11, 999).subscribe();
    const periodo = http.expectOne('/api/haberes/core/novedad/periodo/2026/11');
    expect(periodo.request.method).toBe('DELETE');
    expect(periodo.request.headers.get('X-Legajo-Solicitante')).toBe('999');
    periodo.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('importadas y pendientes leen por período', () => {
    service.importadasDelPeriodo(2026, 11).subscribe();
    const importadas = http.expectOne('/api/haberes/core/novedad/importado/1/2026/11');
    expect(importadas.request.method).toBe('GET');
    importadas.flush([novedad]);

    service.pendientesDeImportar(2026, 11).subscribe();
    const pendientes = http.expectOne('/api/haberes/core/novedadupload/pendiente/2026/11/1');
    expect(pendientes.request.method).toBe('GET');
    pendientes.flush([pendiente]);
  });

  it('subirArchivo envía filename/base64 y pide texto plano', () => {
    let texto: string | undefined;

    service.subirArchivo({ filename: 'novedades.xlsx', base64: 'AAA' }, 2026, 11, false, 999)
      .subscribe((r) => (texto = r));

    const req = http.expectOne('/api/haberes/core/novedadfile/upload/2026/11/false');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ filename: 'novedades.xlsx', base64: 'AAA' });
    expect(req.request.responseType).toBe('text');
    expect(req.request.headers.get('X-Legajo-Solicitante')).toBe('999');
    req.flush('Legajo= 99 inexistente');

    expect(texto).toBe('Legajo= 99 inexistente');
  });

  it('importar y transferir son GET del período', () => {
    service.importar(2026, 11, 999).subscribe();
    const importar = http.expectOne('/api/haberes/core/novedadfile/import/2026/11');
    expect(importar.request.method).toBe('GET');
    expect(importar.request.headers.get('X-Legajo-Solicitante')).toBe('999');
    importar.flush(null, { status: 204, statusText: 'No Content' });

    service.transferir(2026, 11, 999).subscribe();
    const transferir = http.expectOne('/api/haberes/core/novedadfile/transfer/2026/11');
    expect(transferir.request.method).toBe('GET');
    transferir.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('acreditacionDelPeriodo traduce el 404 a período abierto', () => {
    let resultado: AcreditacionPeriodo | null | undefined = undefined;

    service.acreditacionDelPeriodo(2026, 11).subscribe((r) => (resultado = r));

    http.expectOne('/api/haberes/core/acreditacion/periodo/2026/11')
      .flush({ message: 'No existe' }, { status: 404, statusText: 'Not Found' });

    expect(resultado).toBeNull();
  });

  it('buscarCodigos codifica el término', () => {
    service.buscarCodigos('presentismo extra').subscribe();

    const req = http.expectOne('/api/haberes/core/codigo/search/presentismo%20extra');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });
});
