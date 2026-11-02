import { Injector } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { APP_ENV_INFO, provideAppEnvInfo } from './env-info';

describe('provideAppEnvInfo', () => {
  afterEach(() => {
    document.title = 'Haberes';
  });

  function setup(name: string, version: string) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideAppEnvInfo({ name, version })]
    });
    // Forzar la creación del injector para ejecutar los ENVIRONMENT_INITIALIZER.
    TestBed.inject(Injector);
  }

  it('provides the APP_ENV_INFO value through injection', () => {
    setup('staging', '1.2.3');
    expect(TestBed.inject(APP_ENV_INFO)).toEqual({ name: 'staging', version: '1.2.3' });
  });

  it('prefija document.title con la etiqueta normalizada del entorno', () => {
    document.title = 'Liquidación';
    setup('production', '9.9.9');
    expect(document.title).toBe('[PRODUCCIÓN] Liquidación');
  });
});
