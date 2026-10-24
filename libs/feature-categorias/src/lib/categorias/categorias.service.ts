import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '@haberes/shared-api';

export interface Categoria {
  categoriaId: number;
  nombre: string;
  basico: number;
  docente: number;
  noDocente: number;
  liquidaPorHora: number;
  estadoDocente: number;
}

/** Payload de `POST /categoria/{anho}/{mes}` y `PUT /categoria/{id}/{anho}/{mes}`. */
export interface CategoriaRequest {
  categoriaId: number;
  nombre: string;
  basico: number;
  docente: number;
  noDocente: number;
  liquidaPorHora: number;
  estadoDocente: number;
}

export interface CategoriaUploadRequest {
  filename: string;
  base64: string;
}

@Injectable({ providedIn: 'root' })
export class CategoriasService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = inject(API_URL, { optional: true }) || '/api/haberes';

  private get url(): string {
    return `${this.apiBase}/core/categoria`;
  }

  getCategorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.url}/`);
  }

  getLast(): Observable<Categoria> {
    return this.http.get<Categoria>(`${this.url}/last`);
  }

  /** El período versiona `categoria_periodo`: el básico se guarda por año/mes. */
  create(categoria: CategoriaRequest, anho: number, mes: number): Observable<Categoria> {
    return this.http.post<Categoria>(`${this.url}/${anho}/${mes}`, categoria);
  }

  update(categoria: CategoriaRequest, anho: number, mes: number): Observable<Categoria> {
    return this.http.put<Categoria>(
      `${this.url}/${categoria.categoriaId}/${anho}/${mes}`,
      categoria,
    );
  }

  delete(categoriaId: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${categoriaId}`);
  }

  /** Planilla de categorías del sistema (xlsx), generada por `sheet/generateCategorias`. */
  download(): Observable<Blob> {
    return this.http.get(`${this.apiBase}/core/sheet/generateCategorias`, { responseType: 'blob' });
  }

  upload(file: CategoriaUploadRequest, anho: number, mes: number): Observable<void> {
    return this.http.post<void>(`${this.url}/upload/${anho}/${mes}`, file);
  }
}
