import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpErrorResponse } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { AuthService, Persona } from '@haberes/shared-api';
import { CambioClaveModalComponent } from './cambio-clave-modal';

const MOCK_PERSONA: Persona = {
  legajoId: 42,
  apellido: 'Perez',
  nombre: 'Juan',
  apellidoNombre: 'Perez, Juan',
  sede: 'Sede Central',
};

describe('CambioClaveModalComponent', () => {
  let component: CambioClaveModalComponent;
  let fixture: ComponentFixture<CambioClaveModalComponent>;
  let authService: AuthService;

  beforeEach(async () => {
    localStorage.setItem('haberes_user', JSON.stringify(MOCK_PERSONA));

    await TestBed.configureTestingModule({
      imports: [CambioClaveModalComponent],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(CambioClaveModalComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
  });

  it('no renderiza el contenido del modal cuando isOpen es false', () => {
    component.isOpen = false;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#modal-title')).toBeNull();
  });

  it('renderiza el modal y precarga legajo y nombre cuando isOpen es true', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    const modalTitle = fixture.nativeElement.querySelector('#modal-title');
    expect(modalTitle?.textContent?.trim()).toBe('Cambiar Clave');

    expect(component.form.get('legajoId')?.value).toBe('42');
    expect(component.form.get('nombre')?.value).toBe('Perez, Juan');
  });

  it('valida que newPassword y reClaveNueva deben coincidir', () => {
    component.isOpen = true;
    component.resetForm();

    component.form.patchValue({
      currentPassword: 'oldPassword',
      newPassword: 'newPassword1',
      reClaveNueva: 'newPassword2',
    });

    component.onSubmit();

    expect(component.errorMessage).toBe('ERROR: Claves NO Coinciden');
  });

  it('valida campos de clave vacíos sin llamar al servicio', () => {
    const spy = vi.spyOn(authService, 'changePassword');
    component.isOpen = true;
    component.resetForm();

    component.form.patchValue({ currentPassword: '', newPassword: 'x', reClaveNueva: 'x' });
    component.onSubmit();

    expect(component.errorMessage).toContain('complete todos los campos');
    expect(spy).not.toHaveBeenCalled();
  });

  it('envía changePassword con el payload y muestra el éxito', () => {
    const changePasswordSpy = vi
      .spyOn(authService, 'changePassword')
      .mockReturnValue(of(undefined));

    component.isOpen = true;
    component.resetForm();

    component.form.patchValue({
      currentPassword: 'oldPassword',
      newPassword: 'newPassword123',
      reClaveNueva: 'newPassword123',
    });

    component.onSubmit();

    expect(changePasswordSpy).toHaveBeenCalledWith({
      legajoId: 42,
      currentPassword: 'oldPassword',
      newPassword: 'newPassword123',
      reClaveNueva: 'newPassword123',
    });
    expect(component.successMessage).toBe('Cambio REALIZADO');
    expect(component.errorMessage).toBe('');
  });

  it('mapea el detail del ProblemDetail devuelto por el backend', () => {
    vi.spyOn(authService, 'changePassword').mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: {
              type: 'about:blank',
              title: 'Bad Request',
              status: 400,
              detail: 'ERROR: Usuario NO Autenticado',
            },
          }),
      ),
    );

    component.isOpen = true;
    component.resetForm();

    component.form.patchValue({
      currentPassword: 'mala',
      newPassword: 'newPassword123',
      reClaveNueva: 'newPassword123',
    });

    component.onSubmit();

    expect(component.errorMessage).toBe('ERROR: Usuario NO Autenticado');
    expect(component.successMessage).toBe('');
  });

  it('mapea un cuerpo de error en texto plano', () => {
    vi.spyOn(authService, 'changePassword').mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: 'ERROR: Clave NO Válida',
          }),
      ),
    );

    component.isOpen = true;
    component.resetForm();

    component.form.patchValue({
      currentPassword: 'oldPassword',
      newPassword: 'newPassword123',
      reClaveNueva: 'newPassword123',
    });

    component.onSubmit();

    expect(component.errorMessage).toBe('ERROR: Clave NO Válida');
  });

  it('emite closed al cerrar el modal', () => {
    const closedSpy = vi.spyOn(component.closed, 'emit');

    component.cerrarModal();

    expect(closedSpy).toHaveBeenCalled();
  });
});
