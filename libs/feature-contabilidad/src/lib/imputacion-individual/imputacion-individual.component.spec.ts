import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { ImputacionIndividualComponent } from './imputacion-individual.component';
import { ImputacionIndividualResponse, PersonaImputacion } from './imputacion.models';

describe('ImputacionIndividualComponent', () => {
  let component: ImputacionIndividualComponent;
  let httpMock: HttpTestingController;

  const mockPersona: PersonaImputacion = {
    legajoId: 100,
    documento: 30123456,
    apellido: 'Perez',
    nombre: 'Juan',
    apellidoNombre: 'Perez, Juan'
  };

  const mockImputacion: ImputacionIndividualResponse = {
    legajoId: 100,
    anho: 2026,
    mes: 3,
    cargos: [
      {
        categoriaId: 1,
        categoriaNombre: 'Cat 1',
        dependenciaId: 10,
        dependenciaAcronimo: 'DEP1',
        facultadId: 1,
        facultadNombre: 'FAC1',
        geograficaId: 2,
        geograficaNombre: 'GEO1',
        basico: 50000,
        antiguedad: 10000,
        cuentaSueldos: 1234
      }
    ],
    cargosClase: [],
    codigos: [],
    totales: {
      totalCargosBasico: 50000,
      totalCargosAntiguedad: 10000,
      totalClasesBasico: 0,
      totalClasesAntiguedad: 0,
      totalCodigosImporte: 0,
      totalBruto: 60000,
      totalNoRemunerativo: 0
    },
    diferencia: 0
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    component = TestBed.createComponent(ImputacionIndividualComponent).componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  it('debe crearse', () => {
    expect(component).toBeTruthy();
  });

  it('seleccionarPersona actualiza inputs y resetea datos previos', () => {
    component.seleccionarPersona(mockPersona);

    expect(component.personaSeleccionada()).toEqual(mockPersona);
    expect(component.legajoInput()).toBe('100');
    expect(component.documentoInput()).toBe('30123456');
    expect(component.personaInput()).toBe('Perez, Juan');
    expect(component.imputacionData()).toBeNull();
  });

  it('cambiarMes ajusta mes y año correctamente', () => {
    component.anho.set(2026);
    component.mes.set(1);

    component.cambiarMes(-1);
    expect(component.mes()).toBe(12);
    expect(component.anho()).toBe(2025);

    component.cambiarMes(1);
    expect(component.mes()).toBe(1);
    expect(component.anho()).toBe(2026);
  });

  it('revisar consulta el endpoint consolidado y carga imputacionData', () => {
    component.seleccionarPersona(mockPersona);
    component.anho.set(2026);
    component.mes.set(3);

    component.revisar();
    expect(component.isLoading()).toBe(true);

    const req = httpMock.expectOne('/api/haberes/core/contable/imputacion-individual/100/2026/3');
    expect(req.request.method).toBe('GET');
    req.flush(mockImputacion);

    expect(component.isLoading()).toBe(false);
    expect(component.imputacionData()).toEqual(mockImputacion);
    expect(component.imputacionData()?.totales.totalBruto).toBe(60000);
  });

  it('generar llama a generatelegajo y luego invoca revisar automáticamente', () => {
    component.seleccionarPersona(mockPersona);
    component.anho.set(2026);
    component.mes.set(3);

    component.generar();
    expect(component.isGenerating()).toBe(true);

    const reqGen = httpMock.expectOne('/api/haberes/core/contable/generatelegajo/100/2026/3');
    expect(reqGen.request.method).toBe('GET');
    reqGen.flush(null);

    expect(component.isGenerating()).toBe(false);
    expect(component.exito()).toBeTruthy();

    const reqRev = httpMock.expectOne('/api/haberes/core/contable/imputacion-individual/100/2026/3');
    expect(reqRev.request.method).toBe('GET');
    reqRev.flush(mockImputacion);

    expect(component.imputacionData()).toEqual(mockImputacion);
  });

  it('buscarPorLegajo busca y selecciona la persona si existe', () => {
    component.legajoInput.set('100');
    component.buscarPorLegajo();

    const req = httpMock.expectOne('/api/haberes/core/persona/100');
    expect(req.request.method).toBe('GET');
    req.flush(mockPersona);

    expect(component.personaSeleccionada()).toEqual(mockPersona);
  });

  it('buscarPorDocumento busca y selecciona la persona si existe', () => {
    component.documentoInput.set('30123456');
    component.buscarPorDocumento();

    const req = httpMock.expectOne('/api/haberes/core/persona/documento/30123456');
    expect(req.request.method).toBe('GET');
    req.flush(mockPersona);

    expect(component.personaSeleccionada()).toEqual(mockPersona);
  });
});
