import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AsignacionCursosService {
  private readonly http = inject(HttpClient);

  private readonly cursoUrl = '/api/haberes/core/curso';
  private readonly cargoTipoUrl = '/api/haberes/core/cargotipo';
  private readonly geograficaUrl = '/api/haberes/core/geografica';
  private readonly cursoCargoUrl = '/api/haberes/core/cursoCargo';
  private readonly cursoCargoContratadoUrl = '/api/haberes/core/cursoCargoContratado';
  private readonly cursoCargoNovUrl = '/api/haberes/core/cursocargonovedad';
  private readonly acreditacionUrl = '/api/haberes/core/acreditacion';

  getSedes(): Observable<any[]> {
    return this.http.get<any[]>(this.geograficaUrl + '/');
  }

  getCursosFiltrados(facultadId: number, geograficaId: number, filterText: string): Observable<any[]> {
    const conditions = filterText.split(' ').map(w => w.trim()).filter(w => w.length > 0);
    return this.http.post<any[]>(this.cursoUrl + '/geografica/' + facultadId + '/' + geograficaId, conditions);
  }

  getCargosTipos(): Observable<any[]> {
    return this.http.get<any[]>(this.cargoTipoUrl + '/');
  }

  getCargosTitulares(cursoId: number, anho: number, mes: number): Observable<any[]> {
    return this.http.get<any[]>(this.cursoCargoUrl + '/curso/' + cursoId + '/' + anho + '/' + mes);
  }
  
  getCargosContratados(cursoId: number, anho: number, mes: number): Observable<any[]> {
    return this.http.get<any[]>(this.cursoCargoContratadoUrl + '/curso/' + cursoId + '/' + anho + '/' + mes);
  }

  getCargosAlta(cursoId: number, anho: number, mes: number): Observable<any[]> {
    return this.http.get<any[]>(this.cursoCargoNovUrl + '/cursopendientealta/' + cursoId + '/' + anho + '/' + mes);
  }

  getCargosBaja(cursoId: number, anho: number, mes: number): Observable<any[]> {
    return this.http.get<any[]>(this.cursoCargoNovUrl + '/cursopendientebaja/' + cursoId + '/' + anho + '/' + mes);
  }

  getAcreditacion(anho: number, mes: number): Observable<any> {
    return this.http.get<any>(this.acreditacionUrl + '/periodo/' + anho + '/' + mes);
  }

  addNovedad(novedad: any): Observable<any> {
    return this.http.post<any>(this.cursoCargoNovUrl + '/', novedad);
  }

  getNovedadByUnique(cursoId: number, anho: number, mes: number, cargoTipoId: number, legajoId: number): Observable<any> {
    return this.http.get<any>(this.cursoCargoNovUrl + '/unique/' + cursoId + '/' + anho + '/' + mes + '/' + cargoTipoId + '/' + legajoId);
  }

  getNovedadPendienteByLegajo(legajoId: number, cursoId: number, anho: number, mes: number): Observable<any[]> {
    return this.http.get<any[]>(this.cursoCargoNovUrl + '/pendientelegajo/' + legajoId + '/' + cursoId + '/' + anho + '/' + mes);
  }

  deleteNovedadPendiente(legajoId: number, cursoId: number, anho: number, mes: number): Observable<any> {
    return this.http.delete(this.cursoCargoNovUrl + '/legajoPendiente/' + legajoId + '/' + cursoId + '/' + anho + '/' + mes);
  }
  
  downloadReport(facultadId: number, anho: number, mes: number): Observable<Blob> {
    return this.http.get('/api/haberes/report/novedades/novedadesDocentes/' + facultadId + '/' + anho + '/' + mes, { responseType: 'blob' });
  }
}
