import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AsignacionCursosService } from './asig-cursos.service';

describe('AsignacionCursosService', () => {
  let service: AsignacionCursosService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AsignacionCursosService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(AsignacionCursosService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('pide las sedes (geográficas) al core', () => {
    service.getSedes().subscribe();

    http.expectOne('/api/haberes/core/geografica/').flush([]);
  });

  it('filtra cursos partiendo el texto en palabras (condiciones AND)', () => {
    service
      .getCursosFiltrados(2, 5, '  mate   primero  ')
      .subscribe();

    const req = http.expectOne('/api/haberes/core/curso/geografica/2/5');
    expect(req.request.method).toBe('POST');
    // Cada palabra es una condición AND; espacios múltiples no generan vacíos.
    expect(req.request.body).toEqual(['mate', 'primero']);
    req.flush([]);
  });

  it('no envía condiciones si el filtro está vacío', () => {
    service.getCursosFiltrados(2, 5, '   ').subscribe();

    const req = http.expectOne('/api/haberes/core/curso/geografica/2/5');
    expect(req.request.body).toEqual([]);
    req.flush([]);
  });

  it('pide los cargos titulares y contratados del curso', () => {
    service.getCargosTitulares(10, 2026, 8).subscribe();
    http.expectOne('/api/haberes/core/cursoCargo/curso/10/2026/8').flush([]);

    service.getCargosContratados(10, 2026, 8).subscribe();
    http.expectOne('/api/haberes/core/cursoCargoContratado/curso/10/2026/8').flush([]);
  });

  it('pide las novedades pendientes de alta y de baja', () => {
    service.getCargosAlta(10, 2026, 8).subscribe();
    http.expectOne('/api/haberes/core/cursocargonovedad/cursopendientealta/10/2026/8').flush([]);

    service.getCargosBaja(10, 2026, 8).subscribe();
    http.expectOne('/api/haberes/core/cursocargonovedad/cursopendientebaja/10/2026/8').flush([]);
  });

  it('envía la novedad como cuerpo del POST', () => {
    const novedad = { legajoId: 123, cursoId: 10, anho: 2026, mes: 8 };
    service.addNovedad(novedad).subscribe();

    const req = http.expectOne('/api/haberes/core/cursocargonovedad/');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(novedad);
    req.flush({ ok: true });
  });

  it('pide la acreditación del período antes de asignar', () => {
    service.getAcreditacion(2026, 8).subscribe();

    http.expectOne('/api/haberes/core/acreditacion/periodo/2026/8').flush({ acreditado: true });
  });
});
