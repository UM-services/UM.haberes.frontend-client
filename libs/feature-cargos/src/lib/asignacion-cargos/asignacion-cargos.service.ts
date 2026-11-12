import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';

import {
  Cargo,
  CargoRequest,
  CatalogosAsignacionCargo,
  Dependencia,
  Facultad,
  PersonaFacultad
} from './asignacion-cargos.models';

/**
 * Cliente de la pantalla Asignación de Cargos No Docentes.
 *
 * Las escrituras envían `X-Legajo-Solicitante` para que haberes-core resuelva
 * el actor de la auditoría (el backend no lo recibe en el body).
 */
@Injectable({ providedIn: 'root' })
export class AsignacionCargosService {
  private readonly http = inject(HttpClient);

  private readonly cargoUrl = '/api/haberes/core/cargo';
  private readonly personaFacultadUrl = '/api/haberes/core/personaFacultad';
  private readonly categoriaUrl = '/api/haberes/core/categoria';
  private readonly dependenciaUrl = '/api/haberes/core/dependencia';
  private readonly facultadUrl = '/api/haberes/core/facultad';

  catalogos(): Observable<CatalogosAsignacionCargo> {
    return forkJoin({
      categorias: this.http.get<CatalogosAsignacionCargo['categorias']>(`${this.categoriaUrl}/asignables`),
      dependencias: this.http.get<Dependencia[]>(`${this.dependenciaUrl}/`),
      facultades: this.http.get<Facultad[]>(`${this.facultadUrl}/`)
    });
  }

  cargos(legajoId: number): Observable<Cargo[]> {
    return this.http.get<Cargo[]>(`${this.cargoUrl}/legajo/${legajoId}`);
  }

  agregarCargo(body: CargoRequest, solicitante: number | null): Observable<Cargo> {
    return this.http.post<Cargo>(`${this.cargoUrl}/`, body, this.headers(solicitante));
  }

  actualizarCargo(cargoId: number, body: CargoRequest, solicitante: number | null): Observable<Cargo> {
    return this.http.put<Cargo>(`${this.cargoUrl}/${cargoId}`, body, this.headers(solicitante));
  }

  eliminarCargo(cargoId: number, solicitante: number | null): Observable<void> {
    return this.http.delete<void>(`${this.cargoUrl}/${cargoId}`, this.headers(solicitante));
  }

  facultadesDe(legajoId: number): Observable<PersonaFacultad[]> {
    return this.http.get<PersonaFacultad[]>(`${this.personaFacultadUrl}/persona/${legajoId}`);
  }

  habilitarFacultad(legajoId: number, facultadId: number, solicitante: number | null): Observable<PersonaFacultad> {
    return this.http.post<PersonaFacultad>(
      `${this.personaFacultadUrl}/`,
      { legajoId, facultadId },
      this.headers(solicitante)
    );
  }

  quitarFacultad(legajoId: number, facultadId: number, solicitante: number | null): Observable<void> {
    return this.http.delete<void>(
      `${this.personaFacultadUrl}/unique/${legajoId}/${facultadId}`,
      this.headers(solicitante)
    );
  }

  private headers(solicitante: number | null): { headers: Record<string, string> } {
    return solicitante === null
      ? { headers: {} }
      : { headers: { 'X-Legajo-Solicitante': String(solicitante) } };
  }
}
