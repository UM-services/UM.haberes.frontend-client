import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { API_URL } from '@haberes/shared-api';

export interface Codigo {
  codigoId: number;
  nombre: string;
  docente: number;
  noDocente: number;
  transferible: number;
  incluidoEtec: number;
  afipConceptoSueldoIdPrimerSemestre: number | null;
  afipConceptoSueldoIdSegundoSemestre: number | null;
}

/** `codigo_grupo`: clasificación contable del código (1 = pertenece al grupo). */
export interface CodigoGrupo {
  codigoId: number;
  remunerativo: number;
  noRemunerativo: number;
  deduccion: number;
  total: number;
}

export interface AfipConcepto {
  afipConceptoSueldoId: number;
  descripcion: string;
  asignado: number;
  search: string;
}

@Injectable({ providedIn: 'root' })
export class CodigosService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = inject(API_URL, { optional: true }) || '/api/haberes';

  private get codigoUrl(): string {
    return `${this.apiBase}/core/codigo`;
  }

  private get grupoUrl(): string {
    return `${this.apiBase}/core/codigogrupo`;
  }

  private get afipUrl(): string {
    return `${this.apiBase}/core/afipConceptoSueldo`;
  }

  getCodigos(): Observable<Codigo[]> {
    return this.http.get<Codigo[]>(`${this.codigoUrl}/`);
  }

  getLast(): Observable<Codigo> {
    return this.http.get<Codigo>(`${this.codigoUrl}/last`);
  }

  create(codigo: Codigo): Observable<Codigo> {
    return this.http.post<Codigo>(`${this.codigoUrl}/`, codigo);
  }

  update(codigo: Codigo): Observable<Codigo> {
    return this.http.put<Codigo>(`${this.codigoUrl}/${codigo.codigoId}`, codigo);
  }

  getGrupos(): Observable<CodigoGrupo[]> {
    return this.http.get<CodigoGrupo[]>(`${this.grupoUrl}/`);
  }

  /** 404 cuando el código todavía no tiene grupo contable. */
  getGrupo(codigoId: number): Observable<CodigoGrupo | null> {
    return this.http
      .get<CodigoGrupo>(`${this.grupoUrl}/${codigoId}`)
      .pipe(catchError(() => of(null)));
  }

  saveGrupo(grupo: CodigoGrupo, existe: boolean): Observable<CodigoGrupo> {
    return existe
      ? this.http.put<CodigoGrupo>(`${this.grupoUrl}/${grupo.codigoId}`, grupo)
      : this.http.post<CodigoGrupo>(`${this.grupoUrl}/`, grupo);
  }

  searchAfip(conditions: string[]): Observable<AfipConcepto[]> {
    return this.http.post<AfipConcepto[]>(`${this.afipUrl}/search`, conditions);
  }

  getAfipConcepto(afipConceptoSueldoId: number): Observable<AfipConcepto> {
    return this.http.get<AfipConcepto>(`${this.afipUrl}/${afipConceptoSueldoId}`);
  }
}
