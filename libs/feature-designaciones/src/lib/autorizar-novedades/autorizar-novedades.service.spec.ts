import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AutorizarNovedadesService } from './autorizar-novedades.service';

describe('AutorizarNovedadesService', () => {
  let service: AutorizarNovedadesService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AutorizarNovedadesService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(AutorizarNovedadesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('carga los seis padrones del período', () => {
    service.getPadrones(2026, 8).subscribe();

    http.expectOne('/api/haberes/core/cursocargonovedad/pendientealta/2026/8').flush([]);
    http.expectOne('/api/haberes/core/cursocargonovedad/pendientebaja/2026/8').flush([]);
    http.expectOne('/api/haberes/core/cursocargonovedad/autorizadoalta/2026/8').flush([]);
    http.expectOne('/api/haberes/core/cursocargonovedad/autorizadobaja/2026/8').flush([]);
    http.expectOne('/api/haberes/core/cursocargonovedad/rechazadoalta/2026/8').flush([]);
    http.expectOne('/api/haberes/core/cursocargonovedad/rechazadobaja/2026/8').flush([]);
  });

  it('ordena cada padrón por apellido y nombre del docente', () => {
    let resultado: any;
    service.getPadrones(2026, 8).subscribe((padrones) => (resultado = padrones));

    const pendiente = (id: number, apellido: string, nombre: string) => ({
      cursoCargoNovedadId: id,
      legajoId: id,
      persona: { legajoId: id, apellido, nombre }
    });

    http.expectOne('/api/haberes/core/cursocargonovedad/pendientealta/2026/8')
      .flush([pendiente(1, 'Zárate', 'Ana'), pendiente(2, 'Álvarez', 'Beto')]);
    http.expectOne('/api/haberes/core/cursocargonovedad/pendientebaja/2026/8').flush([]);
    http.expectOne('/api/haberes/core/cursocargonovedad/autorizadoalta/2026/8').flush([]);
    http.expectOne('/api/haberes/core/cursocargonovedad/autorizadobaja/2026/8').flush([]);
    http.expectOne('/api/haberes/core/cursocargonovedad/rechazadoalta/2026/8').flush([]);
    http.expectOne('/api/haberes/core/cursocargonovedad/rechazadobaja/2026/8').flush([]);

    expect(resultado.pendienteAlta.map((n: any) => n.legajoId)).toEqual([2, 1]);
  });

  it('autoriza con la respuesta en el cuerpo del POST', () => {
    service.autorizar(7, 'Conforme').subscribe();

    const req = http.expectOne('/api/haberes/core/cursocargonovedad/autorizar/7');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ respuesta: 'Conforme' });
    req.flush(null);
  });

  it('rechaza con la respuesta en el cuerpo del POST', () => {
    service.rechazar(7, 'Sin documentación').subscribe();

    const req = http.expectOne('/api/haberes/core/cursocargonovedad/rechazar/7');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ respuesta: 'Sin documentación' });
    req.flush(null);
  });

  it('anula la novedad sin cuerpo relevante', () => {
    service.anular(7).subscribe();

    const req = http.expectOne('/api/haberes/core/cursocargonovedad/anular/7');
    expect(req.request.method).toBe('POST');
    req.flush(null);
  });

  it('descarga el padrón completo de novedades del período', () => {
    service.descargarPeriodo(2026, 8).subscribe();

    const req = http.expectOne('/api/haberes/report/cursocargonovedad/periodo/2026/8');
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob(['pdf']));
  });

  it('descarga el padrón de novedades pendientes', () => {
    service.descargarPendientes(2026, 8).subscribe();

    const req = http.expectOne('/api/haberes/report/cursocargonovedad/pendientes/2026/8');
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob(['pdf']));
  });
});
