import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';
import { provideRouter, withRouterConfig } from '@angular/router';
import { appRoutes } from './app.routes';
import { API_URL, errorInterceptor, provideAppEnvInfo } from '@haberes/shared-api';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // `reload`: cambiar la facultad simulada re-monta la pantalla activa para
    // que vuelva a leer el contexto (las features leen facultadId al iniciar).
    provideRouter(appRoutes, withRouterConfig({ onSameUrlNavigation: 'reload' })),
    provideHttpClient(withXhr(), withInterceptors([errorInterceptor])),
    { provide: API_URL, useValue: environment.apiUrl },
    provideAppEnvInfo({ name: environment.env, version: environment.version }),
  ],
};
