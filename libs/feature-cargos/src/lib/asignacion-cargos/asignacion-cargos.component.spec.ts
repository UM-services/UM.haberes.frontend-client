import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { AuthService, Persona } from '@haberes/shared-api';

import { AsignacionCargosComponent } from './asignacion-cargos.component';
import { Cargo, Categoria } from './asignacion-cargos.models';

describe('AsignacionCargosComponent', () => {
  let component: AsignacionCargosComponent;
  let http: HttpTestingController;

  const persona: Persona = {
    legajoId: 100,
    documento: 30111222,
    apellido: 'PEREZ',
    nombre: 'ANA',
    apellidoNombre: 'PEREZ, ANA'
  };

  const categoriaPorHora: Categoria = {
    categoriaId: 5,
    nombre: 'AYUDANTE',
    basico: 10.5,
    docente: 1,
    noDocente: 0,
    liquidaPorHora: 1
  };

  const categoriaFija: Categoria = {
    categoriaId: 6,
    nombre: 'TITULAR',
    basico: 20,
    docente: 1,
    noDocente: 0,
    liquidaPorHora: 0
  };

  const cargo: Cargo = {
    cargoId: 15,
    legajoId: 100,
    fechaAlta: '2026-11-01T03:00:00+0000',
    fechaBaja: null,
    dependenciaId: 7,
    categoriaId: 6,
    jornada: 1,
    presentismo: 100,
    horasJornada: 0,
    categoria: categoriaFija,
    dependencia: { dependenciaId: 7, nombre: 'SISTEMAS', acronimo: 'SIS' }
  };

  const flushCatalogos = (categorias: Categoria[] = [categoriaPorHora, categoriaFija]) => {
    http.expectOne('/api/haberes/core/categoria/asignables').flush(categorias);
    http.expectOne('/api/haberes/core/dependencia/')
      .flush([{ dependenciaId: 7, nombre: 'SISTEMAS', acronimo: 'SIS' }]);
    http.expectOne('/api/haberes/core/facultad/')
      .flush([{ facultadId: 1, nombre: 'INGENIERIA' }, { facultadId: 2, nombre: 'MEDICINA' }]);
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { currentUser$: of({ legajoId: 999 }) } }
      ]
    });
    component = TestBed.createComponent(AsignacionCargosComponent).componentInstance;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('arranca sin agente y con los catálogos cargados', () => {
    expect(component.hayPersona()).toBe(false);
    flushCatalogos();

    expect(component.categorias().length).toBe(2);
    expect(component.dependencias().length).toBe(1);
    expect(component.facultades().length).toBe(2);
  });

  it('al seleccionar una persona carga cargos y facultades habilitadas', () => {
    flushCatalogos();
    component.onPersonaSeleccionada(persona);

    http.expectOne('/api/haberes/core/cargo/legajo/100').flush([cargo]);
    http.expectOne('/api/haberes/core/personaFacultad/persona/100')
      .flush([{ personaFacultadId: 3, legajoId: 100, facultadId: 1, facultad: { facultadId: 1, nombre: 'INGENIERIA' } }]);

    expect(component.cargos().length).toBe(1);
    expect(component.facultadesHabilitadas().length).toBe(1);
    expect(component.facultadesDisponibles().map((f) => f.facultadId)).toEqual([2]);
  });

  it('con categoría que liquida por hora fuerza jornada media y habilita horas', () => {
    flushCatalogos();

    component.onCategoria(5);
    expect(component.liquidaPorHora()).toBe(true);
    expect(component.jornada()).toBe(1);

    component.horasJornada.set(10);
    component.onCategoria(6);
    expect(component.liquidaPorHora()).toBe(false);
    expect(component.horasJornada()).toBe(0);
  });

  it('seleccionar un cargo precarga el formulario en modo edición', () => {
    flushCatalogos();
    component.seleccionarCargo(cargo);

    expect(component.editando()).toBe(true);
    expect(component.fechaAlta()).toBe('2026-11-01');
    expect(component.categoriaId()).toBe(6);
    expect(component.dependenciaId()).toBe(7);
    expect(component.presentismo()).toBe(100);
  });

  it('guardar un cargo nuevo hace POST y recarga la grilla', () => {
    flushCatalogos();
    component.onPersonaSeleccionada(persona);
    http.expectOne('/api/haberes/core/cargo/legajo/100').flush([]);
    http.expectOne('/api/haberes/core/personaFacultad/persona/100').flush([]);

    component.fechaAlta.set('2026-11-01');
    component.categoriaId.set(6);
    component.dependenciaId.set(7);
    component.presentismo.set(100);
    component.guardarCargo();

    const req = http.expectOne('/api/haberes/core/cargo/');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      legajoId: 100,
      fechaAlta: '2026-11-01T00:00:00+0000',
      fechaBaja: null,
      dependenciaId: 7,
      categoriaId: 6,
      jornada: 1,
      presentismo: 100,
      horasJornada: 0
    });
    expect(req.request.headers.get('X-Legajo-Solicitante')).toBe('999');
    req.flush(cargo);

    http.expectOne('/api/haberes/core/cargo/legajo/100').flush([cargo]);
    expect(component.exito()).toBe('Cargo agregado.');
  });

  it('editar un cargo hace PUT conservando el offset de la fecha original', () => {
    flushCatalogos();
    component.onPersonaSeleccionada(persona);
    http.expectOne('/api/haberes/core/cargo/legajo/100').flush([cargo]);
    http.expectOne('/api/haberes/core/personaFacultad/persona/100').flush([]);

    component.seleccionarCargo(cargo);
    component.fechaAlta.set('2026-11-05');
    component.guardarCargo();

    const req = http.expectOne('/api/haberes/core/cargo/15');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.fechaAlta).toBe('2026-11-05T03:00:00+0000');
    req.flush(cargo);

    http.expectOne('/api/haberes/core/cargo/legajo/100').flush([cargo]);
  });

  it('eliminar un cargo pide confirmación y no llama al backend si se cancela', () => {
    flushCatalogos();
    component.onPersonaSeleccionada(persona);
    http.expectOne('/api/haberes/core/cargo/legajo/100').flush([cargo]);
    http.expectOne('/api/haberes/core/personaFacultad/persona/100').flush([]);

    component.seleccionarCargo(cargo);
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);

    component.eliminarCargo();

    expect(confirm).toHaveBeenCalled();
    http.expectNone('/api/haberes/core/cargo/15');
    confirm.mockRestore();
  });

  it('habilitar una facultad ya habilitada muestra un mensaje de duplicado', () => {
    flushCatalogos();
    component.onPersonaSeleccionada(persona);
    http.expectOne('/api/haberes/core/cargo/legajo/100').flush([]);
    http.expectOne('/api/haberes/core/personaFacultad/persona/100').flush([]);

    component.facultadSeleccionada.set(1);
    component.habilitarFacultad();

    const req = http.expectOne('/api/haberes/core/personaFacultad/');
    req.flush({ detail: 'already exists' }, { status: 409, statusText: 'Conflict' });

    expect(component.error()).toBe('La facultad ya está habilitada para este agente.');
  });
});
