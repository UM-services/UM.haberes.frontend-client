import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { firstValueFrom, Observable, of } from 'rxjs';

import { AuthService, Persona } from './auth.service';
import { facultadSimuladaGuard } from './facultad-simulada.guard';

describe('facultadSimuladaGuard', () => {
  const administrador: Persona = {
    legajoId: 725,
    apellido: 'Admin',
    nombre: 'Haberes',
    facultadId: null,
    administrador: 1,
  };

  const setup = (user: Persona | null, simulando: boolean) => {
    const auth = {
      ensureSession: vi.fn(() => of(user)),
      simulandoFacultad: vi.fn(() => simulando),
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
      firstValueFrom(
        facultadSimuladaGuard({} as never, {} as never) as Observable<boolean | UrlTree>,
      ),
    );

  it('deja entrar cuando hay una facultad simulada activa', async () => {
    const { auth, navigate } = setup(administrador, true);

    await expect(ejecutar()).resolves.toBe(true);
    expect(auth.ensureSession).toHaveBeenCalledTimes(1);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('sin facultad elegida vuelve al directorio sin cerrar la sesión', async () => {
    const { auth, navigate } = setup(administrador, false);

    const resultado = await ejecutar();

    expect(resultado).toBeInstanceOf(UrlTree);
    expect((resultado as UrlTree).toString()).toContain('/inicio');
    expect(auth.ensureSession).toHaveBeenCalledTimes(1);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('sin sesión redirige al login', async () => {
    const { navigate } = setup(null, false);

    await expect(ejecutar()).resolves.toBe(false);
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });
});
