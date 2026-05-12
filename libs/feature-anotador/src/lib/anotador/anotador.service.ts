import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AnotadorService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/haberes/core/anotador';
  private readonly acreditacionUrl = '/api/haberes/core/acreditacion';

  getPendientes(facultadId: number, anho: number, mes: number): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl + '/pendientefacultad/' + facultadId + '/' + anho + '/' + mes);
  }

  getRevisados(facultadId: number, anho: number, mes: number): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl + '/revisadofacultad/' + facultadId + '/' + anho + '/' + mes);
  }

  getHistorial(legajoId: number): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl + '/legajo/' + legajoId);
  }

  getAcreditacion(anho: number, mes: number): Observable<any> {
    return this.http.get<any>(this.acreditacionUrl + '/periodo/' + anho + '/' + mes);
  }

  addAnotacion(anotacion: any): Observable<any> {
    return this.http.post<any>(this.baseUrl + '/', anotacion);
  }
}
