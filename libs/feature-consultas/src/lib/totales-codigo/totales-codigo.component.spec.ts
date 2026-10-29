import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ComparacionCodigosData } from './comparacion-codigos.models';
import { TotalesCodigoComponent } from './totales-codigo.component';
import { TotalesCodigoData } from './totales-codigo.models';

describe('TotalesCodigoComponent', () => {
  let component: TotalesCodigoComponent;
  let http: HttpTestingController;

  const totales: TotalesCodigoData = {
    anho: 2026,
    mes: 9,
    filas: [
      {
        codigoId: 10,
        nombre: 'Sueldo Básico',
        novedades: '1.500.000,5',
        liquidado: '1.499.999,5',
        diferencia: '1'
      }
    ]
  };

  const comparacion: ComparacionCodigosData = {
    anho: 2026,
    mes: 9,
    filas: [
      {
        codigoId: 30,
        nombre: 'Sólo Liquidado',
        novedades: '',
        liquidado: '500,75',
        diferencia: ''
      }
    ]
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    component = TestBed.createComponent(TotalesCodigoComponent).componentInstance;
    component.anho.set(2026);
    component.mes.set(9);
    http = TestBed.inject(HttpTestingController);

    Object.defineProperty(window.URL, 'createObjectURL', { value: vi.fn(() => 'blob:mock'), writable: true });
    Object.defineProperty(window.URL, 'revokeObjectURL', { value: vi.fn(), writable: true });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  });

  afterEach(() => http.verify());

  it('consulta la vista Totales y arma una sección', () => {
    component.verDatos();

    const req = http.expectOne('/api/haberes/report/ui/totalesCodigo/data/2026/9');
    req.flush(totales);

    expect(component.secciones()).toEqual([{ filas: totales.filas }]);
    expect(component.subtitulo()).toContain('Totales');
  });

  it('al cambiar a Comparación consulta el otro reporte y limpia los datos', () => {
    component.datos.set(totales);

    component.cambiarVista('comparacion');

    expect(component.datos()).toBeNull();
    component.verDatos();
    const req = http.expectOne('/api/haberes/report/ui/comparacionCodigos/data/2026/9');
    req.flush(comparacion);

    expect(component.secciones()).toEqual([{ filas: comparacion.filas }]);
    expect(component.subtitulo()).toContain('Comparación');
  });

  it('descarga el formato de la vista seleccionada', () => {
    component.cambiarVista('comparacion');

    component.descargar('pdf');

    const req = http.expectOne('/api/haberes/report/ui/comparacionCodigos/pdf/2026/9');
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob(['pdf']));

    expect(component.descargando()).toBeNull();
  });

  it('informa el error de negocio', () => {
    component.verDatos();
    http
      .expectOne('/api/haberes/report/ui/totalesCodigo/data/2026/9')
      .flush({}, { status: 500, statusText: 'Server Error' });

    expect(component.error()).toContain('No se pudieron obtener');
  });
});
