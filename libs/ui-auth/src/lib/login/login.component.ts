import { Component, inject, signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '@haberes/shared-api';

@Component({
  selector: 'ui-auth-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  requireFacultadId: boolean | null = null;

  constructor() {
    this.requireFacultadId = this.route.snapshot.data['requireFacultadId'] ?? null;
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

    this.authService.getPersona(legajoId).subscribe({
      next: (persona) => {
        this.apellidoNombre.set(persona.apellidoNombre || `${persona.apellido}, ${persona.nombre}`);
        this.checkUsuario(legajoId);
      },
      error: () => {
        this.errorMessage.set('ERROR: Legajo NO encontrado');
        this.apellidoNombre.set('');
      }
    });
  }

  private checkUsuario(legajoId: number) {
    this.authService.getUsuario(legajoId).subscribe({
      next: (usuario) => {
        if (!usuario.usuarioId) {
          this.errorMessage.set('ERROR: Usuario NO HABILITADO');
          return;
        }
        if (!usuario.password) {
          this.isFirstTime.set(true);
          this.loginForm.get('rePassword')?.setValidators([Validators.required]);
          this.errorMessage.set('Ingrese Password 2 VECES');
        } else {
          this.isFirstTime.set(false);
          this.loginForm.get('rePassword')?.clearValidators();
          this.errorMessage.set('');
        }
        this.loginForm.get('rePassword')?.updateValueAndValidity();
      },
      error: () => {
        this.errorMessage.set('ERROR: Usuario NO encontrado');
      }
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
          this.router.navigate(['/']);
        } else {
          this.errorMessage.set(response.error || 'Error desconocido');
        }
      },
      error: () => this.errorMessage.set('Error crítico en el servidor')
    });
  }
}
