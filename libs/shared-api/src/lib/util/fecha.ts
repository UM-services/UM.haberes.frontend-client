/**
 * Utilidades de fecha de los formularios de Haberes.
 *
 * El backend declara las fechas como `OffsetDateTime` con patrón
 * `yyyy-MM-dd'T'HH:mm:ssXX` (offset sin dos puntos) y `America/Argentina`
 * enviado históricamente como `+0000`. Los `<input type="date">` trabajan con
 * `yyyy-MM-dd`, así que hay que reconstruir el horario y el offset originales
 * para no correr el día.
 */

/** Valor para `<input type="date">` a partir de la fecha ISO del backend. */
export function fechaInput(valor: string | null | undefined): string {
  return valor ? valor.slice(0, 10) : '';
}

/**
 * Reconstruye la fecha con el mismo horario y offset que devolvió el backend.
 * Sin original (alta nueva) usa medianoche UTC (`+0000`), igual que el cliente
 * anterior. Sin fecha devuelve cadena vacía para que el llamador no la envíe.
 */
export function fechaPayload(original: string | null | undefined, fecha: string): string {
  if (!fecha) return '';

  const horario = original?.match(/T(\d{2}:\d{2}:\d{2})/)?.[1] ?? '00:00:00';
  const offsetOriginal = original?.match(/(Z|[+-]\d{2}:?\d{2})$/)?.[1];
  const offset = !offsetOriginal
    ? '+0000'
    : offsetOriginal === 'Z'
      ? 'Z'
      : offsetOriginal.replace(':', '');
  return `${fecha}T${horario}${offset}`;
}
