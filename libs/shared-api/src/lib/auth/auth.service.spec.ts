import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';

import { AuthService, Persona } from './auth.service';
import { ChangePasswordRequest } from './auth.models';

describe('AuthService (changePassword)', () => {
  let http: HttpTestingController;

  const persona: Persona = {
    legajoId: 123,
    apellido: 'García',
    nombre: 'Ana',
    apellidoNombre: 'García, Ana',
    sede: 'Sede Central',
  };

  const cambio: ChangePasswordRequest = {
    legajoId: 123,
    currentPassword: 'vieja',
    newPassword: 'nueva',
    reClaveNueva: 'nueva',
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('changePassword envía PUT /usuario/cambiarclave con el payload exacto', () => {
    const service = TestBed.inject(AuthService);
    let completed = false;
    service.changePassword(cambio).subscribe(() => (completed = true));

    const req = http.expectOne('/api/haberes/core/usuario/cambiarclave');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(cambio);
    req.flush(null);

    expect(completed).toBe(true);
  });

  it('changePassword propaga el ProblemDetail (detail) del 400 de negocio', () => {
    const service = TestBed.inject(AuthService);
    // Holder coleccionable: evita el narrowing de TS sobre asignaciones en closures
    const errorBodies: Array<{ status?: number; detail?: string }> = [];
    service
      .changePassword({ ...cambio, currentPassword: 'mala' })
      .subscribe({ error: (err) => errorBodies.push((err as HttpErrorResponse).error) });

    const req = http.expectOne('/api/haberes/core/usuario/cambiarclave');
    req.flush(
      {
        type: 'about:blank',
        title: 'Bad Request',
        status: 400,
        detail: 'ERROR: Usuario NO Autenticado',
      },
      { status: 400, statusText: 'Bad Request' },
    );

    expect(errorBodies[0]?.detail).toBe('ERROR: Usuario NO Autenticado');
  });

  it('currentUserValue hidrata la sesion y changePassword no la modifica', () => {
    localStorage.setItem('haberes_user', JSON.stringify(persona));
    const service = TestBed.inject(AuthService);
    expect(service.currentUserValue?.legajoId).toBe(123);

    service.changePassword(cambio).subscribe();
    http.expectOne('/api/haberes/core/usuario/cambiarclave').flush(null);

    expect(JSON.parse(localStorage.getItem('haberes_user') ?? '{}')).toEqual(persona);
  });
});
