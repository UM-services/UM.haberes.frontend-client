import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { LiquidablesComponent } from './liquidables.component';
import { LiquidablesData } from './liquidables.models';

describe('LiquidablesComponent', () => {
  let component: LiquidablesComponent;
  let http: HttpTestingController;

  const datos: LiquidablesData = {
    filas: [
      {
        legajoId: '1001',
        apellidoNombre: 'Gómez, Ana',
        estado: '1',
        dependenciaId: '10',
        dependenciaNombre: 'Facultad de Ingeniería'
      }
    ]
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    component = TestBed.createComponent(LiquidablesComponent).componentInstance;
    http = TestBed.inject(HttpTestingController);

    Object.defineProperty(window.URL, 'createObjectURL', { value: vi.fn(() => 'blob:mock'), writable: true });
    Object.defineProperty(window.URL, 'revokeObjectURL', { value: vi.fn(), writable: true });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  });

  afterEach(() => http.verify());

  it('consulta la planilla sin parámetros de período', () => {
    component.verDatos();

    const req = http.expectOne('/api/haberes/report/ui/liquidables/data');
    req.flush(datos);

    expect(component.secciones()).toEqual([{ filas: datos.filas }]);
  });

  it('muestra el estado vacío cuando no hay legajos', () => {
    component.verDatos();
    http.expectOne('/api/haberes/report/ui/liquidables/data').flush({ filas: [] });

    expect(component.secciones()).toEqual([]);
  });

  it('descarga el PDF', () => {
    component.descargar('pdf');

    const req = http.expectOne('/api/haberes/report/ui/liquidables/pdf');
    req.flush(new Blob(['pdf']));

    expect(component.descargando()).toBeNull();
  });

  it('descarga el XLSX', () => {
    component.descargar('xlsx');

    const req = http.expectOne('/api/haberes/report/ui/liquidables/xlsx');
    req.flush(new Blob(['xlsx']));

    expect(component.descargando()).toBeNull();
  });

  it('informa el error de negocio cuando la consulta falla', () => {
    component.verDatos();
    http
      .expectOne('/api/haberes/report/ui/liquidables/data')
      .flush('boom', { status: 500, statusText: 'Server Error' });

    expect(component.error()).toContain('planilla de liquidables');
    expect(component.cargando()).toBe(false);
  });
});
