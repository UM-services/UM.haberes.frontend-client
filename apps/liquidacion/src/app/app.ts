import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent, SidebarComponent, MenuGroup } from '@haberes/ui-layout';
import { AuthService } from '@haberes/shared-api';
import { MENU_GROUPS } from './menu-options.data';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent, SidebarComponent],
  selector: 'app-root',
  template: `
    @if (isLoggedIn$ | async; as loggedIn) {
      <div class="flex h-screen overflow-hidden bg-slate-50/70">
        <ui-sidebar 
          moduleName="Liquidación" 
          [menuGroups]="menuGroups"
          class="w-72 shrink-0 border-r border-slate-200/80 bg-white hidden md:flex flex-col shadow-2xs z-10">
        </ui-sidebar>
        
        <div class="flex-1 flex flex-col w-full h-full min-w-0">
          <ui-navbar class="h-14 shrink-0 bg-white border-b border-slate-200 z-10"></ui-navbar>
          <main class="flex-1 overflow-y-auto bg-white min-w-0 custom-scrollbar">
            <div class="w-full">
              <router-outlet></router-outlet>
            </div>
          </main>
        </div>
      </div>
    } @else {
      <div class="min-h-screen bg-slate-50/80">
        <router-outlet></router-outlet>
      </div>
    }
  `
})
export class AppComponent {
  title = 'liquidacion';
  private readonly authService = inject(AuthService);
  isLoggedIn$ = this.authService.currentUser$;

  menuGroups: MenuGroup[] = [
    {
      title: 'Principal',
      iconSvg: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
      items: [
        {
          label: 'Panel Principal',
          path: '/inicio',
          iconSvg: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
        }
      ]
    },
    ...MENU_GROUPS
  ];
}