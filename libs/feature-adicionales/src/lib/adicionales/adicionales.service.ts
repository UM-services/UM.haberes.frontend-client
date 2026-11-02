import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '@haberes/shared-api';

export interface AdicionalRango {
  adicionalCursoRangoId: number;
  horasDesde: number;
  horasHasta: number;
  porcentaje: number;
  adicionalCursoTablaId: number;
}

export interface AdicionalTabla {
  adicionalCursoTablaId: number;
  periodoDesde: number;
  periodoHasta: number;
  facultadId?: number | null;
  geograficaId?: number | null;
  facultad?: { nombre?: string } | null;
  geografica?: { nombre?: string } | null;
  adicionalCursoRangos?: AdicionalRango[] | null;
}

/** Payload de `POST /adicionalCursoRango/` (el id lo genera la base). */
export type AdicionalRangoRequest = Omit<AdicionalRango, 'adicionalCursoRangoId'>;

@Injectable({ providedIn: 'root' })
export class AdicionalesService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = inject(API_URL, { optional: true }) || '/api/haberes';

  private get tablaUrl(): string {
    return `${this.apiBase}/core/adicionalCursoTabla`;
  }

  private get rangoUrl(): string {
    return `${this.apiBase}/core/adicionalCursoRango`;
  }

  /** El maestro es sólo lectura: las tablas se administran por base de datos. */
  getTablas(): Observable<AdicionalTabla[]> {
    return this.http.get<AdicionalTabla[]>(`${this.tablaUrl}/`);
  }

  getRangos(adicionalCursoTablaId: number): Observable<AdicionalRango[]> {
    return this.http.get<AdicionalRango[]>(`${this.rangoUrl}/tabla/${adicionalCursoTablaId}`);
  }

  addRango(rango: AdicionalRangoRequest): Observable<AdicionalRango> {
    return this.http.post<AdicionalRango>(`${this.rangoUrl}/`, rango);
  }

  deleteRango(adicionalCursoRangoId: number): Observable<void> {
    return this.http.delete<void>(`${this.rangoUrl}/${adicionalCursoRangoId}`);
  }
}
