import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { AuthService } from '@haberes/shared-api';

import { TransferirNovedadesComponent } from './transferir-novedades.component';
import { AnotacionFacultad, CargoNovedad } from './transferir-novedades.models';

describe('TransferirNovedadesComponent', () => {
  let fixture: ComponentFixture<TransferirNovedadesComponent>;
  let component: TransferirNovedadesComponent;
  let httpMock: HttpTestingController;

  const anotacion = (legajoId: number, anotadorId = legajoId): AnotacionFacultad => ({
    anotadorId,
    legajoId,
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
    persona: { legajoId, apellido: 'PEREZ', nombre: 'ANA' },
    facultad: { facultadId: 2, nombre: 'Ingeniería' }
  });

  const cargo = (legajoId: number, cursoId: number, cargoTipoId: number): CargoNovedad => ({
    cursoCargoNovedadId: legajoId + cursoId,
    cursoId,
    anho: 2026,
    mes: 10,
    cargoTipoId,
    legajoId,
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
    curso: { cursoId, nombre: `Curso ${cursoId}`, facultadId: 2, geograficaId: 1 },
    cargoTipo: { cargoTipoId, nombre: `Cargo ${cargoTipoId}` },
    persona: { legajoId, apellido: 'PEREZ', nombre: 'ANA' }
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { currentUser$: of({ legajoId: 999 }) } }
      ]
    });
    fixture = TestBed.createComponent(TransferirNovedadesComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    vi.restoreAllMocks();
  });

  const flushPeriodo = (opciones: {
    anotacionesOrigen?: AnotacionFacultad[];
    cargosOrigen?: CargoNovedad[];
    cargosDestino?: CargoNovedad[];
    anotacionesDestino?: AnotacionFacultad[];
    destinoAcreditado?: number;
    origenAcreditado?: number;
    destinoError?: boolean;
    origenError?: boolean;
  } = {}): void => {
    const destinoAnho = component.anho();
    const destinoMes = component.mes();
    const origen = component.origen();

    httpMock.expectOne(`/api/haberes/core/anotador/pendiente/${origen.anho}/${origen.mes}`)
      .flush(opciones.anotacionesOrigen ?? []);
    httpMock.expectOne(`/api/haberes/core/cursocargonovedad/pendiente/${origen.anho}/${origen.mes}`)
      .flush(opciones.cargosOrigen ?? []);
    httpMock.expectOne(`/api/haberes/core/cursocargonovedad/periodo/${destinoAnho}/${destinoMes}`)
      .flush(opciones.cargosDestino ?? []);
    httpMock.expectOne(`/api/haberes/core/anotador/pendiente/${destinoAnho}/${destinoMes}`)
      .flush(opciones.anotacionesDestino ?? []);

    const destino = httpMock.expectOne(`/api/haberes/core/acreditacion/periodo/${destinoAnho}/${destinoMes}`);
    if (opciones.destinoError) {
      destino.flush({ message: 'Error' }, { status: 500, statusText: 'Server Error' });
    } else {
      destino.flush({
        acreditacionId: 1,
        anho: destinoAnho,
        mes: destinoMes,
        acreditado: opciones.destinoAcreditado ?? 0,
        limiteNovedades: null
      });
    }

    const origenHttp = httpMock.expectOne(`/api/haberes/core/acreditacion/periodo/${origen.anho}/${origen.mes}`);
    if (opciones.origenError) {
      origenHttp.flush({ message: 'Error' }, { status: 500, statusText: 'Server Error' });
    } else {
      origenHttp.flush({
        acreditacionId: 2,
        anho: origen.anho,
        mes: origen.mes,
        acreditado: opciones.origenAcreditado ?? 0,
        limiteNovedades: null
      });
    }
  };

  it('usa el mes actual y el mes anterior como origen', () => {
    const hoy = new Date();

    expect(component.anho()).toBe(hoy.getFullYear());
    expect(component.mes()).toBe(hoy.getMonth() + 1);
  });

  it('calcula el origen con cruce de año', () => {
    component.anho.set(2026);
    component.mes.set(1);

    expect(component.origen()).toEqual({ anho: 2025, mes: 12 });
    expect(component.textoOrigen()).toBe('12/2025');
  });

  it('carga los conteos del origen y las claves del destino', () => {
    const cargoCompartido = cargo(1001, 10, 3);
    fixture.detectChanges();

    flushPeriodo({
      anotacionesOrigen: [anotacion(1001, 55), anotacion(1002, 56)],
      cargosOrigen: [cargoCompartido, cargo(1002, 10, 3)],
      cargosDestino: [cargoCompartido],
      anotacionesDestino: [anotacion(1001, 77)]
    });

    expect(component.anotacionesOrigen().length).toBe(2);
    expect(component.cargosOrigen().length).toBe(2);
    expect(component.cargosNuevos().length).toBe(1);
    expect(component.cargosExistentes()).toBe(1);
    expect(component.duplicadosAnotador()).toBe(1);
    expect(component.acreditacionVerificada()).toBe(true);
  });

  it('recarga los dos períodos al cambiar de mes', () => {
    fixture.detectChanges();
    flushPeriodo();

    component.cambiarMes(1);
    flushPeriodo();

    expect(component.acreditacionVerificada()).toBe(true);
  });

  it('bloquea las acciones cuando el período destino está acreditado', () => {
    fixture.detectChanges();
    flushPeriodo({ anotacionesOrigen: [anotacion(1001)], destinoAcreditado: 1 });

    expect(component.periodoCerrado()).toBe(true);
    expect(component.puedeAnotador()).toBe(false);
    expect(component.motivoCierre()).toContain('acreditado');
  });

  it('advierte cuando el origen está acreditado sin bloquear', () => {
    fixture.detectChanges();
    flushPeriodo({ anotacionesOrigen: [anotacion(1001)], origenAcreditado: 1 });

    expect(component.origenCerrado()).toBe(true);
    expect(component.puedeAnotador()).toBe(true);
    expect(component.avisoOrigenCerrado()).toContain('acreditado');
  });

  it('no mueve nada si se cancela la confirmación', () => {
    fixture.detectChanges();
    flushPeriodo({ anotacionesOrigen: [anotacion(1001, 55)] });
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const prompt = vi.spyOn(window, 'prompt');

    component.transferirAnotador();

    expect(prompt).not.toHaveBeenCalled();
    httpMock.expectNone('/api/haberes/core/anotador/55');
  });

  it('mueve todas las anotaciones al período destino', () => {
    fixture.detectChanges();
    flushPeriodo({ anotacionesOrigen: [anotacion(1001, 55), anotacion(1002, 56)] });
    const origen = component.textoOrigen();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(window, 'prompt').mockReturnValue(origen);

    component.transferirAnotador();

    const primero = httpMock.expectOne('/api/haberes/core/anotador/55');
    expect(primero.request.method).toBe('PUT');
    expect(primero.request.body).toMatchObject({
      anho: component.anho(),
      mes: component.mes(),
      transferido: 1
    });
    expect(primero.request.headers.get('X-Legajo-Solicitante')).toBe('999');
    primero.flush(anotacion(1001, 55));

    const segundo = httpMock.expectOne('/api/haberes/core/anotador/56');
    segundo.flush(anotacion(1002, 56));

    flushPeriodo();

    expect(component.resumen()).toEqual({ total: 2, exitosos: 2, salteados: 0, errores: [] });
    expect(component.exito()).toContain('2 anotaciones');
    expect(component.procesando()).toBeNull();
  });

  it('continúa el lote cuando una anotación falla', () => {
    fixture.detectChanges();
    flushPeriodo({ anotacionesOrigen: [anotacion(1001, 55), anotacion(1002, 56)] });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(window, 'prompt').mockReturnValue(component.textoOrigen());

    component.transferirAnotador();

    httpMock.expectOne('/api/haberes/core/anotador/55')
      .flush({ message: 'Falló' }, { status: 500, statusText: 'Server Error' });
    httpMock.expectOne('/api/haberes/core/anotador/56').flush(anotacion(1002, 56));

    flushPeriodo();

    const resumen = component.resumen();
    expect(resumen?.exitosos).toBe(1);
    expect(resumen?.errores.length).toBe(1);
    expect(resumen?.errores[0].legajoId).toBe(1001);
    expect(component.error()).toContain('1 de 2');
  });

  it('clona sólo los cargos que no existen en el destino', () => {
    const existente = cargo(1001, 10, 3);
    const nuevo = cargo(1002, 10, 3);
    fixture.detectChanges();
    flushPeriodo({ cargosOrigen: [existente, nuevo], cargosDestino: [existente] });
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    component.transferirCargos();

    const req = httpMock.expectOne('/api/haberes/core/cursocargonovedad/');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toMatchObject({
      legajoId: 1002,
      anho: component.anho(),
      mes: component.mes(),
      transferido: 1
    });
    expect(req.request.body.curso).toBeUndefined();
    expect(req.request.body.cursoCargoNovedadId).toBeUndefined();
    req.flush(nuevo);

    flushPeriodo();

    expect(component.resumen()).toEqual({ total: 1, exitosos: 1, salteados: 1, errores: [] });
    expect(component.exito()).toContain('1 cargo');
  });

  it('bloquea las acciones si no se puede verificar la acreditación', () => {
    fixture.detectChanges();
    flushPeriodo({ anotacionesOrigen: [anotacion(1001)], destinoError: true });

    expect(component.acreditacionError()).toBe(true);
    expect(component.puedeAnotador()).toBe(false);
    expect(component.motivoCierre()).toContain('No se pudo verificar');
  });

  it('deshabilita los procesos cuando no hay pendientes', () => {
    fixture.detectChanges();
    flushPeriodo();

    expect(component.puedeAnotador()).toBe(false);
    expect(component.puedeCargos()).toBe(false);
  });
});
