import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { firstValueFrom, Observable, of } from 'rxjs';

import { AuthService, Persona } from './auth.service';
import { moduloGuard } from './modulo.guard';

describe('moduloGuard', () => {
  const persona = (facultadId: number | null): Persona => ({
    legajoId: 123,
    apellido: 'García',
    nombre: 'Ana',
    facultadId,
  });

  const setup = (user: Persona | null) => {
    const auth = {
      ensureSession: vi.fn(() => of(user)),
      clearSession: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
    });

    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    return { auth, navigate };
  };

  const ejecutar = (data: Record<string, unknown>): Promise<boolean> =>
    TestBed.runInInjectionContext(() =>
      firstValueFrom(
        moduloGuard(
          { data } as unknown as ActivatedRouteSnapshot,
          {} as RouterStateSnapshot,
        ) as Observable<boolean>,
      ),
    );

  it('con requireFacultadId true deja entrar a un usuario con facultad', async () => {
    const { auth, navigate } = setup(persona(3));

    await expect(ejecutar({ requireFacultadId: true })).resolves.toBe(true);
    expect(auth.ensureSession).toHaveBeenCalledTimes(1);
    expect(auth.clearSession).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('con requireFacultadId true rechaza a un usuario sin facultad', async () => {
    const { auth, navigate } = setup(persona(null));

    await expect(ejecutar({ requireFacultadId: true })).resolves.toBe(false);
    expect(auth.clearSession).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });

  it('con requireFacultadId false deja entrar a un usuario sin facultad', async () => {
    const { auth, navigate } = setup(persona(null));

    await expect(ejecutar({ requireFacultadId: false })).resolves.toBe(true);
    expect(auth.clearSession).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('con requireFacultadId false rechaza a un usuario con facultad', async () => {
    const { auth, navigate } = setup(persona(3));

    await expect(ejecutar({ requireFacultadId: false })).resolves.toBe(false);
    expect(auth.clearSession).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });

  it('sin requireFacultadId sólo exige sesión, sin mirar la facultad', async () => {
    const { auth, navigate } = setup(persona(3));

    await expect(ejecutar({})).resolves.toBe(true);
    expect(auth.clearSession).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('sin sesión redirige al login', async () => {
    const { auth, navigate } = setup(null);

    await expect(ejecutar({ requireFacultadId: false })).resolves.toBe(false);
    expect(auth.clearSession).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });
});
