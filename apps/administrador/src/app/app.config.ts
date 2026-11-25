import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import { API_URL, authInterceptor, errorInterceptor, provideAppEnvInfo } from '@haberes/shared-api';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes),
    provideHttpClient(withXhr(), withInterceptors([authInterceptor, errorInterceptor])),
    { provide: API_URL, useValue: environment.apiUrl },
    provideAppEnvInfo({ name: environment.env, version: environment.version }),
  ],
};
