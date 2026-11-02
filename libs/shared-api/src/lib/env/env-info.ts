import { EnvironmentProviders, InjectionToken, makeEnvironmentProviders, provideEnvironmentInitializer } from '@angular/core';
import { getEnvDisplay } from './env-display';

export interface AppEnvInfo {
  name: string;
  version: string;
}

export const APP_ENV_INFO = new InjectionToken<AppEnvInfo>('APP_ENV_INFO');

export function provideAppEnvInfo(info: AppEnvInfo): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: APP_ENV_INFO, useValue: info },
    provideEnvironmentInitializer(() => {
      if (typeof document === 'undefined') {
        return;
      }
      document.title = `[${getEnvDisplay(info.name).label}] ${document.title}`;
    })
  ]);
}
