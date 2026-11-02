import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { DesignacionesService } from './designaciones.service';

describe('DesignacionesService', () => {
  let service: DesignacionesService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DesignacionesService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(DesignacionesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('en modo global pide los cursos del legajo sin filtrar por facultad', () => {
    service.getCursosCargo(120, 2026, 8, null).subscribe();

    http.expectOne('/api/haberes/core/cursoCargo/legajo/120/2026/8').flush([]);
  });

  it('en modo facultad pide los cursos acotados a la facultad', () => {
    service.getCursosCargo(120, 2026, 8, 3).subscribe();

    http.expectOne('/api/haberes/core/cursoCargo/facultad/120/2026/8/3').flush([]);
  });

  it('en modo global pide las fusiones del legajo sin filtrar por facultad', () => {
    service.getCursosFusion(120, 2026, 8, null).subscribe();

    http.expectOne('/api/haberes/core/cursofusion/legajo/120/2026/8').flush([]);
  });

  it('en modo facultad pide las fusiones acotadas a la facultad', () => {
    service.getCursosFusion(120, 2026, 8, 3).subscribe();

    http.expectOne('/api/haberes/core/cursofusion/legajofacultad/120/2026/8/3').flush([]);
  });

  it('pide los cargos docentes liquidados del período', () => {
    service.getCargoLiquidacionDocente(120, 2026, 7).subscribe();

    http.expectOne('/api/haberes/core/cargoliquidacion/legajodocente/120/2026/7').flush([]);
  });

  it('pide la diferencia de designaciones como novedad de código 27 sin dependencia', () => {
    service.getDiferenciaDesignaciones(120, 2026, 8).subscribe();

    http.expectOne('/api/haberes/core/novedad/unique/120/2026/8/27/null').flush(null);
  });

  it('dispara el recálculo de designaciones del legajo', () => {
    service.redesignar(120, 2026, 8).subscribe();

    const req = http.expectOne('/api/haberes/core/designaciontool/redesignarbylegajo/120/2026/8');
    expect(req.request.method).toBe('GET');
    req.flush(null);
  });

  it('envía el flag forzar en el cuerpo del POST de fusión', () => {
    service.fusionar(120, 2026, 8, true).subscribe();

    const req = http.expectOne('/api/haberes/core/designaciontool/fusionar/120/2026/8');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ forzar: true });
    req.flush(null);
  });

  it('descarga el detalle de designaciones como PDF', () => {
    service.descargarDetalle(120, 2026, 8).subscribe();

    const req = http.expectOne('/api/haberes/report/designacionesDetalle/120/2026/8');
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob(['pdf']));
  });

  it('resuelve los catálogos contra el core', () => {
    service.getFacultades().subscribe();
    http.expectOne('/api/haberes/core/facultad/').flush([]);

    service.getGeograficas().subscribe();
    http.expectOne('/api/haberes/core/geografica/').flush([]);

    service.getDependencias().subscribe();
    http.expectOne('/api/haberes/core/dependencia/').flush([]);

    service.getCategorias().subscribe();
    http.expectOne('/api/haberes/core/categoria/').flush([]);

    service.getCargoTipos().subscribe();
    http.expectOne('/api/haberes/core/cargotipo/').flush([]);

    service.getDesignacionTipos().subscribe();
    http.expectOne('/api/haberes/core/designaciontipo/').flush([]);
  });
});
