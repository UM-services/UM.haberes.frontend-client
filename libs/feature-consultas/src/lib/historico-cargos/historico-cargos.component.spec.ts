import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { HistoricoCargosComponent } from './historico-cargos.component';

describe('HistoricoCargosComponent', () => {
  let component: HistoricoCargosComponent;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    component = TestBed.createComponent(HistoricoCargosComponent).componentInstance;
    http = TestBed.inject(HttpTestingController);

    Object.defineProperty(window.URL, 'createObjectURL', { value: vi.fn(() => 'blob:mock'), writable: true });
    Object.defineProperty(window.URL, 'revokeObjectURL', { value: vi.fn(), writable: true });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  });

  afterEach(() => http.verify());

  it('carga las categorías al iniciar', () => {
    component.ngOnInit();

    const req = http.expectOne('/api/haberes/core/categoria/');
    req.flush([{ categoriaId: 1, nombre: 'Profesor Titular' }]);

    expect(component.categorias()).toHaveLength(1);
  });

  it('no descarga el PDF sin categoría seleccionada', () => {
    component.descargarPdf();

    expect(component.habilitado()).toBe(false);
    expect(component.descargando()).toBe(false);
  });

  it('consulta el aviso al elegir la categoría', () => {
    component.cambiarCategoria(5);

    const req = http.expectOne('/api/haberes/report/ui/historicoCargos/data/5');
    req.flush({
      categoriaId: '5',
      aviso: 'El reporte no tiene cuerpo implementado; se descarga únicamente el encabezado.'
    });

    expect(component.aviso()).toContain('no tiene cuerpo implementado');
  });

  it('descarga el PDF de la categoría', () => {
    component.cambiarCategoria(5);
    http
      .expectOne('/api/haberes/report/ui/historicoCargos/data/5')
      .flush({ categoriaId: '5', aviso: 'aviso' });

    component.descargarPdf();

    const req = http.expectOne('/api/haberes/report/ui/historicoCargos/pdf/5');
    req.flush(new Blob(['pdf']));

    expect(component.descargando()).toBe(false);
  });
});
