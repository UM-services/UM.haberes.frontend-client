import { AsigCursosComponent } from '@haberes/feature-designaciones';
import { DocentesSedeComponent } from '@haberes/feature-cargos';
import { CargosLegajoComponent } from '@haberes/feature-cargos';
import { AnotadorComponent } from '@haberes/feature-anotador';
import { Routes } from '@angular/router';
import { LoginComponent } from '@haberes/ui-auth';
import { authGuard, unauthGuard } from '@haberes/shared-api';
import { DesignacionesComponent } from '@haberes/feature-designaciones';

export const appRoutes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [unauthGuard], data: { requireFacultadId: true } },
  { path: 'anotador', component: AnotadorComponent, canActivate: [authGuard] },
  { path: 'cargos', component: CargosLegajoComponent, canActivate: [authGuard] },
  { path: 'docentes-sede', component: DocentesSedeComponent, canActivate: [authGuard] },
  { path: 'asig-cursos', component: AsigCursosComponent, canActivate: [authGuard] },
  { path: 'inicio', component: DesignacionesComponent, canActivate: [authGuard] },
  { path: '', redirectTo: 'inicio', pathMatch: 'full' },
  { path: '**', redirectTo: 'inicio' }
];
