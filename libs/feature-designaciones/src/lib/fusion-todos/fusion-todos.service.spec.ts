import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { FusionTodosService } from './fusion-todos.service';

describe('FusionTodosService', () => {
  let service: FusionTodosService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FusionTodosService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(FusionTodosService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('pide los docentes y los legajos con desarraigo del período', () => {
    service.getDocentes(2026, 8).subscribe();
    http.expectOne('/api/haberes/core/persona/docente/2026/8').flush([]);

    service.getLegajosDesarraigo(2026, 8).subscribe();
    http.expectOne('/api/haberes/core/persona/desarraigo/2026/8').flush([]);
  });

  it('consulta los cargos del período para habilitar la duplicación', () => {
    service.getCargosPeriodo(2026, 8).subscribe();

    http.expectOne('/api/haberes/core/cursoCargo/periodoany/2026/8').flush([]);
  });

  it('envía el lote de legajos a fusionar', () => {
    service.fusionarLote([1, 2, 3], 2026, 8).subscribe();

    const req = http.expectOne('/api/haberes/core/designaciontool/periodo/fusionar/2026/8');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ legajos: [1, 2, 3] });
    req.flush({ procesados: 3, fallidos: [] });
  });

  it('envía el lote de legajos a duplicar y a recalcular desarraigo', () => {
    service.duplicarLote([4, 5], 2026, 8).subscribe();
    const duplicar = http.expectOne('/api/haberes/core/designaciontool/periodo/duplicar/2026/8');
    expect(duplicar.request.body).toEqual({ legajos: [4, 5] });
    duplicar.flush({ procesados: 2, fallidos: [] });

    service.desarraigoLote([6], 2026, 8).subscribe();
    const desarraigo = http.expectOne('/api/haberes/core/designaciontool/periodo/desarraigo/2026/8');
    expect(desarraigo.request.body).toEqual({ legajos: [6] });
    desarraigo.flush({ procesados: 1, fallidos: [] });
  });

  it('depura las fusiones huérfanas del período', () => {
    service.depurar(2026, 8).subscribe();

    const req = http.expectOne('/api/haberes/core/designaciontool/periodo/depurar/2026/8');
    expect(req.request.method).toBe('POST');
    req.flush(null);
  });
});
