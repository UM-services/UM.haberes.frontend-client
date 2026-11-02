import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '@haberes/shared-api';

export interface Clase {
  claseId: number;
  nombre: string;
  valorHora: number;
}

/** Payload de alta/edición de `clase` (haberes-core). */
export type ClaseRequest = Clase;

@Injectable({ providedIn: 'root' })
export class ClasesService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = inject(API_URL, { optional: true }) || '/api/haberes';

  private get url(): string {
    return `${this.apiBase}/core/clase`;
  }

  getClases(): Observable<Clase[]> {
    return this.http.get<Clase[]>(`${this.url}/`);
  }

  /** Último id registrado, para proponer el siguiente (la PK la asigna el cliente). */
  getLast(): Observable<Clase> {
    return this.http.get<Clase>(`${this.url}/last`);
  }

  create(clase: ClaseRequest): Observable<Clase> {
    return this.http.post<Clase>(`${this.url}/`, clase);
  }

  update(claseId: number, clase: ClaseRequest): Observable<Clase> {
    return this.http.put<Clase>(`${this.url}/${claseId}`, clase);
  }

  delete(claseId: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${claseId}`);
  }
}
