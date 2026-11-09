import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { AuthService, Persona } from '@haberes/shared-api';

import { LiquidacionIndividualComponent } from './liquidacion-individual.component';
import { FichaLiquidacionIndividual } from './liquidacion-individual.models';

describe('LiquidacionIndividualComponent', () => {
  let component: LiquidacionIndividualComponent;
  let httpMock: HttpTestingController;

  const persona: Persona = {
    legajoId: 1001,
    documento: 30111222,
    apellido: 'PEREZ',
    nombre: 'ANA'
  };

  const fichaBase = (): FichaLiquidacionIndividual => ({
    legajoId: 1001,
    anho: 2026,
    mes: 11,
    persona: {
      legajoId: 1001,
      documento: 30111222,
      apellido: 'PEREZ',
      nombre: 'ANA',
      estado: 1,
      liquida: 'S',
      dependenciaId: 7,
      salida: 'B'
    },
    control: { controlId: 88, anho: 2026, mes: 11, modoLiquidacionId: 1 },
    liquidacion: null,
    antiguedad: { mesesDocentes: 192, mesesAdministrativos: 0, indiceDocente: 1.85, indiceAdministrativo: 1 },
    cargosDocentes: [],
    cargosNoDocentes: [],
    cargosConClase: [],
    novedades: [],
    items: [],
    acciones: {
      puedeGenerarCargos: true,
      puedeLiquidar: true,
      puedeEliminarLiquidacion: false,
      puedeEditarNovedades: true,
      bloqueado: false,
      motivoBloqueo: null
    }
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { currentUser$: of({ legajoId: 999 }) } }
      ]
    });
    component = TestBed.createComponent(LiquidacionIndividualComponent).componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('se crea con el período actual y sin ficha', () => {
    expect(component).toBeTruthy();
    expect(component.hayFicha()).toBe(false);
  });

  it('al seleccionar un legajo carga la ficha del período', () => {
    component.seleccionarPersona(persona);

    const req = httpMock.expectOne('/api/haberes/core/liquidacion-individual/1001/2026/11');
    expect(req.request.method).toBe('GET');
    req.flush(fichaBase());

    expect(component.ficha()?.legajoId).toBe(1001);
    expect(component.acciones()?.puedeLiquidar).toBe(true);
    expect(component.legajoSolicitante()).toBe(999);
  });

  it('navega el período con wrap de año', () => {
    component.mes.set(1);
    component.anho.set(2026);

    component.cambiarMes(-1);

    expect(component.mes()).toBe(12);
    expect(component.anho()).toBe(2025);
  });

  it('formatea meses como años y meses', () => {
    expect(component.anosMeses(192)).toBe('16 años 0 meses');
    expect(component.anosMeses(13)).toBe('1 año 1 mes');
    expect(component.anosMeses(null)).toBe('—');
  });

  it('agrega una novedad S/N por el endpoint del slice', () => {
    component.seleccionarPersona(persona);
    httpMock.expectOne('/api/haberes/core/liquidacion-individual/1001/2026/11').flush(fichaBase());

    component.codigoSeleccionado.set({
      codigoId: 16,
      nombre: 'PRESENTISMO',
      docente: null,
      noDocente: null,
      search: ''
    });
    component.importeTexto.set('n');
    component.observaciones.set('sin presentismo');

    component.agregarNovedad();

    const req = httpMock.expectOne('/api/haberes/core/liquidacion-individual/1001/2026/11/novedad');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      codigoId: 16,
      importe: null,
      valor: 'N',
      observaciones: 'sin presentismo',
      forzar: false
    });
    req.flush({ resultado: 'GUARDADA', mensaje: 'Novedad guardada.', novedad: null });

    // El alta recarga la ficha.
    httpMock.expectOne('/api/haberes/core/liquidacion-individual/1001/2026/11').flush(fichaBase());
    expect(component.exito()).toBe('Novedad guardada.');
  });

  it('muestra el mensaje del backend cuando la liquidación está bloqueada', () => {
    component.seleccionarPersona(persona);
    httpMock.expectOne('/api/haberes/core/liquidacion-individual/1001/2026/11').flush(fichaBase());

    component.liquidar();

    const req = httpMock.expectOne('/api/haberes/core/liquidacion-individual/1001/2026/11/liquidar');
    req.flush({ resultado: 'BLOQUEADA', mensaje: 'La liquidación está bloqueada.' });

    httpMock.expectOne('/api/haberes/core/liquidacion-individual/1001/2026/11').flush(fichaBase());
    expect(component.error()).toBe('La liquidación está bloqueada.');
  });

  it('muestra el mensaje de éxito cuando liquida', () => {
    component.seleccionarPersona(persona);
    httpMock.expectOne('/api/haberes/core/liquidacion-individual/1001/2026/11').flush(fichaBase());

    component.liquidar();

    const req = httpMock.expectOne('/api/haberes/core/liquidacion-individual/1001/2026/11/liquidar');
    req.flush({ resultado: 'LIQUIDADO', mensaje: 'Liquidación generada correctamente.' });

    httpMock.expectOne('/api/haberes/core/liquidacion-individual/1001/2026/11').flush(fichaBase());
    expect(component.exito()).toBe('Liquidación generada correctamente.');
  });
});
