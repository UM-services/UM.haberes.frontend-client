import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_URL } from '@haberes/shared-api';
import { SeguridadService } from './seguridad.service';

describe('SeguridadService', () => {
  let service: SeguridadService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: '/api/haberes' },
      ],
    });
    service = TestBed.inject(SeguridadService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('carga el catálogo desde el core', () => {
    service.catalogo().subscribe();
    http.expectOne('/api/haberes/core/permiso/').flush([]);
  });

  it('carga los permisos efectivos de un legajo', () => {
    service.permisosEfectivos(725).subscribe();
    http.expectOne('/api/haberes/core/permisoEfectivo/usuario/725').flush({
      legajoId: 725,
      permisos: [],
      administrador: true,
    });
  });

  it('aplica el sync con dry-run', () => {
    service.sync(true).subscribe();
    const req = http.expectOne('/api/haberes/core/permiso/sync');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ dryRun: true });
    req.flush({});
  });
});
