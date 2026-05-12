import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CargosReportService {
  private readonly http = inject(HttpClient);
  // According to our investigation: /api/haberes/report/bono/detalleCargos/{legajoId}/{anho}/{mes}/{facultadId}
  private readonly reportUrl = '/api/haberes/report/bono/detalleCargos';

  downloadCargosReport(legajoId: number, anho: number, mes: number, facultadId: number): Observable<Blob> {
    const url = `${this.reportUrl}/${legajoId}/${anho}/${mes}/${facultadId}`;
    return this.http.get(url, { responseType: 'blob' });
  }
}
