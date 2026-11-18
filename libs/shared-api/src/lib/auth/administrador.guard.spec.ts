import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { firstValueFrom, Observable, of } from 'rxjs';

import { SIN_ACCESO_RUTA } from '../acceso.constants';
import { administradorGuard } from './administrador.guard';
import { AuthService, Persona } from './auth.service';

describe('administradorGuard', () => {
  const persona = (facultadId: number | null, administrador: number): Persona => ({
    legajoId: 123,
    apellido: 'García',
    nombre: 'Ana',
    facultadId,
    administrador,
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

  const ejecutar = (): Promise<boolean | UrlTree> =>
    TestBed.runInInjectionContext(() =>
      firstValueFrom(administradorGuard({} as never, {} as never) as Observable<boolean | UrlTree>),
    );

  it('deja entrar al usuario global con administrador = 1', async () => {
    const { auth, navigate } = setup(persona(null, 1));

    await expect(ejecutar()).resolves.toBe(true);
    expect(auth.ensureSession).toHaveBeenCalledTimes(1);
    expect(auth.clearSession).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('deniega al usuario global sin el flag', async () => {
    const { auth, navigate } = setup(persona(null, 0));

    const resultado = await ejecutar();
    expect(resultado).toBeInstanceOf(UrlTree);
    expect((resultado as UrlTree).toString()).toContain(SIN_ACCESO_RUTA);
    expect(auth.clearSession).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('deniega al usuario con facultad aunque tenga el flag', async () => {
    const { auth } = setup(persona(3, 1));

    const resultado = await ejecutar();
    expect(resultado).toBeInstanceOf(UrlTree);
    expect(auth.clearSession).not.toHaveBeenCalled();
  });

  it('deniega sin sesión', async () => {
    setup(null);

    const resultado = await ejecutar();
    expect(resultado).toBeInstanceOf(UrlTree);
    expect((resultado as UrlTree).toString()).toContain(SIN_ACCESO_RUTA);
  });
});
