import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { API_URL } from '@haberes/shared-api';

import { LimiteNovedadesComponent } from './limite-novedades.component';
import { Acreditacion, mesAnterior, mesSiguiente } from './limite-novedades.models';

describe('LimiteNovedadesComponent', () => {
  let fixture: ComponentFixture<LimiteNovedadesComponent>;
  let component: LimiteNovedadesComponent;
  let http: HttpTestingController;

  const hoy = new Date();
  const anhoInicial = hoy.getFullYear();
  const mesInicial = hoy.getMonth() + 1;

  function acreditacion(parcial: Partial<Acreditacion> = {}): Acreditacion {
    return {
      acreditacionId: 145,
      anho: anhoInicial,
      mes: mesInicial,
      acreditado: 0,
      limiteNovedades: '2099-12-31T00:00:00Z',
      fechaContable: '2099-12-28T00:00:00Z',
      ordenContable: 3,
      sueldosOriginal: 152340000,
      sueldosAjustados: 155980000,
      contribucionesPatronales: 42110000,
      ...parcial,
    };
  }

  function urlPeriodo(anho = anhoInicial, mes = mesInicial): string {
    return `/api/haberes/core/acreditacion/periodo/${anho}/${mes}`;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: '/api/haberes' },
      ],
    });
    fixture = TestBed.createComponent(LimiteNovedadesComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
  });

  it('carga el período existente con la fecha visible y el panel de estado', () => {
    fixture.detectChanges();

    http.expectOne(urlPeriodo()).flush(acreditacion());

    expect(component.esNuevo).toBe(false);
    expect(component.limite).toBe('2099-12-31');
    expect(component.acreditacionId).toBe(145);
    expect(component.registro()?.ordenContable).toBe(3);
  });

  it('interpreta el 404 como período nuevo', () => {
    fixture.detectChanges();

    http
      .expectOne(urlPeriodo())
      .flush({ detail: 'Cannot find Acreditacion' }, { status: 404, statusText: 'Not Found' });

    expect(component.esNuevo).toBe(true);
    expect(component.registro()).toBeNull();
    expect(component.limite).toBe('');
    expect(component.error()).toBe('');
  });

  it('navega al mes anterior y al siguiente', () => {
    fixture.detectChanges();
    http.expectOne(urlPeriodo()).flush(acreditacion());

    component.irAnterior();
    const anterior = mesAnterior(anhoInicial, mesInicial);
    http.expectOne(urlPeriodo(anterior.anho, anterior.mes)).flush(null as unknown as Acreditacion);

    component.irSiguiente();
    http.expectOne(urlPeriodo(anhoInicial, mesInicial)).flush(acreditacion());

    expect(component.anho()).toBe(anhoInicial);
    expect(component.mes()).toBe(mesInicial);
  });

  it('recarga el período escrito en año y mes', () => {
    fixture.detectChanges();
    http.expectOne(urlPeriodo()).flush(acreditacion());

    const siguiente = mesSiguiente(anhoInicial, mesInicial);
    component.anho.set(siguiente.anho);
    component.mes.set(siguiente.mes);
    component.recargarPeriodo();

    http.expectOne(urlPeriodo(siguiente.anho, siguiente.mes)).flush(acreditacion());
    expect(component.mes()).toBe(siguiente.mes);
  });

  it('restaura el período cargado si el año o el mes son inválidos', () => {
    fixture.detectChanges();
    http.expectOne(urlPeriodo()).flush(acreditacion());

    component.anho.set(1999);
    component.recargarPeriodo();

    expect(component.anho()).toBe(anhoInicial);
    expect(component.mes()).toBe(mesInicial);
  });

  it('crea el período con POST cuando no hay registro', () => {
    fixture.detectChanges();
    http
      .expectOne(urlPeriodo())
      .flush({ detail: 'Cannot find Acreditacion' }, { status: 404, statusText: 'Not Found' });

    component.limite = '2099-12-15';
    component.guardar();

    const post = http.expectOne('/api/haberes/core/acreditacion/');
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual({
      anho: anhoInicial,
      mes: mesInicial,
      limiteNovedades: '2099-12-15T23:59:59-0300',
    });
    post.flush(acreditacion({ limiteNovedades: '2099-12-16T02:59:59Z' }));

    http.expectOne(urlPeriodo()).flush(acreditacion({ limiteNovedades: '2099-12-16T02:59:59Z' }));

    expect(component.mensaje()).toContain('Límite de novedades guardado');
  });

  it('edita el límite con PATCH cuando el período ya existe', () => {
    fixture.detectChanges();
    http.expectOne(urlPeriodo()).flush(acreditacion());

    component.limite = '2099-12-20';
    component.guardar();

    const patch = http.expectOne('/api/haberes/core/acreditacion/145');
    expect(patch.request.method).toBe('PATCH');
    expect(patch.request.body).toEqual({ limiteNovedades: '2099-12-20T23:59:59-0300' });
    patch.flush(acreditacion({ limiteNovedades: '2099-12-21T02:59:59Z' }));

    http.expectOne(urlPeriodo()).flush(acreditacion({ limiteNovedades: '2099-12-21T02:59:59Z' }));

    expect(component.guardando()).toBe(false);
    expect(component.mensaje()).toContain('Límite de novedades guardado');
  });

  it('no llama al backend si falta la fecha límite', () => {
    fixture.detectChanges();
    http.expectOne(urlPeriodo()).flush(acreditacion());

    component.limite = '';
    component.guardar();

    http.expectNone('/api/haberes/core/acreditacion/145');
    expect(component.error()).toContain('fecha límite');
    expect(component.guardando()).toBe(false);
  });

  it('muestra el estado de carga cerrada cuando el límite ya pasó', () => {
    fixture.detectChanges();
    http
      .expectOne(urlPeriodo())
      .flush(acreditacion({ limiteNovedades: '2020-01-01T00:00:00Z' }));

    expect(component.estado).toBe('cerrada');
    expect(component.estadoEtiqueta).toBe('Carga cerrada');
  });

  it('muestra acreditado cuando el período ya se acreditó', () => {
    fixture.detectChanges();
    http.expectOne(urlPeriodo()).flush(acreditacion({ acreditado: 1 }));

    expect(component.estado).toBe('acreditado');
    expect(component.estadoEtiqueta).toBe('Acreditado');
  });

  it('muestra el error del backend al operador', () => {
    fixture.detectChanges();

    http
      .expectOne(urlPeriodo())
      .flush({ detail: 'Core no disponible' }, { status: 500, statusText: 'Server Error' });

    expect(component.error()).not.toBe('');
    expect(component.cargando()).toBe(false);
  });

  it('pide confirmación al cambiar de período con cambios sin guardar', () => {
    fixture.detectChanges();
    http.expectOne(urlPeriodo()).flush(acreditacion());

    const confirmar = vi.spyOn(window, 'confirm').mockReturnValue(false);
    component.limite = '2099-12-01';
    component.irSiguiente();

    expect(confirmar).toHaveBeenCalled();
    expect(component.mes()).toBe(mesInicial);
    http.expectNone(urlPeriodo(anhoInicial, (mesInicial % 12) + 1));
  });

  it('descarta los cambios y vuelve al valor guardado', () => {
    fixture.detectChanges();
    http.expectOne(urlPeriodo()).flush(acreditacion());

    component.limite = '2099-01-01';
    component.descartar();

    expect(component.limite).toBe('2099-12-31');
    expect(component.hayCambios).toBe(false);
  });
});
