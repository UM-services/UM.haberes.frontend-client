import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { DesignacionDocentesComponent } from './designacion-docentes.component';
import { DesignacionesDocenteData } from './designacion-docentes.models';

describe('DesignacionDocentesComponent', () => {
  let component: DesignacionDocentesComponent;
  let http: HttpTestingController;

  const datos: DesignacionesDocenteData = {
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
            horas: '10.0',
            cargo: 'Profesor Titular',
            designacion: 'Ordinaria',
            horasDesignacion: '10.0',
            dictado: 'Anual'
          }
        ]
      }
    ]
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    component = TestBed.createComponent(DesignacionDocentesComponent).componentInstance;
    component.anho.set(2026);
    component.mes.set(9);
    http = TestBed.inject(HttpTestingController);

    Object.defineProperty(window.URL, 'createObjectURL', { value: vi.fn(() => 'blob:mock'), writable: true });
    Object.defineProperty(window.URL, 'revokeObjectURL', { value: vi.fn(), writable: true });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  });

  afterEach(() => http.verify());

  it('consulta las designaciones y agrupa por docente', () => {
    component.verDatos();

    const req = http.expectOne('/api/haberes/report/ui/designacionesDocente/data/2026/9');
    req.flush(datos);

    expect(component.secciones()).toEqual([
      { titulo: '1001 - Gómez, Ana', filas: datos.docentes[0].filas }
    ]);
  });

  it('descarga el PDF del período', () => {
    component.descargar('pdf');

    const req = http.expectOne('/api/haberes/report/ui/designacionesDocente/pdf/2026/9');
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob(['pdf']));

    expect(component.descargando()).toBeNull();
  });

  it('limpia los datos al cambiar de período', () => {
    component.datos.set(datos);

    component.cambiarPeriodo({ anho: 2026, mes: 8 });

    expect(component.datos()).toBeNull();
    expect(component.mes()).toBe(8);
  });
});
