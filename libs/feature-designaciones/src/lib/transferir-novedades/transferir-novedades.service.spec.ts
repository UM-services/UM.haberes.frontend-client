import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { TransferirNovedadesService } from './transferir-novedades.service';
import { AnotacionFacultad, CargoNovedad } from './transferir-novedades.models';

describe('TransferirNovedadesService', () => {
  let service: TransferirNovedadesService;
  let http: HttpTestingController;

  const anotacion = (anotadorId = 55): AnotacionFacultad => ({
    anotadorId,
    legajoId: 1001,
    anho: 2026,
    mes: 10,
    facultadId: 2,
    anotacion: 'Licencia',
    visado: 0,
    ipVisado: null,
    user: 'facultad',
    respuesta: null,
    autorizado: 0,
    rechazado: 0,
    rectorado: 0,
    transferido: 0,
    persona: { legajoId: 1001, apellido: 'PEREZ', nombre: 'ANA' },
    facultad: { facultadId: 2, nombre: 'Ingeniería' }
  });

  const cargo = (cursoCargoNovedadId = 9): CargoNovedad => ({
    cursoCargoNovedadId,
    cursoId: 10,
    anho: 2026,
    mes: 10,
    cargoTipoId: 3,
    legajoId: 1001,
    horasSemanales: 10,
    horasTotales: 40,
    desarraigo: 0,
    alta: 1,
    baja: 0,
    cambio: 0,
    solicitud: 'Alta',
    autorizado: 0,
    rechazado: 0,
    respuesta: '',
    transferido: 0,
    curso: { cursoId: 10, nombre: 'Análisis I', facultadId: 2, geograficaId: 1 },
    cargoTipo: { cargoTipoId: 3, nombre: 'Titular' },
    persona: { legajoId: 1001, apellido: 'PEREZ', nombre: 'ANA' }
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TransferirNovedadesService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(TransferirNovedadesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('anotacionesPendientes pide las anotaciones del período', () => {
    let resultado: AnotacionFacultad[] | undefined;

    service.anotacionesPendientes(2026, 10).subscribe((r) => (resultado = r));

    const req = http.expectOne('/api/haberes/core/anotador/pendiente/2026/10');
    expect(req.request.method).toBe('GET');
    req.flush([anotacion()]);

    expect(resultado?.length).toBe(1);
  });

  it('cargosPendientes pide los cargos pendientes del período', () => {
    service.cargosPendientes(2026, 10).subscribe();

    const req = http.expectOne('/api/haberes/core/cursocargonovedad/pendiente/2026/10');
    expect(req.request.method).toBe('GET');
    req.flush([cargo()]);
  });

  it('cargosDelPeriodo pide todos los cargos del destino', () => {
    service.cargosDelPeriodo(2026, 11).subscribe();

    const req = http.expectOne('/api/haberes/core/cursocargonovedad/periodo/2026/11');
    expect(req.request.method).toBe('GET');
    req.flush([cargo()]);
  });

  it('moverAnotacion hace PUT con el período destino, transferido y el solicitante', () => {
    service.moverAnotacion(anotacion(), 2026, 11, 999).subscribe();

    const req = http.expectOne('/api/haberes/core/anotador/55');
    expect(req.request.method).toBe('PUT');
    expect(req.request.headers.get('X-Legajo-Solicitante')).toBe('999');
    expect(req.request.body).toEqual({
      legajoId: 1001,
      anho: 2026,
      mes: 11,
      facultadId: 2,
      anotacion: 'Licencia',
      visado: 0,
      ipVisado: null,
      user: 'facultad',
      respuesta: null,
      autorizado: 0,
      rechazado: 0,
      rectorado: 0,
      transferido: 1
    });
    expect(req.request.body.persona).toBeUndefined();
    expect(req.request.body.facultad).toBeUndefined();
    req.flush(anotacion());
  });

  it('crearCargo hace POST con escalares, sin id ni objetos embebidos', () => {
    service.crearCargo(cargo(), 2026, 11, 999).subscribe();

    const req = http.expectOne('/api/haberes/core/cursocargonovedad/');
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('X-Legajo-Solicitante')).toBe('999');
    expect(req.request.body).toEqual({
      cursoId: 10,
      anho: 2026,
      mes: 11,
      cargoTipoId: 3,
      legajoId: 1001,
      horasSemanales: 10,
      horasTotales: 40,
      desarraigo: 0,
      alta: 1,
      baja: 0,
      cambio: 0,
      solicitud: 'Alta',
      autorizado: 0,
      rechazado: 0,
      respuesta: '',
      transferido: 1
    });
    expect(req.request.body.cursoCargoNovedadId).toBeUndefined();
    expect(req.request.body.curso).toBeUndefined();
    expect(req.request.body.persona).toBeUndefined();
    req.flush(cargo());
  });

  it('acreditacionDelPeriodo devuelve el estado del período', () => {
    let resultado: unknown;

    service.acreditacionDelPeriodo(2026, 11).subscribe((r) => (resultado = r));

    const req = http.expectOne('/api/haberes/core/acreditacion/periodo/2026/11');
    expect(req.request.method).toBe('GET');
    req.flush({ acreditacionId: 1, anho: 2026, mes: 11, acreditado: 0, limiteNovedades: null });

    expect(resultado).toMatchObject({ acreditado: 0 });
  });

  it('acreditacionDelPeriodo traduce el 404 a null (período abierto)', () => {
    let resultado: unknown = 'sin respuesta';

    service.acreditacionDelPeriodo(2026, 11).subscribe((r) => (resultado = r));

    http.expectOne('/api/haberes/core/acreditacion/periodo/2026/11')
      .flush({ message: 'No existe' }, { status: 404, statusText: 'Not Found' });

    expect(resultado).toBeNull();
  });

  it('acreditacionDelPeriodo propaga los errores que no son 404', () => {
    let status: number | undefined;

    service.acreditacionDelPeriodo(2026, 11).subscribe({
      error: (error: { status: number }) => (status = error.status)
    });

    http.expectOne('/api/haberes/core/acreditacion/periodo/2026/11')
      .flush({ message: 'Error' }, { status: 500, statusText: 'Server Error' });

    expect(status).toBe(500);
  });
});
