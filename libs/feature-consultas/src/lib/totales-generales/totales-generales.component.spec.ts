import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { TotalesGeneralesComponent } from './totales-generales.component';
import { TotalesGeneralesData } from './totales-generales.models';

describe('TotalesGeneralesComponent', () => {
  let component: TotalesGeneralesComponent;
  let http: HttpTestingController;

  const datos: TotalesGeneralesData = {
    anho: 2026,
    mes: 9,
    grupos: [
      {
        nombre: 'Remunerativo',
        filas: [{ codigoId: '100', nombre: 'Sueldo Básico', total: '1234567.89' }],
        subtotal: '1.234.567,89'
      }
    ]
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    component = TestBed.createComponent(TotalesGeneralesComponent).componentInstance;
    component.anho.set(2026);
    component.mes.set(9);
    http = TestBed.inject(HttpTestingController);

    // jsdom no implementa la descarga por blob.
    Object.defineProperty(window.URL, 'createObjectURL', { value: vi.fn(() => 'blob:mock'), writable: true });
    Object.defineProperty(window.URL, 'revokeObjectURL', { value: vi.fn(), writable: true });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  });

  afterEach(() => http.verify());

  it('consulta los totales del período elegido', () => {
    component.verDatos();

    const req = http.expectOne('/api/haberes/report/ui/totalesGenerales/data/2026/9');
    expect(req.request.method).toBe('GET');
    req.flush(datos);

    expect(component.datos()).toEqual(datos);
    expect(component.secciones()).toEqual([
      { titulo: 'Remunerativo', filas: datos.grupos[0].filas, subtotal: '1.234.567,89' }
    ]);
    expect(component.cargando()).toBe(false);
  });

  it('descarga el XLSX con los mismos parámetros que la tabla', () => {
    component.descargar('xlsx');

    const req = http.expectOne('/api/haberes/report/ui/totalesGenerales/xlsx/2026/9');
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob(['xlsx']));

    expect(component.descargando()).toBeNull();
  });

  it('informa el error de negocio cuando la consulta falla', () => {
    component.verDatos();

    const req = http.expectOne('/api/haberes/report/ui/totalesGenerales/data/2026/9');
    req.flush({}, { status: 500, statusText: 'Server Error' });

    expect(component.error()).toContain('No se pudieron obtener');
    expect(component.cargando()).toBe(false);
  });

  it('limpia los datos al cambiar de período', () => {
    component.datos.set(datos);

    component.cambiarPeriodo({ anho: 2026, mes: 8 });

    expect(component.anho()).toBe(2026);
    expect(component.mes()).toBe(8);
    expect(component.datos()).toBeNull();
  });
});
