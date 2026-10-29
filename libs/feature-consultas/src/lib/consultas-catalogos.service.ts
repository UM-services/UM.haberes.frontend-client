import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface FacultadConsulta {
  facultadId: number;
  nombre: string;
}

export interface SedeConsulta {
  geograficaId: number;
  nombre: string;
}

export interface CodigoConsulta {
  codigoId: number;
  nombre: string;
}

export interface CategoriaConsulta {
  categoriaId: number;
  nombre: string;
}

export interface DependenciaConsulta {
  dependenciaId: number;
  nombre: string;
}

/** Catálogos que necesitan las consultas con filtros de facultad o sede. */
@Injectable({ providedIn: 'root' })
export class ConsultasCatalogosService {
  private readonly http = inject(HttpClient);
  private readonly facultadUrl = '/api/haberes/core/facultad';
  private readonly geograficaUrl = '/api/haberes/core/geografica';
  private readonly codigoUrl = '/api/haberes/core/codigo';
  private readonly categoriaUrl = '/api/haberes/core/categoria';
  private readonly dependenciaUrl = '/api/haberes/core/dependencia';

  facultades(): Observable<FacultadConsulta[]> {
    return this.http.get<FacultadConsulta[]>(`${this.facultadUrl}/`);
  }

  sedes(): Observable<SedeConsulta[]> {
    return this.http.get<SedeConsulta[]>(`${this.geograficaUrl}/`);
  }

  codigos(): Observable<CodigoConsulta[]> {
    return this.http.get<CodigoConsulta[]>(`${this.codigoUrl}/`);
  }

  categorias(): Observable<CategoriaConsulta[]> {
    return this.http.get<CategoriaConsulta[]>(`${this.categoriaUrl}/`);
  }

  dependencias(): Observable<DependenciaConsulta[]> {
    return this.http.get<DependenciaConsulta[]>(`${this.dependenciaUrl}/`);
  }
}
