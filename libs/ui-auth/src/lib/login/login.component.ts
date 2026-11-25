import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '@haberes/shared-api';

@Component({
  selector: 'ui-auth-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  requireFacultadId: boolean | null = null;
  requireAdministrador: boolean | null = null;
  readonly infoMessage = signal<string>('');

  constructor() {
    this.requireFacultadId = this.route.snapshot.data['requireFacultadId'] ?? null;
    this.requireAdministrador = this.route.snapshot.data['requireAdministrador'] ?? null;
    if (this.route.snapshot.queryParams['motivo'] === 'sesion-expirada') {
      this.infoMessage.set('Tu sesión expiró. Volvé a ingresar para continuar.');
    }
  }

  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);


  loginForm = this.fb.group({
    legajoId: ['', [Validators.required]],
    password: ['', [Validators.required]],
    rePassword: [''],
  });

  apellidoNombre = signal<string>('');
  isFirstTime = signal<boolean>(false);
  errorMessage = signal<string>('');

  onLegajoBlur() {
    const legajoId = Number(this.loginForm.get('legajoId')?.value);
    if (!legajoId) return;

    // Endpoint público de pre-login: sólo nombre + habilitado/primer ingreso.
    this.authService.getDatosLegajo(legajoId).subscribe({
      next: (datos) => {
        this.apellidoNombre.set(datos.apellidoNombre || '');
        this.errorMessage.set('');

        if (!datos.habilitado) {
          this.errorMessage.set('ERROR: Usuario NO HABILITADO');
        }

        if (datos.primerIngreso) {
          this.isFirstTime.set(true);
          this.loginForm.get('rePassword')?.setValidators([Validators.required]);
          this.errorMessage.set('Ingrese Password 2 VECES');
        } else {
          this.isFirstTime.set(false);
          this.loginForm.get('rePassword')?.clearValidators();
        }
        this.loginForm.get('rePassword')?.updateValueAndValidity();
      },
      error: () => {
        this.errorMessage.set('ERROR: Legajo NO encontrado');
        this.apellidoNombre.set('');
      },
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) return;

    const { legajoId, password, rePassword } = this.loginForm.getRawValue();
    const legajoNum = Number(legajoId);

    if (this.isFirstTime()) {
      if (password !== rePassword) {
        this.errorMessage.set('ERROR: Password NO COINCIDE');
        return;
      }
      this.authService.setPassword(legajoNum, password!).subscribe({
        next: () => {
          this.doLogin(legajoNum, password!);
        },
        error: () => this.errorMessage.set('Error al establecer password')
      });
    } else {
      this.doLogin(legajoNum, password!);
    }
  }

  private doLogin(legajoId: number, password: string) {
    this.authService.login(legajoId, password).subscribe({
      next: (response) => {
        if (response.success && response.usuario) {
          // Evaluar regla de negocio especifica del modulo
          if (this.requireFacultadId === true && !response.usuario.facultadId) {
            this.authService.clearSession();
            this.errorMessage.set('Módulo ASIGNADO a Facultad');
            return;
          }
          if (this.requireFacultadId === false && response.usuario.facultadId) {
            this.authService.clearSession();
            this.errorMessage.set('Módulo GLOBAL. Usuario restringido a facultad.');
            return;
          }
          if (this.requireAdministrador === true && response.usuario.administrador !== 1) {
            this.authService.clearSession();
            this.errorMessage.set('Módulo ADMINISTRADOR. Usuario NO habilitado.');
            return;
          }
          this.router.navigate(['/'], { replaceUrl: true });
        } else {
          this.errorMessage.set(response.error || 'Error desconocido');
        }
      },
      error: () => this.errorMessage.set('Error crítico en el servidor')
    });
  }
}
