import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_URL } from '@haberes/shared-api';

import { CodigosService } from './codigos.service';

describe('CodigosService', () => {
  let service: CodigosService;
  let http: HttpTestingController;

  const codigo = {
    codigoId: 10,
    nombre: 'Sueldo',
    docente: 1,
    noDocente: 1,
    transferible: 0,
    incluidoEtec: 0,
    afipConceptoSueldoIdPrimerSemestre: null,
    afipConceptoSueldoIdSegundoSemestre: null,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: '/api/haberes' },
      ],
    });
    service = TestBed.inject(CodigosService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lista códigos y grupos', () => {
    service.getCodigos().subscribe();
    http.expectOne('/api/haberes/core/codigo/').flush([codigo]);

    service.getGrupos().subscribe();
    http.expectOne('/api/haberes/core/codigogrupo/').flush([]);
  });

  it('devuelve null cuando el código no tiene grupo (404)', () => {
    let resultado: unknown = 'pendiente';
    service.getGrupo(10).subscribe((v) => (resultado = v));

    http
      .expectOne('/api/haberes/core/codigogrupo/10')
      .flush({ detail: 'not found' }, { status: 404, statusText: 'Not Found' });

    expect(resultado).toBeNull();
  });

  it('crea o actualiza el grupo según exista', () => {
    const grupo = { codigoId: 10, remunerativo: 1, noRemunerativo: 0, deduccion: 0, total: 0 };
    service.saveGrupo(grupo, false).subscribe();
    const post = http.expectOne('/api/haberes/core/codigogrupo/');
    expect(post.request.method).toBe('POST');
    post.flush(grupo);

    service.saveGrupo(grupo, true).subscribe();
    const put = http.expectOne('/api/haberes/core/codigogrupo/10');
    expect(put.request.method).toBe('PUT');
    put.flush(grupo);
  });

  it('busca conceptos AFIP con condiciones AND', () => {
    service.searchAfip(['sueldo', 'basico']).subscribe();
    const req = http.expectOne('/api/haberes/core/afipConceptoSueldo/search');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(['sueldo', 'basico']);
    req.flush([]);
  });
});
