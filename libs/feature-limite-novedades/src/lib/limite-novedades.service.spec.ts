import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_URL } from '@haberes/shared-api';

import { LimiteNovedadesService } from './limite-novedades.service';
import { Acreditacion } from './limite-novedades.models';

describe('LimiteNovedadesService', () => {
  let service: LimiteNovedadesService;
  let http: HttpTestingController;

  const acreditacion: Acreditacion = {
    acreditacionId: 145,
    anho: 2026,
    mes: 11,
    acreditado: 0,
    limiteNovedades: '2026-12-01T02:59:59Z',
    fechaContable: '2026-11-28T00:00:00Z',
    ordenContable: 3,
    sueldosOriginal: 152340000,
    sueldosAjustados: 155980000,
    contribucionesPatronales: 42110000,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: '/api/haberes' },
      ],
    });
    service = TestBed.inject(LimiteNovedadesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('consulta el período y devuelve el registro cuando existe', () => {
    let resultado: Acreditacion | null = null;
    service.getPeriodo(2026, 11).subscribe((periodo) => (resultado = periodo));

    const req = http.expectOne('/api/haberes/core/acreditacion/periodo/2026/11');
    expect(req.request.method).toBe('GET');
    req.flush(acreditacion);

    expect(resultado).toEqual(acreditacion);
  });

  it('traduce el 404 del período sin registro a null', () => {
    let resultado: Acreditacion | null | undefined;
    service.getPeriodo(2026, 12).subscribe((periodo) => (resultado = periodo));

    http
      .expectOne('/api/haberes/core/acreditacion/periodo/2026/12')
      .flush({ detail: 'Cannot find Acreditacion 12/2026' }, { status: 404, statusText: 'Not Found' });

    expect(resultado).toBeNull();
  });

  it('propaga los errores distintos de 404', () => {
    let estado: number | null = null;
    service.getPeriodo(2026, 11).subscribe({
      error: (error) => (estado = error.status),
    });

    http
      .expectOne('/api/haberes/core/acreditacion/periodo/2026/11')
      .flush({ detail: 'boom' }, { status: 500, statusText: 'Server Error' });

    expect(estado).toBe(500);
  });

  it('crea el período con POST y el límite como fin de día', () => {
    const request = {
      anho: 2026,
      mes: 12,
      limiteNovedades: '2026-12-15T23:59:59-0300',
    };

    service.crear(request).subscribe();

    const post = http.expectOne('/api/haberes/core/acreditacion/');
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual(request);
    post.flush({ ...acreditacion, ...request });
  });

  it('actualiza sólo el límite con PATCH', () => {
    const request = { limiteNovedades: '2026-11-30T23:59:59-0300' };

    service.actualizarLimite(request, 145).subscribe();

    const patch = http.expectOne('/api/haberes/core/acreditacion/145');
    expect(patch.request.method).toBe('PATCH');
    expect(patch.request.body).toEqual(request);
    patch.flush(acreditacion);
  });
});
