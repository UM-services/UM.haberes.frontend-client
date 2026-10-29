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

  // --- Módulo global: catálogos y CRUD de cursos ---

  it('pide facultades y niveles para los selectores del módulo global', () => {
    service.getFacultades().subscribe();
    http.expectOne('/api/haberes/core/facultad/').flush([]);

    service.getNiveles().subscribe();
    http.expectOne('/api/haberes/core/nivel/').flush([]);
  });

  it('crea el curso con el cuerpo del POST', () => {
    const curso = {
      nombre: 'Análisis Matemático I',
      facultadId: 2,
      geograficaId: 5,
      anual: 0,
      semestre1: 1,
      semestre2: 0,
      nivelId: 1,
      adicionalCargaHoraria: 0
    };
    service.addCurso(curso).subscribe();

    const req = http.expectOne('/api/haberes/core/curso/');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(curso);
    req.flush({ cursoId: 10 });
  });

  it('actualiza el curso y elimina por id', () => {
    const curso = {
      nombre: 'Análisis Matemático I',
      facultadId: 2,
      geograficaId: 5,
      anual: 1,
      semestre1: 0,
      semestre2: 0,
      nivelId: 1,
      adicionalCargaHoraria: 1
    };
    service.updateCurso(10, curso).subscribe();
    const put = http.expectOne('/api/haberes/core/curso/10');
    expect(put.request.method).toBe('PUT');
    expect(put.request.body).toEqual(curso);
    put.flush({});

    service.deleteCurso(10).subscribe();
    const del = http.expectOne('/api/haberes/core/curso/10');
    expect(del.request.method).toBe('DELETE');
    del.flush(null);
  });

  it('delega en el servidor la invalidación de la fusión del curso', () => {
    service.invalidarFusionCurso(10, 2026, 8).subscribe();

    const req = http.expectOne('/api/haberes/core/designaciontool/invalidafusion/curso/10/2026/8');
    expect(req.request.method).toBe('POST');
    req.flush(null);
  });

  it('consulta los cargos del curso en cualquier período y elimina un cargo', () => {
    service.getCargosCursoAny(10).subscribe();
    http.expectOne('/api/haberes/core/cursoCargo/cursoany/10').flush([]);

    service.eliminarCargo(99).subscribe();
    const req = http.expectOne('/api/haberes/core/cursoCargo/99');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
