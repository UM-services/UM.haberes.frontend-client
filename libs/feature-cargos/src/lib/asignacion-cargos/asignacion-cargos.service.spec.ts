import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AsignacionCargosService } from './asignacion-cargos.service';
import { Cargo, CargoRequest, CatalogosAsignacionCargo, PersonaFacultad } from './asignacion-cargos.models';

describe('AsignacionCargosService', () => {
  let service: AsignacionCargosService;
  let http: HttpTestingController;

  const cargo: Cargo = {
    cargoId: 15,
    legajoId: 100,
    fechaAlta: '2026-11-01T00:00:00+0000',
    fechaBaja: null,
    dependenciaId: 7,
    categoriaId: 3,
    jornada: 1,
    presentismo: 100,
    horasJornada: 0
  };

  const body: CargoRequest = {
    legajoId: 100,
    fechaAlta: '2026-11-01T00:00:00+0000',
    fechaBaja: null,
    dependenciaId: 7,
    categoriaId: 3,
    jornada: 1,
    presentismo: 100,
    horasJornada: 0
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AsignacionCargosService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(AsignacionCargosService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('catalogos pide categorías asignables, dependencias y facultades en paralelo', () => {
    let resultado: CatalogosAsignacionCargo | undefined;
    service.catalogos().subscribe((r) => (resultado = r));

    http.expectOne('/api/haberes/core/categoria/asignables').flush([]);
    http.expectOne('/api/haberes/core/dependencia/').flush([]);
    http.expectOne('/api/haberes/core/facultad/').flush([]);

    expect(resultado).toEqual({ categorias: [], dependencias: [], facultades: [] });
  });

  it('cargos pide el listado por legajo', () => {
    let resultado: Cargo[] | undefined;
    service.cargos(100).subscribe((r) => (resultado = r));

    const req = http.expectOne('/api/haberes/core/cargo/legajo/100');
    expect(req.request.method).toBe('GET');
    req.flush([cargo]);
    expect(resultado?.length).toBe(1);
  });

  it('agregarCargo hace POST con barra final, body y header de auditoría', () => {
    let resultado: Cargo | undefined;
    service.agregarCargo(body, 999).subscribe((r) => (resultado = r));

    const req = http.expectOne('/api/haberes/core/cargo/');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    expect(req.request.headers.get('X-Legajo-Solicitante')).toBe('999');
    req.flush(cargo);
    expect(resultado?.cargoId).toBe(15);
  });

  it('actualizarCargo hace PUT por id', () => {
    service.actualizarCargo(15, body, null).subscribe();
    const req = http.expectOne('/api/haberes/core/cargo/15');
    expect(req.request.method).toBe('PUT');
    expect(req.request.headers.has('X-Legajo-Solicitante')).toBe(false);
    req.flush(cargo);
  });

  it('eliminarCargo hace DELETE por id', () => {
    service.eliminarCargo(15, 999).subscribe();
    const req = http.expectOne('/api/haberes/core/cargo/15');
    expect(req.request.method).toBe('DELETE');
    expect(req.request.headers.get('X-Legajo-Solicitante')).toBe('999');
    req.flush(null);
  });

  it('facultadesDe pide las habilitadas del legajo', () => {
    let resultado: PersonaFacultad[] | undefined;
    service.facultadesDe(100).subscribe((r) => (resultado = r));

    const req = http.expectOne('/api/haberes/core/personaFacultad/persona/100');
    expect(req.request.method).toBe('GET');
    req.flush([{ personaFacultadId: 3, legajoId: 100, facultadId: 1 }]);
    expect(resultado?.length).toBe(1);
  });

  it('habilitarFacultad hace POST con legajo y facultad', () => {
    service.habilitarFacultad(100, 1, 999).subscribe();

    const req = http.expectOne('/api/haberes/core/personaFacultad/');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ legajoId: 100, facultadId: 1 });
    expect(req.request.headers.get('X-Legajo-Solicitante')).toBe('999');
    req.flush({ personaFacultadId: 3, legajoId: 100, facultadId: 1 });
  });

  it('quitarFacultad hace DELETE por unique', () => {
    service.quitarFacultad(100, 1, 999).subscribe();

    const req = http.expectOne('/api/haberes/core/personaFacultad/unique/100/1');
    expect(req.request.method).toBe('DELETE');
    expect(req.request.headers.get('X-Legajo-Solicitante')).toBe('999');
    req.flush(null);
  });
});
