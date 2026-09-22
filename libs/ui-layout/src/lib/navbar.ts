import { Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { APP_ENV_INFO, AuthService, getEnvDisplay } from '@haberes/shared-api';

@Component({
  selector: 'ui-navbar',
  templateUrl: './navbar.html',
  standalone: true,
  imports: [CommonModule]
})
export class NavbarComponent {
  @Input() moduleName = "Haberes";
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly envInfo = inject(APP_ENV_INFO, { optional: true });

  public user$ = this.authService.currentUser$;
  public isDropdownOpen = false;

  public get envDisplay() {
    return this.envInfo ? getEnvDisplay(this.envInfo.name) : null;
  }

  public get envTooltip(): string {
    if (!this.envInfo) {
      return '';
    }
    return `Entorno: ${getEnvDisplay(this.envInfo.name).label} | Versión: ${this.envInfo.version}`;
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  logout() {
    this.isDropdownOpen = false;
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
