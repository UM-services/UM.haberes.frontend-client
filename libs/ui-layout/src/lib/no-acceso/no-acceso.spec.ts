import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { AccesoDenegadoService, API_URL, SOPORTE_EMAIL } from '@haberes/shared-api';
import { NoAccesoComponent } from './no-acceso';

describe('NoAccesoComponent (haberes)', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoAccesoComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: API_URL, useValue: '' },
        { provide: SOPORTE_EMAIL, useValue: '' },
      ],
    }).compileComponents();
  });

  it('explica la denegación y ofrece volver o ir al inicio', () => {
    TestBed.inject(AccesoDenegadoService).reportar({
      tipo: 'modulo',
      mensaje: 'Este módulo requiere un usuario con facultad asignada.',
    });

    const fixture = TestBed.createComponent(NoAccesoComponent);
    fixture.detectChanges();
    const texto = fixture.nativeElement.textContent as string;

    expect(texto).toContain('Acceso restringido');
    expect(texto).toContain('requiere un usuario con facultad');
    expect(texto).toContain('Volver');
    expect(texto).toContain('Ir al inicio');
  });

  it('sin correo de soporte no ofrece un enlace mailto', () => {
    const fixture = TestBed.createComponent(NoAccesoComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('a[href^="mailto:"]')).toBeNull();
  });
});
