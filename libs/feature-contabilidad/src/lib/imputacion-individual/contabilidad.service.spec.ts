import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { ContabilidadService } from './contabilidad.service';
import { ImputacionIndividualResponse, PersonaImputacion } from './imputacion.models';

describe('ContabilidadService', () => {
  let service: ContabilidadService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ContabilidadService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(ContabilidadService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getImputacionIndividual realiza GET a /contable/imputacion-individual/{legajoId}/{anho}/{mes}', () => {
    const mockResponse: ImputacionIndividualResponse = {
      legajoId: 100,
      anho: 2026,
      mes: 3,
      cargos: [],
      cargosClase: [],
      codigos: [],
      totales: {
        totalCargosBasico: 0,
        totalCargosAntiguedad: 0,
        totalClasesBasico: 0,
        totalClasesAntiguedad: 0,
        totalCodigosImporte: 0,
        totalBruto: 0,
        totalNoRemunerativo: 0
      },
      diferencia: 0
    };

    let actualResponse: ImputacionIndividualResponse | undefined;
    service.getImputacionIndividual(100, 2026, 3).subscribe(r => (actualResponse = r));

    const req = http.expectOne('/api/haberes/core/contable/imputacion-individual/100/2026/3');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);

    expect(actualResponse).toEqual(mockResponse);
  });

  it('generarImputacionLegajo realiza GET a /contable/generatelegajo/{legajoId}/{anho}/{mes}', () => {
    let completed = false;
    service.generarImputacionLegajo(100, 2026, 3).subscribe({
      next: () => (completed = true)
    });

    const req = http.expectOne('/api/haberes/core/contable/generatelegajo/100/2026/3');
    expect(req.request.method).toBe('GET');
    req.flush(null);

    expect(completed).toBe(true);
  });

  it('searchPersonas realiza POST a /persona/search con palabras separadas', () => {
    const mockPersonas: PersonaImputacion[] = [
      { legajoId: 100, apellidoNombre: 'Perez, Juan' }
    ];

    let actual: PersonaImputacion[] | undefined;
    service.searchPersonas('perez juan').subscribe(r => (actual = r));

    const req = http.expectOne('/api/haberes/core/persona/search');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(['perez', 'juan']);
    req.flush(mockPersonas);

    expect(actual).toEqual(mockPersonas);
  });

  it('getPersonaByLegajo realiza GET a /persona/{legajoId}', () => {
    const persona: PersonaImputacion = { legajoId: 100, apellidoNombre: 'Perez, Juan' };
    let actual: PersonaImputacion | undefined;
    service.getPersonaByLegajo(100).subscribe(r => (actual = r));

    const req = http.expectOne('/api/haberes/core/persona/100');
    expect(req.request.method).toBe('GET');
    req.flush(persona);

    expect(actual).toEqual(persona);
  });

  it('getPersonaByDocumento realiza GET a /persona/documento/{documento}', () => {
    const persona: PersonaImputacion = { legajoId: 100, documento: 25123456 };
    let actual: PersonaImputacion | undefined;
    service.getPersonaByDocumento(25123456).subscribe(r => (actual = r));

    const req = http.expectOne('/api/haberes/core/persona/documento/25123456');
    expect(req.request.method).toBe('GET');
    req.flush(persona);

    expect(actual).toEqual(persona);
  });
});
