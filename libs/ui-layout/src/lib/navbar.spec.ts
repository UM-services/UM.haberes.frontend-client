import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { APP_ENV_INFO, AuthService } from '@haberes/shared-api';

import { NavbarComponent } from './navbar';

@Component({
  standalone: true,
  imports: [NavbarComponent],
  template: `<ui-navbar></ui-navbar>`
})
class HostComponent {}

describe('NavbarComponent env badge', () => {
  const user = { legajoId: 1, apellido: 'Pérez', nombre: 'Ana', apellidoNombre: 'Pérez, Ana', sede: 'Mendoza' };

  function setup(envInfo?: { name: string; version: string }) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { currentUser$: of(user), logout: vi.fn() } },
        ...(envInfo ? [{ provide: APP_ENV_INFO, useValue: envInfo }] : [])
      ]
    });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('renders label, color and version tooltip for a known environment', () => {
    const el = setup({ name: 'staging', version: '1.2.3' });
    const badge = el.querySelector('span[title]');
    expect(badge?.textContent?.trim()).toBe('STAGING');
    expect(badge?.getAttribute('class')).toContain('purple');
    expect(badge?.getAttribute('title')).toBe('Entorno: STAGING | Versión: 1.2.3');
  });

  it('renders red SIN DEFINIR when the environment is unknown (placeholder not replaced)', () => {
    const el = setup({ name: 'ENV_NAME_PLACEHOLDER', version: 'sin-version' });
    const badge = el.querySelector('span[title]');
    expect(badge?.textContent?.trim()).toBe('SIN DEFINIR');
    expect(badge?.getAttribute('class')).toContain('red');
  });

  it('does not render the badge when APP_ENV_INFO is not provided', () => {
    const el = setup();
    expect(el.querySelector('span[title]')).toBeNull();
  });
});
