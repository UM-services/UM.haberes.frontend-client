import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { FusionDocenteComponent } from './fusion-docente.component';
import { FusionDocenteData } from './fusion-docente.models';

describe('FusionDocenteComponent', () => {
  let component: FusionDocenteComponent;
  let http: HttpTestingController;

  const datos: FusionDocenteData = {
    anho: 2026,
    mes: 9,
    filas: [
      {
        legajoId: '1001',
        apellidoNombre: 'Gómez, Ana',
        facultad: 'Facultad de Ingeniería',
        sede: 'Campus Universitario',
        cargo: 'Profesor Titular',
        basico: '1.234.567,89'
      }
    ]
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    component = TestBed.createComponent(FusionDocenteComponent).componentInstance;
    component.anho.set(2026);
    component.mes.set(9);
    http = TestBed.inject(HttpTestingController);

    Object.defineProperty(window.URL, 'createObjectURL', { value: vi.fn(() => 'blob:mock'), writable: true });
    Object.defineProperty(window.URL, 'revokeObjectURL', { value: vi.fn(), writable: true });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  });

  afterEach(() => http.verify());

  it('consulta las fusiones del período', () => {
    component.verDatos();

    const req = http.expectOne('/api/haberes/report/ui/fusionDocente/data/2026/9');
    req.flush(datos);

    expect(component.secciones()).toEqual([{ filas: datos.filas }]);
  });

  it('muestra el estado vacío cuando no hay filas', () => {
    component.verDatos();
    http.expectOne('/api/haberes/report/ui/fusionDocente/data/2026/9').flush({ anho: 2026, mes: 9, filas: [] });

    expect(component.secciones()).toEqual([]);
  });

  it('descarga el PDF del período', () => {
    component.descargar('pdf');

    const req = http.expectOne('/api/haberes/report/ui/fusionDocente/pdf/2026/9');
    req.flush(new Blob(['pdf']));

    expect(component.descargando()).toBeNull();
  });
});
