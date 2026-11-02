/**
 * Convierte un período numérico `yyyymm` (formato de haberes-core) a `MM/AAAA`.
 * Acepta null/0 y devuelve un guion para no romper las tablas.
 */
export function periodoTexto(periodo: number | null | undefined): string {
  if (!periodo || periodo <= 0) return '—';

  const texto = String(Math.trunc(periodo)).padStart(6, '0');
  return `${texto.slice(4, 6)}/${texto.slice(0, 4)}`;
}
