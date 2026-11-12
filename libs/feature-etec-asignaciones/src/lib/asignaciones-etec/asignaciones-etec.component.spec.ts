import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { AuthService, Persona } from '@haberes/shared-api';

import { AsignacionesEtecComponent } from './asignaciones-etec.component';
import {
  AsignacionEtec,
  CategoriaEtec,
  Dependencia,
  periodoActual,
  sumarMes
} from './asignaciones-etec.models';

describe('AsignacionesEtecComponent', () => {
  let component: AsignacionesEtecComponent;
  let http: HttpTestingController;

  const persona: Persona = {
    legajoId: 100,
    documento: 30111222,
    apellido: 'PEREZ',
    nombre: 'ANA',
    apellidoNombre: 'PEREZ, ANA'
  };

  const dependencia: Dependencia = { dependenciaId: 7, nombre: 'SISTEMAS', acronimo: 'SIS' };

  const cargoEtec: CategoriaEtec = {
    categoriaId: 992,
    nombre: 'DIRECTOR ETEC',
    basico: 0,
    docente: 1,
    noDocente: 0,
    liquidaPorHora: 0,
    puntos: 1738
  };

  const categoriaComun: CategoriaEtec = {
    categoriaId: 5,
    nombre: 'AYUDANTE',
    basico: 10.5,
    docente: 1,
    noDocente: 0,
    liquidaPorHora: 1,
    puntos: 0
  };

  const asignacion: AsignacionEtec = {
    asignacionCargoId: 12,
    legajoId: 100,
    categoriaId: 992,
    dependenciaId: 7,
    fechaAlta: '2026-11-01T03:00:00+0000',
    fechaBaja: null,
    observaciones: 'ACTA 12',
    categoriaNombre: 'DIRECTOR ETEC',
    dependenciaNombre: 'SISTEMAS',
    personaApellido: 'PEREZ',
    personaNombre: 'ANA'
  };

  const controlPath = (anho: number, mes: number) =>
    `/api/haberes/core/control/periodo/${anho}/${mes}/opcional`;

  const flushInicial = (valorPuntoEtec: number | null = 3000) => {
    const { anho, mes } = periodoActual();
    http.expectOne('/api/haberes/etec/cargo/').flush([cargoEtec, categoriaComun]);
    http.expectOne('/api/haberes/core/dependencia/').flush([dependencia]);
    http.expectOne(controlPath(anho, mes)).flush(
      valorPuntoEtec === null ? null : { anho, mes, valorPuntoEtec }
    );
  };

  const seleccionarPersona = (asignaciones: AsignacionEtec[] = [asignacion]) => {
    component.onPersonaSeleccionada(persona);
    http.expectOne('/api/haberes/etec/asignacion-cargo/legajo/100').flush(asignaciones);
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
    component = TestBed.createComponent(AsignacionesEtecComponent).componentInstance;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('arranca sin agente, con cargos ETEC filtrados y el valor del punto del período', () => {
    expect(component.hayPersona()).toBe(false);
    flushInicial();

    expect(component.cargos().map((cargo) => cargo.categoriaId)).toEqual([992]);
    expect(component.dependencias().length).toBe(1);
    expect(component.valorPunto()).toBe(3000);
    expect(component.sinValorPunto()).toBe(false);
    expect(component.legajoSolicitante()).toBe(999);
  });

  it('al seleccionar una persona carga sus cargos ETEC', () => {
    flushInicial();
    seleccionarPersona();

    expect(component.asignaciones().length).toBe(1);
    expect(component.nombreCargoDe(asignacion)).toBe('DIRECTOR ETEC');
    expect(component.puntosDeAsignacion(asignacion)).toBe(1738);
    expect(component.importeDe(asignacion)).toBe(1738 * 3000);
  });

  it('el selector de período pide el valor del punto y recalcula el importe', () => {
    flushInicial(3000);
    component.categoriaId.set(992);
    expect(component.importe()).toBe(1738 * 3000);

    const siguiente = sumarMes(periodoActual(), 1);
    component.cambiarPeriodo(1);

    http.expectOne(controlPath(siguiente.anho, siguiente.mes))
      .flush({ anho: siguiente.anho, mes: siguiente.mes, valorPuntoEtec: 3500 });

    expect(component.periodo()).toEqual(siguiente);
    expect(component.valorPunto()).toBe(3500);
    expect(component.importe()).toBe(1738 * 3500);
  });

  it('avisa cuando el período no tiene valor de punto cargado', () => {
    flushInicial(null);

    expect(component.valorPunto()).toBeNull();
    expect(component.sinValorPunto()).toBe(true);
    expect(component.importe()).toBeNull();
  });

  it('seleccionar una asignación precarga el formulario en modo edición', () => {
    flushInicial();
    seleccionarPersona();

    component.seleccionar(asignacion);

    expect(component.editando()).toBe(true);
    expect(component.fechaAlta()).toBe('2026-11-01');
    expect(component.fechaBaja()).toBe('');
    expect(component.categoriaId()).toBe(992);
    expect(component.dependenciaId()).toBe(7);
    expect(component.observaciones()).toBe('ACTA 12');
  });

  it('sin dependencia no habilita el guardado ni llama al backend', () => {
    flushInicial();
    seleccionarPersona([]);

    component.fechaAlta.set('2026-11-01');
    component.categoriaId.set(992);
    component.guardar();

    expect(component.puedeGuardar()).toBe(false);
    http.expectNone('/api/haberes/etec/asignacion-cargo/');
  });

  it('asignar un cargo nuevo hace POST y recarga la lista', () => {
    flushInicial();
    seleccionarPersona([]);

    component.fechaAlta.set('2026-11-01');
    component.categoriaId.set(992);
    component.dependenciaId.set(7);
    component.observaciones.set('  ACTA 12  ');
    component.guardar();

    const req = http.expectOne('/api/haberes/etec/asignacion-cargo/');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      legajoId: 100,
      categoriaId: 992,
      dependenciaId: 7,
      fechaAlta: '2026-11-01T00:00:00+0000',
      fechaBaja: null,
      observaciones: 'ACTA 12'
    });
    expect(req.request.headers.get('X-Legajo-Solicitante')).toBe('999');
    req.flush(asignacion);

    http.expectOne('/api/haberes/etec/asignacion-cargo/legajo/100').flush([asignacion]);
    expect(component.exito()).toBe('Cargo ETEC asignado.');
    expect(component.editando()).toBe(false);
  });

  it('actualizar hace PUT conservando el offset de la fecha original', () => {
    flushInicial();
    seleccionarPersona();

    component.seleccionar(asignacion);
    component.fechaAlta.set('2026-11-05');
    component.fechaBaja.set('2026-12-31');
    component.guardar();

    const req = http.expectOne('/api/haberes/etec/asignacion-cargo/12');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.fechaAlta).toBe('2026-11-05T03:00:00+0000');
    expect(req.request.body.fechaBaja).toBe('2026-12-31T00:00:00+0000');
    req.flush(asignacion);

    http.expectOne('/api/haberes/etec/asignacion-cargo/legajo/100').flush([asignacion]);
    expect(component.exito()).toBe('Cargo ETEC actualizado.');
  });

  it('eliminar pide confirmación y no llama al backend si se cancela', () => {
    flushInicial();
    seleccionarPersona();

    component.seleccionar(asignacion);
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);

    component.eliminar();

    expect(confirm).toHaveBeenCalled();
    http.expectNone('/api/haberes/etec/asignacion-cargo/12');
    confirm.mockRestore();
  });

  it('un solape responde 409 y muestra un mensaje legible', () => {
    flushInicial();
    seleccionarPersona([]);

    component.fechaAlta.set('2026-11-01');
    component.categoriaId.set(992);
    component.dependenciaId.set(7);
    component.guardar();

    http.expectOne('/api/haberes/etec/asignacion-cargo/').flush(
      { detail: 'Ya existe una asignación vigente' },
      { status: 409, statusText: 'Conflict' }
    );

    expect(component.error()).toBe('Ya existe una asignación vigente de ese cargo ETEC para el agente.');
  });
});
