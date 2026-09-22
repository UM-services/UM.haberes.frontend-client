import { ENV_DISPLAYS, getEnvDisplay } from './env-display';

describe('getEnvDisplay', () => {
  it('maps production synonyms to green PRODUCCIÓN', () => {
    for (const name of ['production', 'prod', 'PRODUCCION', 'Producción', '  PROD  ']) {
      const display = getEnvDisplay(name);
      expect(display.label).toBe('PRODUCCIÓN');
      expect(display.badgeClass).toBe(ENV_DISPLAYS.production.badgeClass);
    }
  });

  it('maps develop synonyms to DESARROLLO', () => {
    for (const name of ['develop', 'dev', 'desarrollo', 'DEV']) {
      expect(getEnvDisplay(name).label).toBe('DESARROLLO');
    }
  });

  it('maps staging synonyms to STAGING', () => {
    for (const name of ['staging', 'stage', 'preproduccion', 'preprod']) {
      expect(getEnvDisplay(name).label).toBe('STAGING');
    }
  });

  it('maps local synonyms to LOCAL', () => {
    for (const name of ['local', 'localhost', 'LOCAL']) {
      expect(getEnvDisplay(name).label).toBe('LOCAL');
    }
  });

  it('normalizes casing, separators and spaces', () => {
    expect(getEnvDisplay('Pre_Produccion').label).toBe('STAGING');
    expect(getEnvDisplay('APP_VERSION').label).toBe('SIN DEFINIR');
    expect(getEnvDisplay('my_env').label).toBe('SIN DEFINIR');
  });

  it('returns red SIN DEFINIR for unknown, empty, null and unreplaced placeholders', () => {
    for (const name of [null, undefined, '', 'desconocido', 'ENV_NAME_PLACEHOLDER', 'qa']) {
      const display = getEnvDisplay(name);
      expect(display.label).toBe('SIN DEFINIR');
      expect(display.badgeClass).toContain('red');
    }
  });
});
