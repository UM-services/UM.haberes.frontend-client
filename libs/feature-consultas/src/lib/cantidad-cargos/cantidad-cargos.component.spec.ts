import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CantidadCargosComponent } from './cantidad-cargos.component';
import { CantidadCargosData } from './cantidad-cargos.models';

describe('CantidadCargosComponent', () => {
  let component: CantidadCargosComponent;
  let http: HttpTestingController;

  const datos: CantidadCargosData = {
    anho: 2026,
    mes: 9,
    filas: [
      {
        facultad: 'Facultad de Ingeniería',
        sede: 'Campus Universitario',
        legajoId: '1001',
        apellidoNombre: 'Gómez, Ana',
        anuales: 1,
        semestre1: 0,
        semestre2: 2,
        bruto: '1.234.567,89'
      }
    ]
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    component = TestBed.createComponent(CantidadCargosComponent).componentInstance;
    component.anho.set(2026);
    component.mes.set(9);
    http = TestBed.inject(HttpTestingController);

    Object.defineProperty(window.URL, 'createObjectURL', { value: vi.fn(() => 'blob:mock'), writable: true });
    Object.defineProperty(window.URL, 'revokeObjectURL', { value: vi.fn(), writable: true });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  });

  afterEach(() => http.verify());

  it('consulta la cantidad de cargos del período', () => {
    component.verDatos();

    const req = http.expectOne('/api/haberes/report/ui/cantidadCargos/data/2026/9');
    req.flush(datos);

    expect(component.secciones()).toEqual([{ filas: datos.filas }]);
  });

  it('muestra el estado vacío cuando no hay filas', () => {
    component.verDatos();
    http
      .expectOne('/api/haberes/report/ui/cantidadCargos/data/2026/9')
      .flush({ anho: 2026, mes: 9, filas: [] });

    expect(component.secciones()).toEqual([]);
  });

  it('descarga el PDF y el XLSX del período', () => {
    component.descargar('pdf');
    http.expectOne('/api/haberes/report/ui/cantidadCargos/pdf/2026/9').flush(new Blob(['pdf']));
    expect(component.descargando()).toBeNull();

    component.descargar('xlsx');
    http.expectOne('/api/haberes/report/ui/cantidadCargos/xlsx/2026/9').flush(new Blob(['xlsx']));
    expect(component.descargando()).toBeNull();
  });

  it('limpia los datos al cambiar el período', () => {
    component.verDatos();
    http.expectOne('/api/haberes/report/ui/cantidadCargos/data/2026/9').flush(datos);

    component.cambiarPeriodo({ anho: 2026, mes: 8 });

    expect(component.datos()).toBeNull();
    expect(component.mes()).toBe(8);
  });
});
