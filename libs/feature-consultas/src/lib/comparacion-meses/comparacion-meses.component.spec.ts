import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ComparacionMesesComponent } from './comparacion-meses.component';
import { ComparacionRemuneracionesData } from './comparacion-meses.models';

describe('ComparacionMesesComponent', () => {
  let component: ComparacionMesesComponent;
  let http: HttpTestingController;

  const datos: ComparacionRemuneracionesData = {
    anho: 2026,
    mes: 9,
    anhoAnterior: 2026,
    mesAnterior: 8,
    dependencias: [
      {
        nombre: 'Rectorado',
        filas: [
          {
            legajoId: '1001',
            apellidoNombre: 'Gómez, Ana',
            brutoAnterior: '1.400.000',
            brutoActual: '1.500.000',
            brutoDiferencia: '100.000',
            brutoPorcentaje: '7,14%',
            netoAnterior: '1.100.000',
            netoActual: '1.200.000',
            netoDiferencia: '100.000'
          }
        ]
      }
    ]
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    component = TestBed.createComponent(ComparacionMesesComponent).componentInstance;
    component.anho.set(2026);
    component.mes.set(9);
    http = TestBed.inject(HttpTestingController);

    Object.defineProperty(window.URL, 'createObjectURL', { value: vi.fn(() => 'blob:mock'), writable: true });
    Object.defineProperty(window.URL, 'revokeObjectURL', { value: vi.fn(), writable: true });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  });

  afterEach(() => http.verify());

  it('compara contra el mes anterior', () => {
    component.verDatos();

    const req = http.expectOne('/api/haberes/report/ui/comparacionRemuneraciones/data/2026/9/2026/8');
    req.flush(datos);

    expect(component.secciones()).toEqual([{ titulo: 'Rectorado', filas: datos.dependencias[0].filas }]);
    expect(component.subtitulo()).toBe('9/2026 vs 8/2026');
  });

  it('en enero compara contra diciembre del año anterior', () => {
    component.anho.set(2026);
    component.mes.set(1);

    component.verDatos();

    const req = http.expectOne('/api/haberes/report/ui/comparacionRemuneraciones/data/2026/1/2025/12');
    req.flush({ ...datos, mes: 1, anhoAnterior: 2025, mesAnterior: 12 });

    expect(component.subtitulo()).toBe('1/2026 vs 12/2025');
  });

  it('descarga el XLSX con los dos períodos', () => {
    component.descargar('xlsx');

    const req = http.expectOne('/api/haberes/report/ui/comparacionRemuneraciones/xlsx/2026/9/2026/8');
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob(['xlsx']));

    expect(component.descargando()).toBeNull();
  });

  it('limpia los datos al cambiar de período', () => {
    component.datos.set(datos);

    component.cambiarPeriodo({ anho: 2026, mes: 10 });

    expect(component.mes()).toBe(10);
    expect(component.datos()).toBeNull();
  });
});
