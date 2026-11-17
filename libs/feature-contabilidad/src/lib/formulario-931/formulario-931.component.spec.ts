import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { API_URL } from '@haberes/shared-api';

import { Formulario931Component } from './formulario-931.component';
import { SeguridadSocial, mesSiguiente } from './formulario-931.models';

describe('Formulario931Component', () => {
  let fixture: ComponentFixture<Formulario931Component>;
  let component: Formulario931Component;
  let http: HttpTestingController;

  const hoy = new Date();
  const anhoInicial = hoy.getFullYear();
  const mesInicial = hoy.getMonth() + 1;

  function urlPeriodo(anho = anhoInicial, mes = mesInicial): string {
    return `/api/haberes/core/seguridadSocial/unique/${anho}/${mes}/opcional`;
  }

  function seguridadSocial(): SeguridadSocial {
    return {
      seguridadSocialId: 7,
      anho: anhoInicial,
      mes: mesInicial,
      cc351: 100,
      cc301: 200,
      cc352: 300,
      cc302: 400,
      cc312: 500,
      cc028: 600,
      created: null,
      updated: null,
    };
  }

  /** Responde el período en curso con datos. */
  function cargarExistente(): void {
    http.expectOne(urlPeriodo()).flush(seguridadSocial());
    fixture.detectChanges();
  }

  /** Responde el período en curso vacío. */
  function cargarNuevo(): void {
    http.expectOne(urlPeriodo()).flush(null);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Formulario931Component],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: '/api/haberes' },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Formulario931Component);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('inicia en el período actual y queda en período nuevo si no hay datos', () => {
    cargarNuevo();

    expect(component.anho()).toBe(anhoInicial);
    expect(component.mes()).toBe(mesInicial);
    expect(component.esNuevo()).toBe(true);
    expect(component.form.seguridadSocialId).toBeNull();
    expect(component.form.cc351).toBe(0);
    expect(component.error()).toBe('');
  });

  it('carga los totales del período existente con su registro', () => {
    cargarExistente();

    expect(component.esNuevo()).toBe(false);
    expect(component.form.seguridadSocialId).toBe(7);
    expect(component.form.cc351).toBe(100);
    expect(component.form.cc028).toBe(600);
    expect(fixture.nativeElement.textContent).toContain('Registro');
  });

  it('calcula aportes y leyes sociales sin persistirlos', () => {
    cargarExistente();

    // Aportes = 351 + 352 + 312 + 028 = 100 + 300 + 500 + 600
    expect(component.aportes).toBe(1500);
    // Leyes sociales = 028 + 301 + 302 + 312 + 351 + 352 = 100 + 200 + 300 + 400 + 500 + 600
    expect(component.leyesSociales).toBe(2100);
  });

  it('navega al mes siguiente con rollover de año', () => {
    cargarNuevo();
    component.anho.set(anhoInicial);
    component.mes.set(12);

    component.irSiguiente();

    http.expectOne(urlPeriodo(anhoInicial + 1, 1)).flush(null);
    expect(component.anho()).toBe(anhoInicial + 1);
    expect(component.mes()).toBe(1);
  });

  it('navega al mes anterior con rollover de año', () => {
    cargarNuevo();
    component.anho.set(anhoInicial);
    component.mes.set(1);

    component.irAnterior();

    http.expectOne(urlPeriodo(anhoInicial - 1, 12)).flush(null);
    expect(component.anho()).toBe(anhoInicial - 1);
    expect(component.mes()).toBe(12);
  });

  it('pide confirmación antes de descartar cambios sin guardar', () => {
    cargarExistente();
    const siguiente = mesSiguiente(anhoInicial, mesInicial);
    component.form.cc351 = 999;

    const confirmar = vi.spyOn(window, 'confirm').mockReturnValue(false);
    component.irSiguiente();

    expect(confirmar).toHaveBeenCalled();
    http.expectNone(urlPeriodo(siguiente.anho, siguiente.mes));
    expect(component.anho()).toBe(anhoInicial);
    expect(component.mes()).toBe(mesInicial);

    confirmar.mockReturnValue(true);
    component.irSiguiente();

    http.expectOne(urlPeriodo(siguiente.anho, siguiente.mes)).flush(null);
    expect(component.anho()).toBe(siguiente.anho);
    expect(component.mes()).toBe(siguiente.mes);
  });

  it('recarga el período al cambiar año y mes', () => {
    cargarNuevo();
    component.anho.set(anhoInicial + 1);
    component.mes.set(3);

    component.recargarPeriodo();

    http.expectOne(urlPeriodo(anhoInicial + 1, 3)).flush(null);
    expect(component.anho()).toBe(anhoInicial + 1);
    expect(component.mes()).toBe(3);
  });

  it('restaura el período si el mes escrito es inválido', () => {
    cargarNuevo();
    component.mes.set(13);

    component.recargarPeriodo();

    expect(component.mes()).toBe(mesInicial);
    http.expectNone(urlPeriodo());
  });

  it('crea el período cuando todavía no tiene id', () => {
    cargarNuevo();
    component.form.cc351 = 1500;
    component.form.cc028 = -20;

    const confirmar = vi.spyOn(window, 'confirm').mockReturnValue(true);
    component.guardar();

    expect(confirmar).toHaveBeenCalled();
    const alta = http.expectOne('/api/haberes/core/seguridadSocial/');
    expect(alta.request.method).toBe('POST');
    expect(alta.request.body).toEqual({
      anho: anhoInicial,
      mes: mesInicial,
      cc351: 1500,
      cc301: 0,
      cc352: 0,
      cc302: 0,
      cc312: 0,
      cc028: -20,
    });
    expect(alta.request.body.seguridadSocialId).toBeUndefined();
    alta.flush(seguridadSocial());

    http.expectOne(urlPeriodo()).flush(seguridadSocial());
    expect(component.mensaje()).toContain('Totales guardados');
    expect(component.form.seguridadSocialId).toBe(7);
  });

  it('actualiza el período existente con el id en la ruta', () => {
    cargarExistente();
    component.form.cc028 = 650;

    component.guardar();

    const modificacion = http.expectOne('/api/haberes/core/seguridadSocial/7');
    expect(modificacion.request.method).toBe('PUT');
    expect(modificacion.request.body.cc028).toBe(650);
    expect(modificacion.request.body.seguridadSocialId).toBeUndefined();
    modificacion.flush(seguridadSocial());

    http.expectOne(urlPeriodo()).flush(seguridadSocial());
    expect(component.mensaje()).toContain('Totales guardados');
  });

  it('no guarda importes negativos si el operador no confirma', () => {
    cargarNuevo();
    component.form.cc351 = -100;

    const confirmar = vi.spyOn(window, 'confirm').mockReturnValue(false);
    component.guardar();

    expect(confirmar).toHaveBeenCalled();
    http.expectNone('/api/haberes/core/seguridadSocial/');
    expect(component.mensaje()).toBe('');
    expect(component.hayNegativos).toBe(true);
  });

  it('no guarda si el período escrito no es el que está cargado', () => {
    cargarNuevo();
    component.anho.set(anhoInicial + 1);

    component.guardar();

    http.expectNone('/api/haberes/core/seguridadSocial/');
    http.expectOne(urlPeriodo(anhoInicial + 1, mesInicial)).flush(null);
    expect(component.anho()).toBe(anhoInicial + 1);
  });

  it('muestra el error del backend al cargar el período', () => {
    http
      .expectOne(urlPeriodo())
      .flush({ detail: 'FF931 no disponible' }, { status: 500, statusText: 'Server Error' });

    expect(component.error()).toContain('FF931 no disponible');
    expect(component.cargando()).toBe(false);
  });
});
