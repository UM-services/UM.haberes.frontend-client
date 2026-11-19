import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { API_URL } from '@haberes/shared-api';

import { SijpComponent } from './sijp.component';
import { SijpResponse } from './sijp.models';

describe('SijpComponent', () => {
  let fixture: ComponentFixture<SijpComponent>;
  let component: SijpComponent;
  let http: HttpTestingController;

  const hoy = new Date();
  const anhoInicial = hoy.getFullYear();
  const mesInicial = hoy.getMonth() + 1;

  const respuesta: SijpResponse = {
    nombreArchivo: 'sijp-2026-11.txt',
    variante: 'NORMAL',
    contenido: btoa('linea de prueba'),
    cantidadRegistros: 2,
    omitidos: [],
    advertencias: []
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SijpComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: '/api/haberes' }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SijpComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);

    Object.defineProperty(window.URL, 'createObjectURL', { value: vi.fn(() => 'blob:mock'), writable: true });
    Object.defineProperty(window.URL, 'revokeObjectURL', { value: vi.fn(), writable: true });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  });

  afterEach(() => http.verify());

  it('arranca en el período actual y en la variante normal', () => {
    expect(component.anho()).toBe(anhoInicial);
    expect(component.mes()).toBe(mesInicial);
    expect(component.variante()).toBe('normal');
    expect(component.resultado()).toBeNull();
  });

  it('navega al mes anterior con rollover de año', () => {
    component.anho.set(2026);
    component.mes.set(1);

    component.irAnterior();

    expect(component.anho()).toBe(2025);
    expect(component.mes()).toBe(12);
  });

  it('navega al mes siguiente con rollover de año', () => {
    component.anho.set(2026);
    component.mes.set(12);

    component.irSiguiente();

    expect(component.anho()).toBe(2027);
    expect(component.mes()).toBe(1);
  });

  it('genera y descarga el archivo normal', () => {
    component.anho.set(2026);
    component.mes.set(11);

    component.generar();
    expect(component.generando()).toBe(true);

    http.expectOne('/api/haberes/core/sijp/2026/11/normal').flush(respuesta);

    expect(component.generando()).toBe(false);
    expect(component.resultado()).toEqual(respuesta);
    expect(window.URL.createObjectURL).toHaveBeenCalled();
  });

  it('usa la variante etec seleccionada', () => {
    component.anho.set(2026);
    component.mes.set(11);
    component.seleccionarVariante('etec');

    component.generar();

    http.expectOne('/api/haberes/core/sijp/2026/11/etec').flush({
      ...respuesta,
      nombreArchivo: 'sijp-2026-11-etec.txt',
      variante: 'ETEC'
    });

    expect(component.resultado()?.variante).toBe('ETEC');
    expect(component.resultado()?.nombreArchivo).toBe('sijp-2026-11-etec.txt');
  });

  it('muestra el mensaje de error del backend', () => {
    component.anho.set(2026);
    component.mes.set(11);

    component.generar();
    http
      .expectOne('/api/haberes/core/sijp/2026/11/normal')
      .flush({ detail: 'No hay legajos liquidados en el período 2026/11' }, { status: 422, statusText: 'Unprocessable Entity' });

    expect(component.generando()).toBe(false);
    expect(component.error()).toContain('No hay legajos liquidados');
    expect(component.resultado()).toBeNull();
  });

  it('no genera si el período es inválido', () => {
    component.anho.set(1999);
    component.mes.set(11);

    component.generar();

    expect(component.error()).toContain('año');
    expect(component.generando()).toBe(false);
  });

  it('no descarga si el período no tiene registros', () => {
    component.anho.set(2026);
    component.mes.set(11);

    component.generar();
    http.expectOne('/api/haberes/core/sijp/2026/11/normal').flush({
      ...respuesta,
      cantidadRegistros: 0,
      contenido: ''
    });

    expect(component.resultado()?.cantidadRegistros).toBe(0);
    expect(window.URL.createObjectURL).not.toHaveBeenCalled();
  });

  it('permite descargar de nuevo el último archivo', () => {
    component.anho.set(2026);
    component.mes.set(11);
    component.generar();
    http.expectOne('/api/haberes/core/sijp/2026/11/normal').flush(respuesta);

    vi.mocked(window.URL.createObjectURL).mockClear();
    component.descargarDeNuevo();

    expect(window.URL.createObjectURL).toHaveBeenCalledTimes(1);
  });

  it('descarta el resultado al cambiar de período o variante', () => {
    component.resultado.set(respuesta);

    component.seleccionarVariante('etec');

    expect(component.resultado()).toBeNull();
  });
});
