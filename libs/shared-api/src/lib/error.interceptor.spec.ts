import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { vi } from 'vitest';
import { AccesoDenegadoService } from './acceso-denegado.service';
import { AuthService } from './auth/auth.service';
import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor (haberes)', () => {
  let http: HttpClient;
  let requests: HttpTestingController;
  let accesoDenegado: AccesoDenegadoService;
  let authService: { clearSession: ReturnType<typeof vi.fn> };
  let router: { url: string; navigate: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    authService = { clearSession: vi.fn() };
    router = { url: '/novedades/anotador', navigate: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    });
    http = TestBed.inject(HttpClient);
    requests = TestBed.inject(HttpTestingController);
    accesoDenegado = TestBed.inject(AccesoDenegadoService);
  });

  afterEach(() => requests.verify());

  it('un 401 de datos cierra la sesión y vuelve al login con el motivo', () => {
    http.get('/api/haberes/core/persona/1').subscribe({ error: () => undefined });
    requests
      .expectOne('/api/haberes/core/persona/1')
      .flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(authService.clearSession).toHaveBeenCalledOnce();
    expect(router.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/novedades/anotador', motivo: 'sesion-expirada' },
    });
  });

  it('un 403 NO cierra la sesión ni navega: publica el detalle', () => {
    http.get('/api/haberes/core/novedad').subscribe({ error: () => undefined });
    requests
      .expectOne('/api/haberes/core/novedad')
      .flush({ detail: 'No autorizado' }, { status: 403, statusText: 'Forbidden' });

    expect(authService.clearSession).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
    expect(accesoDenegado.detalle()?.mensaje).toBe('No autorizado');
  });

  it('ignora el 401/403 del propio login y de la validación de credenciales', () => {
    http.post('/api/haberes/core/usuario/isuservalid', {}).subscribe({ error: () => undefined });
    requests
      .expectOne('/api/haberes/core/usuario/isuservalid')
      .flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(authService.clearSession).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
