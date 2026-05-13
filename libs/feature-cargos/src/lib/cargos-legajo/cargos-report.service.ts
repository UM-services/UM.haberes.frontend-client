import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CargosReportService {
  private readonly http = inject(HttpClient);
  
  private readonly cargosReportUrl = '/api/haberes/report/bono/detalleCargos';
  // Encontrado en clsCtlPrint.cls: url_haberes & "api/haberes/report/docentes/docentesSede/" & ...
  private readonly docentesSedeReportUrl = '/api/haberes/report/docentes/docentesSede';
  
  private readonly geograficaUrl = '/api/haberes/core/geografica';

  downloadCargosReport(legajoId: number, anho: number, mes: number, facultadId: number): Observable<Blob> {
    const url = `${this.cargosReportUrl}/${legajoId}/${anho}/${mes}/${facultadId}`;
    return this.http.get(url, { responseType: 'blob' });
  }

  downloadDocentesSedeReport(facultadId: number, geograficaId: number, anho: number, mes: number): Observable<Blob> {
    const url = `${this.docentesSedeReportUrl}/${facultadId}/${geograficaId}/${anho}/${mes}`;
    return this.http.get(url, { responseType: 'blob' });
  }

  getGeograficas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.geograficaUrl}/`);
  }
}
