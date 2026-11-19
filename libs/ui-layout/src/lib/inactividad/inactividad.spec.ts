import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService, INACTIVIDAD_CONFIG } from '@haberes/shared-api';
import { InactividadComponent } from './inactividad';

describe('InactividadComponent (haberes)', () => {
  let authService: {
    currentUser$: Observable<{ legajoId: number }>;
    logout: ReturnType<typeof vi.fn>;
  };
  let fixture: ComponentFixture<InactividadComponent> | null = null;

  beforeEach(() => {
    vi.useFakeTimers();
    authService = { currentUser$: of({ legajoId: 1 }), logout: vi.fn() };
    TestBed.configureTestingModule({
      imports: [InactividadComponent],
      providers: [
        { provide: AuthService, useValue: authService },
        {
          provide: INACTIVIDAD_CONFIG,
          useValue: { enabled: true, avisoMs: 1_000, graciaMs: 3_000 },
        },
      ],
    });
  });

  afterEach(() => {
    fixture?.destroy();
    fixture = null;
    vi.useRealTimers();
  });

  function crear(): InactividadComponent {
    fixture = TestBed.createComponent(InactividadComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('avisa después del tiempo sin actividad y al agotarse no desloguea', () => {
    const componente = crear();

    vi.advanceTimersByTime(1_000);
    expect(componente.visible()).toBe(true);

    vi.advanceTimersByTime(3_000);
    expect(componente.agotado()).toBe(true);
    expect(authService.logout).not.toHaveBeenCalled();
  });

  it('seguir conectado reinicia el aviso', () => {
    const componente = crear();
    vi.advanceTimersByTime(1_000);

    componente.seguirConectado();
    expect(componente.visible()).toBe(false);

    vi.advanceTimersByTime(1_000);
    expect(componente.visible()).toBe(true);
  });

  it('cerrar sesión sólo ocurre por decisión explícita', () => {
    const componente = crear();
    componente.cerrarSesion();

    expect(authService.logout).toHaveBeenCalledOnce();
  });
});
