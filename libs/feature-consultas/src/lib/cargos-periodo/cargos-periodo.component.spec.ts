import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CargosPeriodoComponent } from './cargos-periodo.component';
import { CargosPeriodoData } from './cargos-periodo.models';

describe('CargosPeriodoComponent', () => {
  let component: CargosPeriodoComponent;
  let http: HttpTestingController;

  const datos: CargosPeriodoData = {
    anho: 2026,
    mes: 9,
    filas: [
      {
        legajoId: '1001',
        apellidoNombre: 'Gómez, Ana',
        periodo: '9/2026',
        dependenciaId: '10',
        dependenciaNombre: 'Facultad de Ingeniería',
        categoriaId: '1',
        categoriaNombre: 'Profesor Titular'
      }
    ]
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    component = TestBed.createComponent(CargosPeriodoComponent).componentInstance;
    component.anho.set(2026);
    component.mes.set(9);
    http = TestBed.inject(HttpTestingController);

    Object.defineProperty(window.URL, 'createObjectURL', { value: vi.fn(() => 'blob:mock'), writable: true });
    Object.defineProperty(window.URL, 'revokeObjectURL', { value: vi.fn(), writable: true });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  });

  afterEach(() => http.verify());

  it('consulta los cargos del período', () => {
    component.verDatos();

    const req = http.expectOne('/api/haberes/report/ui/cargosPeriodo/data/2026/9');
    req.flush(datos);

    expect(component.secciones()).toEqual([{ filas: datos.filas }]);
  });

  it('muestra el estado vacío cuando no hay cargos', () => {
    component.verDatos();
    http
      .expectOne('/api/haberes/report/ui/cargosPeriodo/data/2026/9')
      .flush({ anho: 2026, mes: 9, filas: [] });

    expect(component.secciones()).toEqual([]);
  });

  it('descarga el PDF y el XLSX del período', () => {
    component.descargar('pdf');
    http.expectOne('/api/haberes/report/ui/cargosPeriodo/pdf/2026/9').flush(new Blob(['pdf']));
    expect(component.descargando()).toBeNull();

    component.descargar('xlsx');
    http.expectOne('/api/haberes/report/ui/cargosPeriodo/xlsx/2026/9').flush(new Blob(['xlsx']));
    expect(component.descargando()).toBeNull();
  });

  it('registra el error de negocio cuando falla la descarga', () => {
    component.descargar('pdf');
    http
      .expectOne('/api/haberes/report/ui/cargosPeriodo/pdf/2026/9')
      .flush(new Blob(['boom']), { status: 500, statusText: 'Server Error' });

    expect(component.error()).toContain('PDF');
    expect(component.descargando()).toBeNull();
  });
});
