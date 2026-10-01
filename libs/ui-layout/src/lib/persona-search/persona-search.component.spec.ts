import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Persona } from '@haberes/shared-api';

import { PersonaSearchComponent } from './persona-search.component';

const persona: Persona = {
  legajoId: 123,
  documento: 30123456,
  apellido: 'García',
  nombre: 'Ana',
  apellidoNombre: 'García, Ana'
};

describe('PersonaSearchComponent', () => {
  let fixture: ComponentFixture<PersonaSearchComponent>;
  let component: PersonaSearchComponent;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PersonaSearchComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    fixture = TestBed.createComponent(PersonaSearchComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    httpMock.verify();
  });

  async function escribir(termino: string): Promise<void> {
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = termino;
    input.dispatchEvent(new Event('input'));
    await vi.advanceTimersByTimeAsync(400);
    fixture.detectChanges();
  }

  it('busca desde el primer carácter sin umbral mínimo (como el modal legacy)', async () => {
    await escribir('g');

    const req = httpMock.expectOne('/api/haberes/core/persona/search');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(['g']);
    req.flush([persona]);

    expect(component.resultados()).toEqual([persona]);
    expect(component.panelAbierto()).toBe(true);
  });

  it('divide la cadena por espacios y envía cada palabra como condición', async () => {
    await escribir('garcía ana');

    const req = httpMock.expectOne('/api/haberes/core/persona/search');
    expect(req.request.body).toEqual(['garcía', 'ana']);
    req.flush([persona]);

    expect(component.resultados().length).toBe(1);
  });

  it('muestra las coincidencias como "Apellido, Nombre (legajo)" (textFound legacy)', async () => {
    await escribir('gar');
    httpMock.expectOne('/api/haberes/core/persona/search').flush([persona]);
    fixture.detectChanges();

    const opcion = fixture.nativeElement.querySelector('li[role="option"]');
    expect(opcion.textContent).toContain('García, Ana');
    expect(opcion.textContent).toContain('(123)');
  });

  it('navega con flechas y confirma con ENTER recargando la persona completa (findSearch legacy)', async () => {
    await escribir('gar');
    httpMock.expectOne('/api/haberes/core/persona/search').flush([persona]);

    component.onTecla(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(component.indiceActivo()).toBe(0);

    const entregas: Array<Persona | null> = [];
    component.seleccionada.subscribe((p) => entregas.push(p));
    component.onTecla(new KeyboardEvent('keydown', { key: 'Enter' }));

    const getReq = httpMock.expectOne('/api/haberes/core/persona/123');
    expect(getReq.request.method).toBe('GET');
    getReq.flush({ ...persona, estado: 1 });

    expect(entregas).toEqual([{ ...persona, estado: 1 }]);
    expect(component.termino()).toBe('García, Ana');
    expect(component.panelAbierto()).toBe(false);
  });

  it('ESC cierra el panel de resultados', async () => {
    await escribir('gar');
    httpMock.expectOne('/api/haberes/core/persona/search').flush([persona]);

    component.onTecla(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(component.panelAbierto()).toBe(false);
  });

  it('con el panel cerrado, las flechas abren el resaltado de la primera coincidencia', async () => {
    await escribir('gar');
    httpMock.expectOne('/api/haberes/core/persona/search').flush([persona]);

    component.onTecla(new KeyboardEvent('keydown', { key: 'Escape' }));
    component.onTecla(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(component.panelAbierto()).toBe(true);
    expect(component.indiceActivo()).toBe(0);
  });

  it('elegir una coincidencia recarga por legajo y deja de mostrar resultados', () => {
    const entregas: Array<Persona | null> = [];
    component.seleccionada.subscribe((p) => entregas.push(p));

    component.elegir(persona);
    httpMock.expectOne('/api/haberes/core/persona/123').flush({ ...persona, estado: 1 });

    expect(component.resultados()).toEqual([]);
    expect(component.termino()).toBe('García, Ana');
    expect(entregas.length).toBe(1);
  });

  it('la escritura posterior deselecciona una vez y conserva el texto tipeado pese al eco del padre', async () => {
    component.elegir(persona);
    const detalle = { ...persona, estado: 1 };
    httpMock.expectOne('/api/haberes/core/persona/123').flush(detalle);

    // Eco del binding [persona] del padre con la misma instancia: no debe tocar el campo.
    fixture.componentRef.setInput('persona', detalle);
    fixture.detectChanges();
    expect(component.termino()).toBe('García, Ana');

    const entregas: Array<Persona | null> = [];
    component.seleccionada.subscribe((p) => entregas.push(p));

    await escribir('peq');
    httpMock.expectOne('/api/haberes/core/persona/search').flush([]);

    expect(entregas).toEqual([null]);
    expect(component.termino()).toBe('peq');

    // Eco del padre poniendo null: tampoco debe pisar el texto en edición.
    fixture.componentRef.setInput('persona', null);
    fixture.detectChanges();
    expect(component.termino()).toBe('peq');
  });

  it('el padre limpia el campo al quitar una persona distinta a la entregada', () => {
    fixture.componentRef.setInput('persona', persona);
    fixture.detectChanges();
    expect(component.termino()).toBe('García, Ana');

    fixture.componentRef.setInput('persona', null);
    fixture.detectChanges();
    expect(component.termino()).toBe('');

    component.limpiar();
    expect(component.termino()).toBe('');
    expect(component.resultados()).toEqual([]);
  });

  it('un término numérico sin coincidencias de texto busca el legajo exacto', async () => {
    await escribir('123');
    httpMock.expectOne('/api/haberes/core/persona/search').flush([]);

    const getReq = httpMock.expectOne('/api/haberes/core/persona/123');
    getReq.flush(persona);

    expect(component.resultados()).toEqual([persona]);
  });

  it('no consulta nada con un término vacío', async () => {
    await escribir('   ');

    httpMock.expectNone('/api/haberes/core/persona/search');
    expect(component.panelAbierto()).toBe(false);
  });
});
