import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CursosContratadoComponent } from './cursos-contratado.component';
import { CursosContratadoData } from './cursos-contratado.models';

describe('CursosContratadoComponent', () => {
  let component: CursosContratadoComponent;
  let http: HttpTestingController;

  const datos: CursosContratadoData = {
    anho: 2026,
    mes: 9,
    filas: [
      {
        cuit: '20-11111111-3',
        apellidoNombre: 'Sosa, Luis',
        periodo: '9/2026',
        facultad: 'Facultad de Ingeniería',
        sede: 'Campus Universitario',
        curso: 'Análisis Matemático I',
        cargo: 'Jefe de Trabajos Prácticos',
        horas: '6.5',
        dictado: 'Anual'
      }
    ]
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    component = TestBed.createComponent(CursosContratadoComponent).componentInstance;
    component.anho.set(2026);
    component.mes.set(9);
    http = TestBed.inject(HttpTestingController);

    Object.defineProperty(window.URL, 'createObjectURL', { value: vi.fn(() => 'blob:mock'), writable: true });
    Object.defineProperty(window.URL, 'revokeObjectURL', { value: vi.fn(), writable: true });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  });

  afterEach(() => http.verify());

  it('consulta los cursos de los contratados del período', () => {
    component.verDatos();

    const req = http.expectOne('/api/haberes/report/ui/cursosContratado/data/2026/9');
    req.flush(datos);

    expect(component.secciones()).toEqual([{ filas: datos.filas }]);
  });

  it('muestra el estado vacío cuando no hay cursos', () => {
    component.verDatos();
    http
      .expectOne('/api/haberes/report/ui/cursosContratado/data/2026/9')
      .flush({ anho: 2026, mes: 9, filas: [] });

    expect(component.secciones()).toEqual([]);
  });

  it('descarga el PDF y el XLSX del período', () => {
    component.descargar('pdf');
    http.expectOne('/api/haberes/report/ui/cursosContratado/pdf/2026/9').flush(new Blob(['pdf']));
    expect(component.descargando()).toBeNull();

    component.descargar('xlsx');
    http.expectOne('/api/haberes/report/ui/cursosContratado/xlsx/2026/9').flush(new Blob(['xlsx']));
    expect(component.descargando()).toBeNull();
  });
});
