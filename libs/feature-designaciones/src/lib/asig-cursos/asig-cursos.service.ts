import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AsignacionCursosService {
  private readonly http = inject(HttpClient);

  private readonly cursoUrl = '/api/haberes/core/curso';
  private readonly facultadUrl = '/api/haberes/core/facultad';
  private readonly nivelUrl = '/api/haberes/core/nivel';
  private readonly herramientaUrl = '/api/haberes/core/designaciontool';
  private readonly cargoTipoUrl = '/api/haberes/core/cargotipo';
  private readonly geograficaUrl = '/api/haberes/core/geografica';
  private readonly cursoCargoUrl = '/api/haberes/core/cursoCargo';
  private readonly cursoCargoContratadoUrl = '/api/haberes/core/cursoCargoContratado';
  private readonly cursoCargoNovUrl = '/api/haberes/core/cursocargonovedad';
  private readonly acreditacionUrl = '/api/haberes/core/acreditacion';

  getSedes(): Observable<any[]> {
    return this.http.get<any[]>(this.geograficaUrl + '/');
  }

  /** Facultades de grado: alimenta el selector del módulo global. */
  getFacultades(): Observable<FacultadResumen[]> {
    return this.http.get<FacultadResumen[]>(this.facultadUrl + '/');
  }

  /** Niveles académicos (grado, secundario, tecnicatura). */
  getNiveles(): Observable<NivelResumen[]> {
    return this.http.get<NivelResumen[]>(this.nivelUrl + '/');
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

  /** Cargos del curso en cualquier período (control previo al borrado del curso). */
  getCargosCursoAny(cursoId: number): Observable<any[]> {
    return this.http.get<any[]>(this.cursoCargoUrl + '/cursoany/' + cursoId);
  }

  eliminarCargo(cursoCargoId: number): Observable<void> {
    return this.http.delete<void>(`${this.cursoCargoUrl}/${cursoCargoId}`);
  }

  /** Cargo de un legajo en el curso (asignación directa del módulo global). */
  getCargoPorLegajo(cursoId: number, anho: number, mes: number, legajoId: number): Observable<any> {
    return this.http.get<any>(`${this.cursoCargoUrl}/legajo/${cursoId}/${anho}/${mes}/${legajoId}`);
  }

  addCargo(cargo: CargoPayload): Observable<any> {
    return this.http.post<any>(`${this.cursoCargoUrl}/`, cargo);
  }

  updateCargo(cursoCargoId: number, cargo: CargoPayload): Observable<any> {
    return this.http.put<any>(`${this.cursoCargoUrl}/${cursoCargoId}`, cargo);
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

  getNovedadPendienteByLegajo(legajoId: number, cursoId: number, anho: number, mes: number): Observable<any[]> {
    return this.http.get<any[]>(this.cursoCargoNovUrl + '/pendientelegajo/' + legajoId + '/' + cursoId + '/' + anho + '/' + mes);
  }

  deleteNovedadPendiente(legajoId: number, cursoId: number, anho: number, mes: number): Observable<any> {
    return this.http.delete(this.cursoCargoNovUrl + '/legajoPendiente/' + legajoId + '/' + cursoId + '/' + anho + '/' + mes);
  }
  
  downloadReport(facultadId: number, anho: number, mes: number): Observable<Blob> {
    return this.http.get('/api/haberes/report/novedades/novedadesDocentes/' + facultadId + '/' + anho + '/' + mes, { responseType: 'blob' });
  }

  // --- CRUD de cursos (módulo global) ---

  addCurso(curso: CursoPayload): Observable<CursoResumen> {
    return this.http.post<CursoResumen>(`${this.cursoUrl}/`, curso);
  }

  updateCurso(cursoId: number, curso: CursoPayload): Observable<CursoResumen> {
    return this.http.put<CursoResumen>(`${this.cursoUrl}/${cursoId}`, curso);
  }

  deleteCurso(cursoId: number): Observable<void> {
    return this.http.delete<void>(`${this.cursoUrl}/${cursoId}`);
  }

  /**
   * Marca como no fusionados los legajos con cargos en el curso. El servidor
   * recorre el plantel: el cliente no manipula legajo_control.
   */
  invalidarFusionCurso(cursoId: number, anho: number, mes: number): Observable<void> {
    return this.http.post<void>(`${this.herramientaUrl}/invalidafusion/curso/${cursoId}/${anho}/${mes}`, {});
  }
}

export interface FacultadResumen {
  facultadId: number;
  nombre: string;
  reducido?: string;
}

export interface NivelResumen {
  nivelId: number;
  nombre: string;
}

export interface CursoResumen {
  cursoId: number;
  nombre: string;
  facultadId: number;
  geograficaId: number;
  anual: number;
  semestre1: number;
  semestre2: number;
  nivelId: number | null;
  adicionalCargaHoraria: number;
}

export interface CursoPayload {
  nombre: string;
  facultadId: number;
  geograficaId: number;
  anual: number;
  semestre1: number;
  semestre2: number;
  nivelId: number | null;
  adicionalCargaHoraria: number;
}

/** Asignación directa de un cargo (módulo global, sin novedad previa). */
export interface CargoPayload {
  cursoId: number;
  anho: number;
  mes: number;
  cargoTipoId: number;
  legajoId: number;
  horasSemanales: number;
  horasTotales: number;
  desarraigo: number;
}
