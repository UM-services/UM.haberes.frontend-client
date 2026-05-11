import { Routes } from '@angular/router';
import { LoginComponent } from '@haberes/ui-auth';
import { authGuard, unauthGuard } from '@haberes/shared-api';
import { DesignacionesComponent } from '@haberes/feature-designaciones';

export const appRoutes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [unauthGuard], data: { requireFacultadId: true } },
  { path: 'inicio', component: DesignacionesComponent, canActivate: [authGuard] },
  { path: '', redirectTo: 'inicio', pathMatch: 'full' },
  { path: '**', redirectTo: 'inicio' }
];
