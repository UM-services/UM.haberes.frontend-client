import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';

import { AuthService, Persona } from './auth.service';
import { ChangePasswordRequest } from './auth.models';

const SESSION_KEY = 'haberes_user';

describe('AuthService', () => {
  let http: HttpTestingController;

  const persona: Persona = {
    legajoId: 123,
    apellido: 'García',
    nombre: 'Ana',
    apellidoNombre: 'García, Ana',
    sede: 'Sede Central',
  };

  const usuario = {
    legajoId: 123,
    usuarioId: 7,
    facultadId: 3,
  };

  const cambio: ChangePasswordRequest = {
    legajoId: 123,
    currentPassword: 'vieja',
    newPassword: 'nueva',
    reClaveNueva: 'nueva',
  };

  const crearServicio = () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'login', children: [] },
          { path: 'inicio', children: [] },
        ]),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    return TestBed.inject(AuthService);
  };

  /** Flushea la revalidación de sesión (persona + usuario + facultad opcional). */
  const flushSession = (facultad?: { nombre: string } | null) => {
    http.expectOne('/api/haberes/core/persona/123').flush(persona);
    http.expectOne('/api/haberes/core/usuario/123').flush(usuario);
    if (facultad) {
      http.expectOne('/api/haberes/core/facultad/3').flush(facultad);
    }
  };

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => http.verify());

  it('changePassword envía PUT /usuario/cambiarclave con el payload exacto', () => {
    const service = crearServicio();
    let completed = false;
    service.changePassword(cambio).subscribe(() => (completed = true));

    const req = http.expectOne('/api/haberes/core/usuario/cambiarclave');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(cambio);
    req.flush(null);

    expect(completed).toBe(true);
  });

  it('changePassword propaga el ProblemDetail (detail) del 400 de negocio', () => {
    const service = crearServicio();
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

  it('persiste solo el legajoId: la facultad no queda en localStorage', () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ version: 2, legajoId: 123 }));
    const service = crearServicio();
    const sessions: Array<Persona | null> = [];

    // Antes de revalidar solo hay una sesión mínima, sin facultad.
    expect(service.currentUserValue?.legajoId).toBe(123);
    expect(service.currentUserValue?.facultadId).toBeUndefined();

    service.ensureSession().subscribe((value) => sessions.push(value));
    flushSession({ nombre: 'Ingeniería' });

    expect(sessions[0]).not.toBeNull();
    expect(service.facultadId()).toBe(3);
    expect(JSON.parse(localStorage.getItem(SESSION_KEY) ?? '{}')).toEqual({
      version: 2,
      legajoId: 123,
    });
  });

  it('ignora una facultad manipulada en localStorage y usa la del backend', () => {
    // Formato viejo con facultadId adulterado (null para simular un admin).
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ legajoId: 123, apellido: 'García', nombre: 'Ana', facultadId: null }),
    );
    const service = crearServicio();
    const sessions: Array<Persona | null> = [];

    service.ensureSession().subscribe((value) => sessions.push(value));
    flushSession({ nombre: 'Ingeniería' });

    expect(sessions[0]?.facultadId).toBe(3);
    expect(service.facultadId()).toBe(3);
    // El formato viejo se migra descartando todo lo que no sea el legajo.
    expect(JSON.parse(localStorage.getItem(SESSION_KEY) ?? '{}')).toEqual({
      version: 2,
      legajoId: 123,
    });
  });

  it('sin legajo persistido no hay sesión', () => {
    const service = crearServicio();
    const sessions: Array<Persona | null> = [];

    service.ensureSession().subscribe((value) => sessions.push(value));

    expect(sessions[0]).toBeNull();
    expect(service.facultadId()).toBeNull();
  });

  it('si el usuario dejó de existir limpia la sesión persistida', () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ version: 2, legajoId: 123 }));
    const service = crearServicio();
    const sessions: Array<Persona | null> = [];

    service.ensureSession().subscribe((value) => sessions.push(value));
    http.expectOne('/api/haberes/core/persona/123').flush(persona);
    http.expectOne('/api/haberes/core/usuario/123').flush({ legajoId: 123 });

    expect(sessions[0]).toBeNull();
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
    expect(service.currentUserValue).toBeNull();
  });

  it('ensureSession cachea el resultado validado y no repite consultas', () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ version: 2, legajoId: 123 }));
    const service = crearServicio();
    const sessions: Array<Persona | null> = [];

    service.ensureSession().subscribe((value) => sessions.push(value));
    flushSession({ nombre: 'Ingeniería' });

    service.ensureSession().subscribe((value) => sessions.push(value));

    // http.verify() en afterEach falla si hubo una segunda tanda de requests.
    expect(sessions[1]?.legajoId).toBe(123);
    expect(sessions[1]?.facultadId).toBe(3);
  });

  it('un usuario sin facultad expone facultadId null', () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ version: 2, legajoId: 123 }));
    const service = crearServicio();
    const sessions: Array<Persona | null> = [];

    service.ensureSession().subscribe((value) => sessions.push(value));
    http.expectOne('/api/haberes/core/persona/123').flush(persona);
    http.expectOne('/api/haberes/core/usuario/123').flush({ legajoId: 123, usuarioId: 7 });

    expect(sessions[0]?.facultadId).toBeNull();
    expect(service.facultadId()).toBeNull();
  });

  it('logout limpia la sesión persistida y publicada', () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ version: 2, legajoId: 123 }));
    const service = crearServicio();

    service.ensureSession().subscribe();
    http.expectOne('/api/haberes/core/persona/123').flush(persona);
    http.expectOne('/api/haberes/core/usuario/123').flush({ legajoId: 123, usuarioId: 7 });

    service.logout();

    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
    expect(service.currentUserValue).toBeNull();
  });
});
