import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AsignacionesEtecService } from './asignaciones-etec.service';
import {
  AsignacionEtec,
  AsignacionEtecRequest,
  CatalogosEtec,
  CategoriaEtec
} from './asignaciones-etec.models';

describe('AsignacionesEtecService', () => {
  let service: AsignacionesEtecService;
  let http: HttpTestingController;

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

  const categoriaSinDocente: CategoriaEtec = {
    categoriaId: 3000,
    nombre: 'CARGO SIN DOCENTE',
    basico: 0,
    docente: 0,
    noDocente: 0,
    liquidaPorHora: 0,
    puntos: 500
  };

  const asignacion: AsignacionEtec = {
    asignacionCargoId: 12,
    legajoId: 100,
    categoriaId: 992,
    dependenciaId: 7,
    fechaAlta: '2026-11-01T00:00:00+0000',
    fechaBaja: null,
    observaciones: null,
    categoriaNombre: 'DIRECTOR ETEC',
    dependenciaNombre: 'SISTEMAS',
    personaApellido: 'PEREZ',
    personaNombre: 'ANA'
  };

  const body: AsignacionEtecRequest = {
    legajoId: 100,
    categoriaId: 992,
    dependenciaId: 7,
    fechaAlta: '2026-11-01T00:00:00+0000',
    fechaBaja: null,
    observaciones: null
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AsignacionesEtecService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(AsignacionesEtecService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('catalogos pide cargos ETEC y dependencias y filtra los que no son cargo con puntos', () => {
    let resultado: CatalogosEtec | undefined;
    service.catalogos().subscribe((r) => (resultado = r));

    http.expectOne('/api/haberes/etec/cargo/').flush([cargoEtec, categoriaComun, categoriaSinDocente]);
    http.expectOne('/api/haberes/core/dependencia/')
      .flush([{ dependenciaId: 7, nombre: 'SISTEMAS', acronimo: 'SIS' }]);

    expect(resultado?.cargos.map((cargo) => cargo.categoriaId)).toEqual([992]);
    expect(resultado?.dependencias.length).toBe(1);
  });

  it('asignaciones pide el listado por legajo', () => {
    let resultado: AsignacionEtec[] | undefined;
    service.asignaciones(100).subscribe((r) => (resultado = r));

    const req = http.expectOne('/api/haberes/etec/asignacion-cargo/legajo/100');
    expect(req.request.method).toBe('GET');
    req.flush([asignacion]);
    expect(resultado?.length).toBe(1);
  });

  it('crear hace POST con barra final, body y header de auditoría', () => {
    let resultado: AsignacionEtec | undefined;
    service.crear(body, 999).subscribe((r) => (resultado = r));

    const req = http.expectOne('/api/haberes/etec/asignacion-cargo/');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    expect(req.request.headers.get('X-Legajo-Solicitante')).toBe('999');
    req.flush(asignacion);
    expect(resultado?.asignacionCargoId).toBe(12);
  });

  it('actualizar hace PUT por id', () => {
    service.actualizar(12, body, null).subscribe();
    const req = http.expectOne('/api/haberes/etec/asignacion-cargo/12');
    expect(req.request.method).toBe('PUT');
    expect(req.request.headers.has('X-Legajo-Solicitante')).toBe(false);
    req.flush(asignacion);
  });

  it('eliminar hace DELETE por id', () => {
    service.eliminar(12, 999).subscribe();
    const req = http.expectOne('/api/haberes/etec/asignacion-cargo/12');
    expect(req.request.method).toBe('DELETE');
    expect(req.request.headers.get('X-Legajo-Solicitante')).toBe('999');
    req.flush(null);
  });

  it('valorPunto usa el endpoint opcional del control', () => {
    let resultado: { valorPuntoEtec: number | null } | null | undefined;
    service.valorPunto(2026, 11).subscribe((r) => (resultado = r));

    const req = http.expectOne('/api/haberes/core/control/periodo/2026/11/opcional');
    expect(req.request.method).toBe('GET');
    req.flush({ anho: 2026, mes: 11, valorPuntoEtec: 3000 });
    expect(resultado?.valorPuntoEtec).toBe(3000);
  });

  it('valorPunto tolera un período sin control', () => {
    let resultado: { valorPuntoEtec: number | null } | null | undefined;
    service.valorPunto(2026, 1).subscribe((r) => (resultado = r));

    http.expectOne('/api/haberes/core/control/periodo/2026/1/opcional').flush(null);
    expect(resultado).toBeNull();
  });
});
