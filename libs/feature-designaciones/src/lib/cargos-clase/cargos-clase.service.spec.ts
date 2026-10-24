import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CargosClaseService } from './cargos-clase.service';
import { mesesATexto, moverMes, numeroDePeriodo, periodoDeNumero, periodoTexto } from './cargos-clase.models';

describe('CargosClaseService', () => {
  let service: CargosClaseService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CargosClaseService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(CargosClaseService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('pide los períodos del legajo', () => {
    service.getPeriodosByLegajo(120).subscribe();

    http.expectOne('/api/haberes/core/cargoclaseperiodo/legajo/120').flush([]);
  });

  it('pide el detalle mensual de una facultad', () => {
    service.getDetalleByFacultad(3, 2026, 8).subscribe();

    http.expectOne('/api/haberes/core/cargoclasedetalle/facultad/3/2026/8').flush([]);
  });

  it('pide índices de antigüedad y antigüedad del período', () => {
    service.getIndicesAntiguedad(120, 2026, 8).subscribe();
    http.expectOne('/api/haberes/core/designaciontool/indiceantiguedad/120/2026/8').flush([0.4, 15]);

    service.getAntiguedad(120, 2026, 8).subscribe();
    http.expectOne('/api/haberes/core/antiguedad/unique/120/2026/8').flush({ mesesDocentes: 60, mesesAdministrativos: 24 });
  });

  it('crea el cargo con clase con el cuerpo del POST y espera texto', () => {
    const payload = {
      legajoId: 120,
      cargoClaseId: 7,
      dependenciaId: 4,
      facultadId: 3,
      geograficaId: 2,
      periodoDesde: 202608,
      periodoHasta: 202612,
      horas: 10,
      aplicaAdicional: 1,
      descripcion: 'Ayudante'
    };
    service.addPeriodo(payload).subscribe();

    const req = http.expectOne('/api/haberes/core/cargoclasetool/');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    expect(req.request.responseType).toBe('text');
    req.flush('Ok');
  });

  it('elimina el cargo y cambia el período hasta', () => {
    service.deletePeriodo(9).subscribe();
    const del = http.expectOne('/api/haberes/core/cargoclasetool/9');
    expect(del.request.method).toBe('DELETE');
    expect(del.request.responseType).toBe('text');
    del.flush('Ok');

    service.changeHasta(9, 2027, 3).subscribe();
    const put = http.expectOne('/api/haberes/core/cargoclasetool/9/2027/3');
    expect(put.request.method).toBe('PUT');
    expect(put.request.responseType).toBe('text');
    put.flush('Ok');
  });
});

describe('Utilidades de período', () => {
  it('convierte entre número AAAAMM y período', () => {
    expect(periodoDeNumero(202608)).toEqual({ anho: 2026, mes: 8 });
    expect(numeroDePeriodo({ anho: 2026, mes: 8 })).toBe(202608);
    expect(periodoTexto(202608)).toBe('08/2026');
    expect(periodoTexto(0)).toBe('—');
  });

  it('mueve el período un mes, con cambio de año', () => {
    expect(moverMes({ anho: 2026, mes: 12 }, 1)).toEqual({ anho: 2027, mes: 1 });
    expect(moverMes({ anho: 2026, mes: 1 }, -1)).toEqual({ anho: 2025, mes: 12 });
  });

  it('expresa meses como años y meses', () => {
    expect(mesesATexto(12)).toBe('1 año(s)');
    expect(mesesATexto(18)).toBe('1 año(s) 6 mes(es)');
    expect(mesesATexto(5)).toBe('5 mes(es)');
  });
});
