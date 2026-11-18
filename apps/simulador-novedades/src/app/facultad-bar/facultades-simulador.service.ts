import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { API_URL } from '@haberes/shared-api';

/** Facultad del catálogo de haberes-core (`GET /core/facultad/`). */
export interface FacultadSimulador {
  facultadId: number;
  nombre: string;
  reducido?: string;
}

/**
 * Catálogo de facultades del Simulador Novedades.
 *
 * Es de sólo lectura y se cachea durante la vida de la app: el administrador
 * puede cambiar de facultad varias veces en la misma sesión.
 */
@Injectable({ providedIn: 'root' })
export class FacultadesSimuladorService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = inject(API_URL, { optional: true }) || '/api/haberes';

  private cache$: Observable<FacultadSimulador[]> | null = null;

  getAll(): Observable<FacultadSimulador[]> {
    this.cache$ ??= this.http
      .get<FacultadSimulador[]>(`${this.apiBase}/core/facultad/`)
      .pipe(shareReplay(1));
    return this.cache$;
  }
}
