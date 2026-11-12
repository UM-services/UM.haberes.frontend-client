import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_URL } from '@haberes/shared-api';

import { UsuariosService } from './usuarios.service';

describe('UsuariosService', () => {
  let service: UsuariosService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: '/api/haberes' },
      ],
    });
    service = TestBed.inject(UsuariosService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lista los usuarios sin pedir query params', () => {
    service.getUsuarios().subscribe();

    const req = http.expectOne('/api/haberes/core/usuario/');
    expect(req.request.method).toBe('GET');
    req.flush([{ legajoId: 725, usuarioId: 9, facultadId: null, administrador: 1 }]);
  });

  it('resuelve los nombres de las personas en lote', () => {
    service.getPersonas([725, 1515]).subscribe();

    const req = http.expectOne('/api/haberes/core/persona/legajos');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual([725, 1515]);
    req.flush([{ legajoId: 725, apellido: 'Quinteros', nombre: 'Daniel' }]);
  });

  it('actualiza el flag con legajo y valor en la ruta', () => {
    service.setAdministrador(725, 0).subscribe();

    const req = http.expectOne('/api/haberes/core/usuario/725/administrador/0');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toBeNull();
    req.flush({ legajoId: 725, usuarioId: 9, facultadId: null, administrador: 0 });
  });
});
