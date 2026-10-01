import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Datos de designaciones (cursos cargo / cursos fusión) de un docente.
 * La búsqueda de personas ya NO vive acá: todas las pantallas usan el
 * buscador estándar (ui-persona-search + PersonaSearchService).
 */
@Injectable({ providedIn: 'root' })
export class DesignacionesService {
  private readonly http = inject(HttpClient);

  private readonly cursoCargoUrl = '/api/haberes/core/cursoCargo';
  private readonly cursoFusionUrl = '/api/haberes/core/cursofusion';

  getCursosCargo(legajoId: number, anho: number, mes: number, facultadId: number): Observable<any[]> {
    return this.http.get<any[]>(this.cursoCargoUrl + '/facultad/' + legajoId + '/' + anho + '/' + mes + '/' + facultadId);
  }

  getCursosFusion(legajoId: number, anho: number, mes: number, facultadId: number): Observable<any[]> {
    return this.http.get<any[]>(this.cursoFusionUrl + '/legajofacultad/' + legajoId + '/' + anho + '/' + mes + '/' + facultadId);
  }
}
