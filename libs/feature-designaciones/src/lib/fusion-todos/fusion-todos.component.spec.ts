import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { FusionTodosComponent } from './fusion-todos.component';
import { PersonaLote } from './fusion-todos.service';

const GATE = '/api/haberes/core/cursoCargo/periodoany/2026/8';
const DOCENTES = '/api/haberes/core/persona/docente/2026/8';
const DOCENTES_PREVIOS = '/api/haberes/core/persona/docente/2026/7';
const DUPLICAR = '/api/haberes/core/designaciontool/periodo/duplicar/2026/8';
const FUSIONAR = '/api/haberes/core/designaciontool/periodo/fusionar/2026/8';
const DEPURAR = '/api/haberes/core/designaciontool/periodo/depurar/2026/8';

function personas(cantidad: number): PersonaLote[] {
  return Array.from({ length: cantidad }, (_, indice) => ({
    legajoId: indice + 1,
    apellido: `Apellido ${indice + 1}`,
    nombre: `Nombre ${indice + 1}`
  }));
}

function peticiones(http: HttpTestingController, fragmento: string) {
  return http.match((request) => request.url.includes(fragmento)).length;
}

describe('FusionTodosComponent', () => {
  let component: FusionTodosComponent;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    component = TestBed.createComponent(FusionTodosComponent).componentInstance;
    http = TestBed.inject(HttpTestingController);

    // El constructor consulta el período actual (fecha del sistema).
    http.match((request) => request.url.includes('/cursoCargo/periodoany/')).forEach((request) => request.flush([]));

    component.periodo.set({ anho: 2026, mes: 8 });
    component.cargarEstadoDuplicar();
    http.expectOne(GATE).flush([]);
  });

  afterEach(() => http.verify());

  it('duplica, relee el período y recién entonces fusiona', () => {
    component.duplicar.set(true);
    component.fusionarTodos();

    http.expectOne(DOCENTES_PREVIOS).flush(personas(2));

    const duplicar = http.expectOne(DUPLICAR);
    expect(duplicar.request.body).toEqual({ legajos: [1, 2] });
    expect(peticiones(http, '/persona/docente/2026/8')).toBe(0);
    expect(peticiones(http, '/periodo/fusionar/')).toBe(0);

    duplicar.flush({ procesados: 2, fallidos: [] });

    // La lectura del período es posterior a la duplicación (G1).
    const docentes = http.expectOne(DOCENTES);
    expect(peticiones(http, '/periodo/fusionar/')).toBe(0);
    docentes.flush(personas(2));

    const fusionar = http.expectOne(FUSIONAR);
    expect(fusionar.request.body).toEqual({ legajos: [1, 2] });
    fusionar.flush({ procesados: 2, fallidos: [] });

    http.expectOne(DEPURAR).flush(null);
    http.expectOne(GATE).flush([]);

    expect(component.procesados()).toBe(4);
    expect(component.exito()).toContain('4');
  });

  it('no ejecuta nada si falla la lectura de docentes (G2)', () => {
    component.fusionarTodos();

    http.expectOne(DOCENTES).flush('caído', { status: 500, statusText: 'Server Error' });

    expect(component.error()).not.toBeNull();
    expect(component.running()).toBe(false);
    expect(peticiones(http, '/periodo/fusionar/')).toBe(0);
    expect(peticiones(http, '/periodo/depurar/')).toBe(0);
  });

  it('no habilita duplicar si falla la verificación del período (G2)', () => {
    component.cargarEstadoDuplicar();
    http.expectOne(GATE).flush('caído', { status: 500, statusText: 'Server Error' });

    expect(component.estadoCargos()).toBe('error');
    expect(component.hayCargos()).toBe(false);
    expect(component.error()).not.toBeNull();

    component.fusionarTodos();

    expect(component.running()).toBe(false);
    expect(peticiones(http, '/persona/docente/')).toBe(0);
  });

  it('cancela entre lotes sin fusionar el lote pendiente ni depurar', () => {
    component.fusionarTodos();
    http.expectOne(DOCENTES).flush(personas(51));

    const primerLote = http.expectOne(FUSIONAR);
    component.cancelar();
    primerLote.flush({ procesados: 50, fallidos: [] });

    expect(peticiones(http, '/periodo/fusionar/')).toBe(0);
    expect(peticiones(http, '/periodo/depurar/')).toBe(0);
    expect(component.exito()).toContain('cancelado');
    expect(component.procesados()).toBe(50);
  });

  it('acumula los legajos fallidos y continúa el proceso', () => {
    component.fusionarTodos();
    http.expectOne(DOCENTES).flush(personas(2));

    http.expectOne(FUSIONAR).flush({
      procesados: 1,
      fallidos: [{ legajoId: 2, error: 'Sin categoría' }]
    });
    http.expectOne(DEPURAR).flush(null);
    http.expectOne(GATE).flush([]);

    expect(component.fallidos()).toEqual([{ legajoId: 2, error: 'Sin categoría' }]);
    expect(component.exito()).toContain('1 con error');
  });

  it('informa la depuración pendiente cuando falla el cierre (G3)', () => {
    component.fusionarTodos();
    http.expectOne(DOCENTES).flush(personas(1));

    http.expectOne(FUSIONAR).flush({ procesados: 1, fallidos: [] });
    http.expectOne(DEPURAR).flush(null, { status: 500, statusText: 'Server Error' });

    expect(component.depuracionPendiente()).toBe(true);
    expect(component.exito()).toContain('1');
  });

  it('recalcula el desarraigo de los legajos del período', () => {
    component.recalcularDesarraigo();
    http.expectOne('/api/haberes/core/persona/desarraigo/2026/8').flush(personas(3));

    http
      .expectOne('/api/haberes/core/designaciontool/periodo/desarraigo/2026/8')
      .flush({ procesados: 3, fallidos: [] });

    expect(component.procesados()).toBe(3);
    expect(component.exito()).toContain('3');
  });
});
