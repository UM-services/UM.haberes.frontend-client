import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CursosDocenteComponent } from './cursos-docente.component';
import { CursosDocenteData } from './cursos-docente.models';

describe('CursosDocenteComponent', () => {
  let component: CursosDocenteComponent;
  let http: HttpTestingController;

  const datos: CursosDocenteData = {
    anho: 2026,
    mes: 9,
    docentes: [
      {
        legajoId: 1001,
        apellidoNombre: 'Gómez, Ana',
        filas: [
          {
            facultad: 'Facultad de Ingeniería',
            sede: 'Campus Universitario',
            espacio: 'Análisis Matemático I',
            horas: '10.5',
            cargo: 'Profesor Titular',
            basico: '1234567.89',
            anual: '1',
            semestre1: '',
            semestre2: ''
          }
        ]
      }
    ]
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    component = TestBed.createComponent(CursosDocenteComponent).componentInstance;
    component.anho.set(2026);
    component.mes.set(9);
    http = TestBed.inject(HttpTestingController);

    Object.defineProperty(window.URL, 'createObjectURL', { value: vi.fn(() => 'blob:mock'), writable: true });
    Object.defineProperty(window.URL, 'revokeObjectURL', { value: vi.fn(), writable: true });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  });

  afterEach(() => http.verify());

  it('consulta los cursos y agrupa por docente', () => {
    component.verDatos();

    const req = http.expectOne('/api/haberes/report/ui/cursoDocente/data/2026/9');
    req.flush(datos);

    expect(component.secciones()).toEqual([
      { titulo: '1001 - Gómez, Ana', filas: datos.docentes[0].filas }
    ]);
  });

  it('descarga el XLSX del período', () => {
    component.descargar('xlsx');

    const req = http.expectOne('/api/haberes/report/ui/cursoDocente/xlsx/2026/9');
    req.flush(new Blob(['xlsx']));

    expect(component.descargando()).toBeNull();
  });

  it('informa el error de negocio', () => {
    component.verDatos();
    http
      .expectOne('/api/haberes/report/ui/cursoDocente/data/2026/9')
      .flush({}, { status: 500, statusText: 'Server Error' });

    expect(component.error()).toContain('No se pudieron obtener');
  });
});
