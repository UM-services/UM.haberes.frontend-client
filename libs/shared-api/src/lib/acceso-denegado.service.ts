import { Injectable, signal } from '@angular/core';

export type AccesoDenegadoTipo = 'permiso' | 'modulo';

export interface AccesoDenegadoDetalle {
  tipo: AccesoDenegadoTipo;
  mensaje: string;
  clave?: string;
  modulo?: string;
  origen?: string;
  timestamp: number;
}

type Reporte = Omit<AccesoDenegadoDetalle, 'timestamp'> & { timestamp?: number };

/**
 * Último acceso denegado (403 / guard de módulo).
 *
 * La UI lo muestra de forma NO destructiva: nunca cierra la sesión. El login
 * queda reservado para un 401 real (identidad vencida).
 */
@Injectable({ providedIn: 'root' })
export class AccesoDenegadoService {
  private readonly estado = signal<AccesoDenegadoDetalle | null>(null);
  readonly detalle = this.estado.asReadonly();

  reportar(reporte: Reporte): void {
    const timestamp = reporte.timestamp ?? Date.now();
    const actual = this.estado();

    if (
      actual &&
      actual.tipo === reporte.tipo &&
      actual.clave === reporte.clave &&
      actual.mensaje === reporte.mensaje &&
      timestamp - actual.timestamp < 5000
    ) {
      return;
    }

    this.estado.set({ ...reporte, timestamp });
  }

  limpiar(): void {
    this.estado.set(null);
  }
}
