import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { BasicosPeriodoComponent } from './basicos-periodo.component';
import { BasicosPeriodoData } from './basicos-periodo.models';

describe('BasicosPeriodoComponent', () => {
  let component: BasicosPeriodoComponent;
  let http: HttpTestingController;

  const datos: BasicosPeriodoData = {
    anho: 2026,
    mes: 9,
    filas: [
      {
        legajoId: '1001',
        apellidoNombre: 'Gómez, Ana',
        dependencia: 'Facultad de Ingeniería',
        claseCodigo: '1',
        categoriaCargo: 'Profesor Titular',
        basico: '1.234.567,89',
        horasJornada: '',
        jornada: '1'
      }
    ]
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    component = TestBed.createComponent(BasicosPeriodoComponent).componentInstance;
    component.anho.set(2026);
    component.mes.set(9);
    http = TestBed.inject(HttpTestingController);

    Object.defineProperty(window.URL, 'createObjectURL', { value: vi.fn(() => 'blob:mock'), writable: true });
    Object.defineProperty(window.URL, 'revokeObjectURL', { value: vi.fn(), writable: true });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  });

  afterEach(() => http.verify());

  it('consulta los básicos del período', () => {
    component.verDatos();

    const req = http.expectOne('/api/haberes/report/ui/basicosPeriodo/data/2026/9');
    req.flush(datos);

    expect(component.secciones()).toEqual([{ filas: datos.filas }]);
  });

  it('muestra el estado vacío cuando no hay filas', () => {
    component.verDatos();
    http
      .expectOne('/api/haberes/report/ui/basicosPeriodo/data/2026/9')
      .flush({ anho: 2026, mes: 9, filas: [] });

    expect(component.secciones()).toEqual([]);
  });

  it('descarga el PDF y el XLSX del período', () => {
    component.descargar('pdf');
    http.expectOne('/api/haberes/report/ui/basicosPeriodo/pdf/2026/9').flush(new Blob(['pdf']));
    expect(component.descargando()).toBeNull();

    component.descargar('xlsx');
    http.expectOne('/api/haberes/report/ui/basicosPeriodo/xlsx/2026/9').flush(new Blob(['xlsx']));
    expect(component.descargando()).toBeNull();
  });
});
