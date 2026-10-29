import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CargosClaseFacultadComponent } from './cargos-clase-facultad.component';
import { CargosClasePeriodoData } from './cargos-clase-facultad.models';

describe('CargosClaseFacultadComponent', () => {
  let component: CargosClaseFacultadComponent;
  let http: HttpTestingController;

  const datos: CargosClasePeriodoData = {
    anho: 2026,
    mes: 9,
    facultad: 'Facultad de Ingeniería',
    sedes: [
      {
        nombre: 'Campus Universitario',
        filas: [
          {
            legajoId: 1001,
            apellidoNombre: 'Gómez, Ana',
            cargo: 'Profesor Titular',
            descripcion: 'Cargo ordinario',
            periodoDesde: 202601,
            periodoHasta: 202612,
            horas: 10,
            clase: 'Primera'
          }
        ]
      }
    ]
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    const fixture = TestBed.createComponent(CargosClaseFacultadComponent);
    component = fixture.componentInstance;
    component.anho.set(2026);
    component.mes.set(9);
    http = TestBed.inject(HttpTestingController);

    Object.defineProperty(window.URL, 'createObjectURL', { value: vi.fn(() => 'blob:mock'), writable: true });
    Object.defineProperty(window.URL, 'revokeObjectURL', { value: vi.fn(), writable: true });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    fixture.detectChanges();
    http.expectOne('/api/haberes/core/facultad/').flush([{ facultadId: 2, nombre: 'Facultad de Ingeniería' }]);
  });

  afterEach(() => http.verify());

  it('no consulta hasta elegir facultad', () => {
    component.verDatos();
    http.expectNone(() => true);
    expect(component.habilitado()).toBe(false);
  });

  it('consulta la facultad y agrupa por sede', () => {
    component.cambiarFacultad(2);

    component.verDatos();

    const req = http.expectOne('/api/haberes/report/ui/cargosClasePeriodo/data/2/2026/9');
    req.flush(datos);

    expect(component.secciones()).toEqual([
      { titulo: 'Campus Universitario', filas: datos.sedes[0].filas }
    ]);
  });

  it('muestra los períodos como MM/AAAA', () => {
    const columnas = component.columnas;
    const desde = columnas.find((columna) => columna.titulo === 'Desde');
    const fila = datos.sedes[0].filas[0];

    expect(desde?.valor(fila)).toBe('01/2026');
  });

  it('descarga el PDF con los mismos parámetros', () => {
    component.cambiarFacultad(2);

    component.descargar('pdf');

    const req = http.expectOne('/api/haberes/report/ui/cargosClasePeriodo/pdf/2/2026/9');
    req.flush(new Blob(['pdf']));

    expect(component.descargando()).toBeNull();
  });
});
