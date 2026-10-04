/**
 * Payload de `PUT /usuario/cambiarclave` (haberes-core). La validacion de la
 * clave anterior es server-side; `nombre` no se envia porque en Haberes vive
 * en la vista de persona y este endpoint no lo modifica.
 */
export interface ChangePasswordRequest {
  legajoId: number;
  currentPassword: string;
  newPassword: string;
  reClaveNueva: string;
}
