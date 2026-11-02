import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { LibroSueldosComponent } from './libro-sueldos.component';
import { LibroSueldosData } from './libro-sueldos.models';

describe('LibroSueldosComponent', () => {
  let component: LibroSueldosComponent;
  let http: HttpTestingController;

  const datos: LibroSueldosData = {
    anho: 2026,
    mes: 9,
    filas: [
      {
        legajoId: '1001',
        apellidoNombre: 'Gómez, Ana',
        cuil: '27-20111222-4',
        dependencia: 'Facultad de Ingeniería',
        remunerativo: '1.500.000,50',
        noRemunerativo: '100.000,00',
        deducciones: '350.000,25',
        neto: '1.250.000,25'
      }
    ]
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    component = TestBed.createComponent(LibroSueldosComponent).componentInstance;
    component.anho.set(2026);
    component.mes.set(9);
    http = TestBed.inject(HttpTestingController);

    Object.defineProperty(window.URL, 'createObjectURL', { value: vi.fn(() => 'blob:mock'), writable: true });
    Object.defineProperty(window.URL, 'revokeObjectURL', { value: vi.fn(), writable: true });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  });

  afterEach(() => http.verify());

  it('consulta el libro de sueldos del período', () => {
    component.verDatos();

    const req = http.expectOne('/api/haberes/report/ui/libroSueldos/data/2026/9');
    req.flush(datos);

    expect(component.secciones()).toEqual([{ filas: datos.filas }]);
    expect(component.hayDatos()).toBe(true);
  });

  it('muestra el estado vacío cuando no hay liquidaciones', () => {
    component.verDatos();
    http
      .expectOne('/api/haberes/report/ui/libroSueldos/data/2026/9')
      .flush({ anho: 2026, mes: 9, filas: [] });

    expect(component.secciones()).toEqual([]);
    expect(component.hayDatos()).toBe(false);
  });

  it('descarga el PDF y el XLSX del período', () => {
    component.descargar('pdf');
    http.expectOne('/api/haberes/report/ui/libroSueldos/pdf/2026/9').flush(new Blob(['pdf']));
    expect(component.descargando()).toBeNull();

    component.descargar('xlsx');
    http.expectOne('/api/haberes/report/ui/libroSueldos/xlsx/2026/9').flush(new Blob(['xlsx']));
    expect(component.descargando()).toBeNull();
  });

  it('descarga el ZIP del LSD con los legajos visibles', () => {
    component.verDatos();
    http.expectOne('/api/haberes/report/ui/libroSueldos/data/2026/9').flush(datos);

    component.descargarLsd();

    const req = http.expectOne('/api/haberes/report/ui/libroSueldos/lsd/2026/9');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual([1001]);
    req.flush(new Blob(['zip']));

    expect(component.descargando()).toBeNull();
  });

  it('no pide el LSD si no hay legajos visibles', () => {
    component.descargarLsd();

    expect(component.descargando()).toBeNull();
  });
});
