import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArchivoMasivoComponent } from './archivo-masivo.component';

describe('ArchivoMasivoComponent', () => {
  let fixture: ComponentFixture<ArchivoMasivoComponent>;
  let component: ArchivoMasivoComponent;
  let httpMock: HttpTestingController;

  const respuesta = {
    nombreArchivo: 'santander-2026-11.txt',
    contenido: btoa('H...'),
    cantidad: 2,
    total: 150000,
    periodoAcreditado: true,
    rechazos: [
      { legajoId: 9, apellidoNombre: 'Pérez, Juan', motivo: 'Excluido', importe: 1000, subtotal: 1000 },
    ],
  };

  beforeEach(async () => {
    Object.defineProperty(URL, 'createObjectURL', {
      value: () => 'blob:test',
      writable: true,
      configurable: true,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      value: () => undefined,
      writable: true,
      configurable: true,
    });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ArchivoMasivoComponent);
    fixture.componentRef.setInput('banco', 'santander');
    component = fixture.componentInstance;
    fixture.detectChanges();
    httpMock.expectOne('/api/haberes/core/dependencia/').flush([]);
  });

  afterEach(() => httpMock.verify());

  it('deriva la salida de los checks como el legacy', () => {
    expect(component.salida()).toBe('T');

    component.administrativos.set(true);
    expect(component.salida()).toBe('A');

    component.administrativos.set(false);
    component.docentes.set(true);
    expect(component.salida()).toBe('D');

    component.administrativos.set(true);
    expect(component.salida()).toBe('T');
  });

  it('genera el archivo con el body esperado y muestra rechazos', () => {
    component.anho.set(2026);
    component.mes.set(11);
    component.fechaPago.set('2026-11-30');
    component.numEnvio.set(0);
    component.administrativos.set(true);

    component.generar();

    const peticion = httpMock.expectOne('/api/haberes/core/acreditacion/archivo/santander');
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toEqual({
      anho: 2026,
      mes: 11,
      fechaPago: '2026-11-30',
      numEnvio: 1,
      salida: 'A',
      dependenciaId: 0,
      codigoId: 0,
      cci: false,
      individual: false,
    });

    peticion.flush(respuesta);

    expect(component.rechazos().length).toBe(1);
    expect(component.mensaje()).toContain('santander-2026-11.txt');
    expect(component.generando()).toBe(false);
  });

  it('envía CCI sólo para Otros Bancos', () => {
    fixture.componentRef.setInput('banco', 'otrosbancos');
    component.cci.set(true);
    component.fechaPago.set('2026-11-30');

    component.generar();

    const peticion = httpMock.expectOne('/api/haberes/core/acreditacion/archivo/otrosbancos');
    expect(peticion.request.body.cci).toBe(true);
    peticion.flush({ ...respuesta, nombreArchivo: 'otrosbancos-2026-11-cci.txt' });
  });

  it('exige fecha de pago antes de llamar al backend', () => {
    component.fechaPago.set('');

    component.generar();

    httpMock.expectNone('/api/haberes/core/acreditacion/archivo/santander');
    expect(component.error()).toContain('fecha de pago');
  });

  it('muestra el detalle del error 422', () => {
    component.fechaPago.set('2026-11-30');

    component.generar();

    httpMock
      .expectOne('/api/haberes/core/acreditacion/archivo/santander')
      .flush({ detail: 'Ningún legajo del período pudo acreditarse.' }, { status: 422, statusText: 'Unprocessable Entity' });

    expect(component.error()).toContain('Ningún legajo');
    expect(component.generando()).toBe(false);
  });
});
