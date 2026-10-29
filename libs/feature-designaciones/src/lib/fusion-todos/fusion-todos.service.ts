import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Procesos masivos del período (Fusionar Todos y Recalcular Desarraigo).
 *
 * El backend procesa un lote de legajos por request, cada legajo en su propia
 * transacción, y devuelve el resumen con los fallos. La pantalla divide el
 * período en lotes para acotar la duración de cada llamada y poder mostrar el
 * progreso y cancelar entre lotes.
 */

export interface PersonaLote {
  legajoId: number;
  apellido: string;
  nombre: string;
  apellidoNombre?: string;
}

export interface FalloLote {
  legajoId: number;
  error: string;
}

export interface ResumenLote {
  procesados: number;
  fallidos: FalloLote[];
}

@Injectable({ providedIn: 'root' })
export class FusionTodosService {
  private readonly http = inject(HttpClient);

  private readonly personaUrl = '/api/haberes/core/persona';
  private readonly cursoCargoUrl = '/api/haberes/core/cursoCargo';
  private readonly periodoUrl = '/api/haberes/core/designaciontool/periodo';

  getDocentes(anho: number, mes: number): Observable<PersonaLote[]> {
    return this.http.get<PersonaLote[]>(`${this.personaUrl}/docente/${anho}/${mes}`);
  }

  getLegajosDesarraigo(anho: number, mes: number): Observable<PersonaLote[]> {
    return this.http.get<PersonaLote[]>(`${this.personaUrl}/desarraigo/${anho}/${mes}`);
  }

  /** Cargos del período en cualquier versión (para habilitar la duplicación). */
  getCargosPeriodo(anho: number, mes: number): Observable<unknown[]> {
    return this.http.get<unknown[]>(`${this.cursoCargoUrl}/periodoany/${anho}/${mes}`);
  }

  fusionarLote(legajos: number[], anho: number, mes: number): Observable<ResumenLote> {
    return this.http.post<ResumenLote>(`${this.periodoUrl}/fusionar/${anho}/${mes}`, { legajos });
  }

  desarraigoLote(legajos: number[], anho: number, mes: number): Observable<ResumenLote> {
    return this.http.post<ResumenLote>(`${this.periodoUrl}/desarraigo/${anho}/${mes}`, { legajos });
  }

  duplicarLote(legajos: number[], anho: number, mes: number): Observable<ResumenLote> {
    return this.http.post<ResumenLote>(`${this.periodoUrl}/duplicar/${anho}/${mes}`, { legajos });
  }

  /** Elimina las fusiones huérfanas del período (legajos sin cargos). */
  depurar(anho: number, mes: number): Observable<void> {
    return this.http.post<void>(`${this.periodoUrl}/depurar/${anho}/${mes}`, {});
  }
}
