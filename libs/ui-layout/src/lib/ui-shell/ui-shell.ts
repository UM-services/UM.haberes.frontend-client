import { Component, inject, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { APP_ENV_INFO, AuthService, getEnvDisplay } from '@haberes/shared-api';
import { CambioClaveModalComponent } from '@haberes/ui-auth';

export interface ShellMenuItem {
  label: string;
  path: string;
  iconSvg?: string;
}

export interface ShellMenuGroup<T = ShellMenuItem> {
  title: string;
  iconSvg?: string;
  items: T[];
}

export type MenuItem = ShellMenuItem;
export type MenuGroup<T = ShellMenuItem> = ShellMenuGroup<T>;

const ENV_BADGE_BASE_CLASSES =
  'inline-block rounded-full px-2 py-0.5 text-xs font-bold tracking-wide ring-1 whitespace-nowrap';

/**
 * Shell J2 de Haberes: sidebar oscuro con marca institucional UM, selector de módulo,
 * menú polimórfico (plano o agrupado), badge de entorno, perfil y logout;
 * en pantallas pequeñas, header móvil accesible y tabs o menú colapsable.
 * Reemplaza la composición legacy ui-navbar + ui-sidebar.
 */
@Component({
  selector: 'ui-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, CambioClaveModalComponent],
  template: `
    @if (isLoggedIn$ | async; as user) {
      <div class="flex min-h-screen bg-um-canvas text-um-ink">
        <!-- Sidebar Escritorio -->
        <aside
          class="hidden w-64 shrink-0 flex-col bg-um-sidebar px-4 py-7 text-white md:flex"
          aria-label="Navegación principal"
        >
          <!-- Brand / Encabezado -->
          <div class="border-b border-white/20 px-3 pb-6">
            <p class="text-lg font-bold leading-6">UM · Haberes</p>
            <p class="mt-1 text-sm text-um-sidebar-muted">{{ moduleName }}</p>
          </div>

          <!-- Navegación Dinámica -->
          <nav
            class="flex-1 overflow-y-auto pt-6 space-y-1.5 custom-scrollbar"
            [attr.aria-label]="menuSectionLabel"
          >
            @if (menuGroups.length > 0) {
              @for (group of menuGroups; track group.title) {
                <div class="mb-1.5">
                  <button
                    type="button"
                    (click)="toggleGroup(group.title)"
                    class="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-um-sidebar-muted hover:text-white hover:bg-um-sidebar-active/60 uppercase tracking-wider rounded transition-colors cursor-pointer group"
                  >
                    <div class="flex items-center gap-2 min-w-0">
                      @if (group.iconSvg) {
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="h-4 w-4 shrink-0 text-um-sidebar-muted group-hover:text-white transition-colors"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            [attr.d]="group.iconSvg"
                          />
                        </svg>
                      }
                      <span class="truncate">{{ group.title }}</span>
                    </div>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-3.5 w-3.5 shrink-0 transform transition-transform duration-200 text-um-sidebar-muted group-hover:text-white"
                      [class.rotate-180]="isGroupExpanded(group.title)"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  @if (isGroupExpanded(group.title)) {
                    <div class="mt-1 space-y-0.5 pl-2 border-l border-white/20 ml-3">
                      @for (item of group.items; track item.path) {
                        <a
                          [routerLink]="item.path"
                          routerLinkActive="bg-um-sidebar-active text-white font-semibold"
                          [routerLinkActiveOptions]="{
                            exact: item.path === '/' || item.path === '/inicio',
                          }"
                          class="flex items-center px-3 py-2 text-xs rounded text-um-sidebar-text hover:bg-um-sidebar-active hover:text-white transition-all cursor-pointer"
                        >
                          @if (item.iconSvg) {
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              class="mr-2 shrink-0 h-3.5 w-3.5 text-um-sidebar-muted"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                [attr.d]="item.iconSvg"
                              />
                            </svg>
                          }
                          <span class="truncate">{{ item.label }}</span>
                        </a>
                      }
                    </div>
                  }
                </div>
              }
            } @else {
              <p
                class="px-3 pb-2 text-xs font-semibold uppercase tracking-widest text-um-sidebar-muted"
              >
                {{ menuSectionLabel }}
              </p>
              @for (item of menuItems; track item.path) {
                <a
                  [routerLink]="item.path"
                  routerLinkActive="bg-um-sidebar-active text-white"
                  [routerLinkActiveOptions]="{ exact: item.path === '/' }"
                  class="flex items-center gap-2.5 rounded px-3 py-2.5 text-xs font-semibold text-um-sidebar-text hover:bg-um-sidebar-active hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white transition-all"
                >
                  @if (item.iconSvg) {
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-4 w-4 shrink-0 text-um-sidebar-muted"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        [attr.d]="item.iconSvg"
                      />
                    </svg>
                  }
                  <span class="truncate">{{ item.label }}</span>
                </a>
              }
            }
          </nav>

          <!-- Footer con Usuario, Entorno y Logout -->
          <div class="mt-auto border-t border-white/20 px-3 pt-5">
            @if (envInfo) {
              <div class="mb-3">
                <span [class]="envBadgeClass" [title]="envTooltip">{{ envDisplay.label }}</span>
              </div>
            }
            <p class="text-xs font-semibold text-um-sidebar-text truncate">
              {{ user.apellidoNombre || user.nombre }}
            </p>
            <p class="mt-0.5 text-[11px] text-um-sidebar-muted">Sede {{ user.sede }}</p>
            @if (user.facultadNombre) {
              <p class="mt-0.5 text-[10px] text-um-sidebar-muted truncate">
                {{ user.facultadNombre }}
              </p>
            }
            <div class="mt-4 flex flex-col gap-1.5">
              <button
                type="button"
                (click)="abrirCambioClave()"
                class="text-left text-xs font-medium text-um-sidebar-text underline underline-offset-4 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white cursor-pointer"
              >
                Cambiar clave
              </button>
              <button
                type="button"
                (click)="cerrarSesion()"
                class="text-left text-xs font-medium text-um-sidebar-text underline underline-offset-4 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white cursor-pointer"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </aside>

        <!-- Contenedor Principal -->
        <div class="min-w-0 flex-1 flex flex-col">
          <!-- Header Móvil -->
          <header
            class="flex items-center justify-between border-b border-um-border bg-white px-4 py-3 md:hidden"
          >
            <span class="flex min-w-0 items-center gap-2 font-bold text-um-sidebar">
              UM · Haberes
              @if (envInfo) {
                <span [class]="envBadgeClass" [title]="envTooltip">{{ envDisplay.label }}</span>
              }
            </span>
            <div class="flex items-center gap-2">
              <button
                type="button"
                (click)="isMobileMenuOpen = !isMobileMenuOpen"
                class="p-1.5 rounded text-um-text hover:bg-um-surface"
                aria-label="Toggle navigation"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
              <button
                type="button"
                (click)="abrirCambioClave()"
                class="text-xs font-semibold text-um-primary underline ml-1"
              >
                Cambiar clave
              </button>
              <button
                type="button"
                (click)="cerrarSesion()"
                class="text-xs font-semibold text-um-primary underline ml-1"
              >
                Salir
              </button>
            </div>
          </header>

          <!-- Menú Móvil Colapsable -->
          @if (isMobileMenuOpen) {
            <nav class="border-b border-um-border bg-um-surface p-4 md:hidden space-y-2">
              @if (menuGroups.length > 0) {
                @for (group of menuGroups; track group.title) {
                  <div>
                    <p class="text-[11px] font-bold uppercase text-um-muted mb-1">
                      {{ group.title }}
                    </p>
                    <div class="space-y-1 pl-2">
                      @for (item of group.items; track item.path) {
                        <a
                          [routerLink]="item.path"
                          (click)="isMobileMenuOpen = false"
                          routerLinkActive="bg-um-selected text-um-primary font-bold"
                          [routerLinkActiveOptions]="{
                            exact: item.path === '/' || item.path === '/inicio',
                          }"
                          class="block rounded px-3 py-1.5 text-xs text-um-text hover:bg-white"
                        >
                          {{ item.label }}
                        </a>
                      }
                    </div>
                  </div>
                }
              } @else {
                @for (item of menuItems; track item.path) {
                  <a
                    [routerLink]="item.path"
                    (click)="isMobileMenuOpen = false"
                    routerLinkActive="bg-um-selected text-um-primary font-bold"
                    [routerLinkActiveOptions]="{ exact: item.path === '/' }"
                    class="block rounded px-3 py-2 text-xs text-um-text hover:bg-white"
                  >
                    {{ item.label }}
                  </a>
                }
              }
            </nav>
          }

          <!-- Vista de Contenido Central -->
          <main class="flex-1 w-full max-w-[1320px] mx-auto px-4 py-7 sm:px-7 lg:px-12 lg:py-9">
            <router-outlet></router-outlet>
          </main>
        </div>

        <lib-cambio-clave-modal [isOpen]="isCambioClaveOpen()" (closed)="cerrarCambioClave()" />
      </div>
    } @else {
      <!-- Vista Limpia para Login / Desautenticado -->
      <div class="min-h-screen bg-um-canvas">
        <router-outlet></router-outlet>
      </div>
    }
  `,
})
export class UiShellComponent {
  @Input() moduleName = 'Haberes';
  @Input() menuSectionLabel = 'Menú';
  @Input() menuItems: ShellMenuItem[] = [];
  @Input() menuGroups: ShellMenuGroup[] = [];

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly envInfo = inject(APP_ENV_INFO, { optional: true });
  readonly envDisplay = getEnvDisplay(this.envInfo?.name);
  readonly envBadgeClass = `${ENV_BADGE_BASE_CLASSES} ${this.envDisplay.badgeClass}`;
  readonly envTooltip = this.envInfo
    ? `Entorno: ${this.envDisplay.label} | Versión: ${this.envInfo.version}`
    : '';

  readonly isLoggedIn$ = this.authService.currentUser$;

  readonly isCambioClaveOpen = signal(false);

  abrirCambioClave(): void {
    this.isCambioClaveOpen.set(true);
  }

  cerrarCambioClave(): void {
    this.isCambioClaveOpen.set(false);
  }

  expandedGroups = new Set<string>();
  isMobileMenuOpen = false;

  toggleGroup(title: string): void {
    if (this.expandedGroups.has(title)) {
      this.expandedGroups.delete(title);
    } else {
      this.expandedGroups.add(title);
    }
  }

  isGroupExpanded(title: string): boolean {
    return this.expandedGroups.has(title);
  }

  cerrarSesion(): void {
    this.authService.logout();
    void this.router.navigate(['/login']);
  }
}
