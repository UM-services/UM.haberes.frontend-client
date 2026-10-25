import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CursosPeriodoComponent } from './cursos-periodo.component';
import { CursosPeriodoData } from './cursos-periodo.models';

describe('CursosPeriodoComponent', () => {
  let component: CursosPeriodoComponent;
  let http: HttpTestingController;

  const datos: CursosPeriodoData = {
    anho: 2026,
    mes: 9,
    filas: [
      {
        legajoId: '1001',
        apellidoNombre: 'Gómez, Ana',
        periodo: '9/2026',
        facultad: 'Facultad de Ingeniería',
        sede: 'Campus Universitario',
        curso: 'Análisis Matemático I',
        cargo: 'Profesor Titular',
        horas: '10.5',
        dictado: 'Anual'
      }
    ]
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    component = TestBed.createComponent(CursosPeriodoComponent).componentInstance;
    component.anho.set(2026);
    component.mes.set(9);
    http = TestBed.inject(HttpTestingController);

    Object.defineProperty(window.URL, 'createObjectURL', { value: vi.fn(() => 'blob:mock'), writable: true });
    Object.defineProperty(window.URL, 'revokeObjectURL', { value: vi.fn(), writable: true });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  });

  afterEach(() => http.verify());

  it('consulta los cursos del período', () => {
    component.verDatos();

    const req = http.expectOne('/api/haberes/report/ui/cursosPeriodo/data/2026/9');
    req.flush(datos);

    expect(component.secciones()).toEqual([{ filas: datos.filas }]);
  });

  it('muestra el estado vacío cuando no hay cursos', () => {
    component.verDatos();
    http
      .expectOne('/api/haberes/report/ui/cursosPeriodo/data/2026/9')
      .flush({ anho: 2026, mes: 9, filas: [] });

    expect(component.secciones()).toEqual([]);
  });

  it('descarga el PDF del período', () => {
    component.descargar('pdf');

    const req = http.expectOne('/api/haberes/report/ui/cursosPeriodo/pdf/2026/9');
    req.flush(new Blob(['pdf']));

    expect(component.descargando()).toBeNull();
  });

  it('descarga el XLSX del período', () => {
    component.descargar('xlsx');

    const req = http.expectOne('/api/haberes/report/ui/cursosPeriodo/xlsx/2026/9');
    req.flush(new Blob(['xlsx']));

    expect(component.descargando()).toBeNull();
  });
});
