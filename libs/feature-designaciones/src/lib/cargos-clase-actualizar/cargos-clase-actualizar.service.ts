import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Recálculo masivo de los valores hora de los cargos con clase de un período.
 * El proceso corre en haberes-core (una sola llamada de servidor).
 */
@Injectable({ providedIn: 'root' })
export class CargosClaseActualizarService {
  private readonly http = inject(HttpClient);

  private readonly cargoClaseToolUrl = '/api/haberes/core/cargoclasetool';

  actualizarPeriodo(anho: number, mes: number): Observable<void> {
    return this.http.get<void>(`${this.cargoClaseToolUrl}/update/periodo/${anho}/${mes}`);
  }
}
