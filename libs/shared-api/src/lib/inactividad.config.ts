import { InjectionToken } from '@angular/core';

export interface InactividadConfig {
  enabled: boolean;
  avisoMs: number;
  graciaMs: number;
}

export const INACTIVIDAD_CONFIG_DEFAULT: InactividadConfig = {
  enabled: true,
  avisoMs: 25 * 60_000,
  graciaMs: 2 * 60_000,
};

/**
 * Aviso de inactividad no destructivo: la sesión de Haberes se valida contra el
 * backend al arrancar y no tiene token con `exp`, así que el frontend no puede
 * expulsar al usuario por su cuenta. El modal sólo ofrece "Seguir conectado" o
 * "Cerrar sesión".
 */
export const INACTIVIDAD_CONFIG = new InjectionToken<InactividadConfig>('INACTIVIDAD_CONFIG', {
  providedIn: 'root',
  factory: () => INACTIVIDAD_CONFIG_DEFAULT,
});
