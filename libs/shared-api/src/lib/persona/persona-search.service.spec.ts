import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { PersonaSearchService } from './persona-search.service';

describe('PersonaSearchService', () => {
  let service: PersonaSearchService;
  let http: HttpTestingController;

  const persona = {
    legajoId: 123,
    documento: 30123456,
    apellido: 'García',
    nombre: 'Ana',
    apellidoNombre: 'García, Ana'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(PersonaSearchService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('searchPersonas envía las palabras separadas por espacio (collectionSearch legacy)', () => {
    let resultado: unknown;
    service.searchPersonas('  garcía   ana ').subscribe((v) => (resultado = v));

    const req = http.expectOne('/api/haberes/core/persona/search');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(['garcía', 'ana']);
    req.flush([persona]);

    expect(resultado).toEqual([persona]);
  });

  it('searchPersonas con cadena vacía no realiza ninguna petición', () => {
    let resultado: unknown;
    service.searchPersonas('   ').subscribe((v) => (resultado = v));

    expect(resultado).toEqual([]);
    http.expectNone('/api/haberes/core/persona/search');
  });

  it('getPersonaByLegajo realiza GET /persona/{legajoId} (findByLegajoId legacy)', () => {
    let resultado: unknown;
    service.getPersonaByLegajo(123).subscribe((v) => (resultado = v));

    const req = http.expectOne('/api/haberes/core/persona/123');
    expect(req.request.method).toBe('GET');
    req.flush(persona);

    expect(resultado).toEqual(persona);
  });

  it('getPersonaByDocumento realiza GET /persona/documento/{documento} (findByDocumento legacy)', () => {
    let resultado: unknown;
    service.getPersonaByDocumento(30123456).subscribe((v) => (resultado = v));

    const req = http.expectOne('/api/haberes/core/persona/documento/30123456');
    expect(req.request.method).toBe('GET');
    req.flush(persona);

    expect(resultado).toEqual(persona);
  });

  it('buscar prioriza las coincidencias de texto y no consulta el legajo', () => {
    let resultado: unknown;
    service.buscar('123').subscribe((v) => (resultado = v));

    const post = http.expectOne('/api/haberes/core/persona/search');
    expect(post.request.body).toEqual(['123']);
    post.flush([persona]);

    expect(resultado).toEqual([persona]);
    http.expectNone('/api/haberes/core/persona/123');
  });

  it('buscar con término numérico sin coincidencias cae al legajo exacto', () => {
    let resultado: unknown;
    service.buscar('123').subscribe((v) => (resultado = v));

    http.expectOne('/api/haberes/core/persona/search').flush([]);

    const get = http.expectOne('/api/haberes/core/persona/123');
    get.flush(persona);

    expect(resultado).toEqual([persona]);
  });

  it('buscar con término no numérico sin coincidencias devuelve vacío sin segundo request', () => {
    let resultado: unknown;
    service.buscar('garcía').subscribe((v) => (resultado = v));

    http.expectOne('/api/haberes/core/persona/search').flush([]);

    expect(resultado).toEqual([]);
  });
});
