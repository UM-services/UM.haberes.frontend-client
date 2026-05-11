import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DesignacionesService {
  private readonly http = inject(HttpClient);

  private readonly cursoCargoUrl = '/api/haberes/core/cursoCargo';
  private readonly cursoFusionUrl = '/api/haberes/core/cursofusion';
  private readonly personaUrl = '/api/haberes/core/persona';

  searchPersonas(term: string): Observable<any[]> {
    // Dividimos el termino por espacios y filtramos strings vacios para cumplir con la logica del backend
    const words = term.split(' ').map(w => w.trim()).filter(w => w.length > 0);
    return this.http.post<any[]>(this.personaUrl + '/search', words);
  }

  getPersonaByLegajo(legajoId: number): Observable<any> {
    return this.http.get<any>(this.personaUrl + '/' + legajoId);
  }

  getCursosCargo(legajoId: number, anho: number, mes: number, facultadId: number): Observable<any[]> {
    return this.http.get<any[]>(this.cursoCargoUrl + '/facultad/' + legajoId + '/' + anho + '/' + mes + '/' + facultadId);
  }

  getCursosFusion(legajoId: number, anho: number, mes: number, facultadId: number): Observable<any[]> {
    return this.http.get<any[]>(this.cursoFusionUrl + '/legajofacultad/' + legajoId + '/' + anho + '/' + mes + '/' + facultadId);
  }
}
