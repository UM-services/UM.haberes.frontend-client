import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { DocentesSedeComponent } from './docentes-sede.component';
import { DocentesSedeData } from './docentes-sede.models';

describe('DocentesSedeComponent', () => {
  let component: DocentesSedeComponent;
  let http: HttpTestingController;

  const datos: DocentesSedeData = {
    anho: 2026,
    mes: 9,
    facultad: 'Facultad de Ingeniería',
    geografica: 'Sede San Rafael',
    cursos: [
      {
        nombre: 'Análisis Matemático I',
        periodo: 'Anual',
        filas: [
          { cargo: 'Profesor Titular', docente: 'Gómez, Ana', designacion: 'Ordinaria', horas: '10.0', desarraigo: '*' }
        ]
      }
    ]
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    const fixture = TestBed.createComponent(DocentesSedeComponent);
    component = fixture.componentInstance;
    component.anho.set(2026);
    component.mes.set(9);
    http = TestBed.inject(HttpTestingController);

    Object.defineProperty(window.URL, 'createObjectURL', { value: vi.fn(() => 'blob:mock'), writable: true });
    Object.defineProperty(window.URL, 'revokeObjectURL', { value: vi.fn(), writable: true });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    // ngOnInit carga los catálogos.
    fixture.detectChanges();
    http.expectOne('/api/haberes/core/facultad/').flush([{ facultadId: 2, nombre: 'Facultad de Ingeniería' }]);
    http.expectOne('/api/haberes/core/geografica/').flush([{ geograficaId: 3, nombre: 'Sede San Rafael' }]);
  });

  afterEach(() => http.verify());

  it('carga los catálogos de facultad y sede', () => {
    expect(component.facultades()).toEqual([{ facultadId: 2, nombre: 'Facultad de Ingeniería' }]);
    expect(component.sedes()).toEqual([{ geograficaId: 3, nombre: 'Sede San Rafael' }]);
  });

  it('no consulta hasta elegir facultad y sede', () => {
    component.verDatos();
    http.expectNone(() => true);
    expect(component.habilitado()).toBe(false);
  });

  it('consulta la sede elegida y agrupa por curso', () => {
    component.cambiarFacultad(2);
    component.cambiarSede(3);

    component.verDatos();

    const req = http.expectOne('/api/haberes/report/ui/docentesSede/data/2/3/2026/9');
    req.flush(datos);

    expect(component.secciones()).toEqual([
      { titulo: 'Análisis Matemático I · Anual', filas: datos.cursos[0].filas }
    ]);
    expect(component.subtitulo()).toContain('Sede San Rafael');
  });

  it('descarga el XLSX con los mismos parámetros', () => {
    component.cambiarFacultad(2);
    component.cambiarSede(3);

    component.descargar('xlsx');

    const req = http.expectOne('/api/haberes/report/ui/docentesSede/xlsx/2/3/2026/9');
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob(['xlsx']));

    expect(component.descargando()).toBeNull();
  });
});
