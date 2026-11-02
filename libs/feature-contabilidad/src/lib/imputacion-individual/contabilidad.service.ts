import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ImputacionIndividualResponse, PersonaImputacion } from './imputacion.models';

@Injectable({ providedIn: 'root' })
export class ContabilidadService {
  private readonly http = inject(HttpClient);

  private readonly contableUrl = '/api/haberes/core/contable';
  private readonly personaUrl = '/api/haberes/core/persona';

  getImputacionIndividual(legajoId: number, anho: number, mes: number): Observable<ImputacionIndividualResponse> {
    return this.http.get<ImputacionIndividualResponse>(
      `${this.contableUrl}/imputacion-individual/${legajoId}/${anho}/${mes}`
    );
  }

  generarImputacionLegajo(legajoId: number, anho: number, mes: number): Observable<void> {
    return this.http.get<void>(
      `${this.contableUrl}/generatelegajo/${legajoId}/${anho}/${mes}`
    );
  }

  searchPersonas(term: string): Observable<PersonaImputacion[]> {
    const words = term.split(' ').map(w => w.trim()).filter(w => w.length > 0);
    return this.http.post<PersonaImputacion[]>(`${this.personaUrl}/search`, words);
  }

  getPersonaByLegajo(legajoId: number): Observable<PersonaImputacion> {
    return this.http.get<PersonaImputacion>(`${this.personaUrl}/${legajoId}`);
  }

  getPersonaByDocumento(documento: number): Observable<PersonaImputacion> {
    return this.http.get<PersonaImputacion>(`${this.personaUrl}/documento/${documento}`);
  }
}
