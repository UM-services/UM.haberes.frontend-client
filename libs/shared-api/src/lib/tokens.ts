import { InjectionToken } from '@angular/core';

export const API_URL = new InjectionToken<string>('API_URL');

/**
 * Dirección de la mesa de ayuda para "Solicitar acceso". Si queda vacía, la UI
 * no muestra el botón de correo y sólo indica que se pida la habilitación al
 * administrador. Configurable por app en `app.config.ts`.
 */
export const SOPORTE_EMAIL = new InjectionToken<string>('SOPORTE_EMAIL', {
  providedIn: 'root',
  factory: () => '',
});
