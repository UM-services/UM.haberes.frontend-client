import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { DetalleCodigoComponent } from './detalle-codigo.component';
import { DetalleCodigoData } from './detalle-codigo.models';

describe('DetalleCodigoComponent', () => {
  let component: DetalleCodigoComponent;
  let http: HttpTestingController;

  const datos: DetalleCodigoData = {
    codigoId: '31',
    codigoNombre: 'Antigüedad',
    filas: [
      {
        legajoId: '1001',
        apellidoNombre: 'Gómez, Ana',
        liquidado: '123.456,78',
        novedad: '1.000,50',
        cantidad: '2'
      }
    ]
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    component = TestBed.createComponent(DetalleCodigoComponent).componentInstance;
    component.anho.set(2026);
    component.mes.set(9);
    http = TestBed.inject(HttpTestingController);

    Object.defineProperty(window.URL, 'createObjectURL', { value: vi.fn(() => 'blob:mock'), writable: true });
    Object.defineProperty(window.URL, 'revokeObjectURL', { value: vi.fn(), writable: true });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  });

  afterEach(() => http.verify());

  it('no consulta nada sin código seleccionado', () => {
    component.verDatos();
    component.descargar('pdf');

    expect(component.habilitado()).toBe(false);
    expect(component.datos()).toBeNull();
  });

  it('consulta el detalle del código y período', () => {
    component.codigoId.set(31);
    component.verDatos();

    const req = http.expectOne('/api/haberes/report/ui/detalleCodigo/data/31/2026/9');
    req.flush(datos);

    expect(component.secciones()).toEqual([{ filas: datos.filas }]);
    expect(component.subtitulo()).toContain('Antigüedad');
  });

  it('muestra el estado vacío cuando no hay filas', () => {
    component.codigoId.set(31);
    component.verDatos();
    http
      .expectOne('/api/haberes/report/ui/detalleCodigo/data/31/2026/9')
      .flush({ codigoId: '31', codigoNombre: 'Antigüedad', filas: [] });

    expect(component.secciones()).toEqual([]);
  });

  it('descarga el XLSX del código y período', () => {
    component.codigoId.set(31);
    component.descargar('xlsx');

    const req = http.expectOne('/api/haberes/report/ui/detalleCodigo/xlsx/31/2026/9');
    req.flush(new Blob(['xlsx']));

    expect(component.descargando()).toBeNull();
  });

  it('limpia los datos al cambiar el código', () => {
    component.codigoId.set(31);
    component.verDatos();
    http.expectOne('/api/haberes/report/ui/detalleCodigo/data/31/2026/9').flush(datos);

    component.cambiarCodigo(96);

    expect(component.datos()).toBeNull();
    expect(component.codigoId()).toBe(96);
  });
});
