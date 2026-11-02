import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '@haberes/shared-api';

export interface Clase {
  claseId: number;
  nombre: string;
  valorHora: number;
}

export interface CargoClase {
  cargoClaseId: number | null;
  nombre: string;
  claseId: number | null;
  clase?: Clase | null;
}

export interface CargoClasePeriodoResumen {
  periodoDesde?: number | null;
  periodoHasta?: number | null;
}

export interface PersonaResumen {
  legajoId?: number;
  apellido?: string;
  nombre?: string;
  apellidoNombre?: string;
}

/** Fila de `cargo_clase_detalle` con las relaciones que expone el backend legacy. */
export interface CargoClaseDetalle {
  cargoClaseDetalleId: number;
  legajoId: number;
  anho: number;
  mes: number;
  horas: number;
  persona?: PersonaResumen | null;
  cargoClasePeriodo?: CargoClasePeriodoResumen | null;
}

@Injectable({ providedIn: 'root' })
export class CargosClaseService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = inject(API_URL, { optional: true }) || '/api/haberes';

  private get url(): string {
    return `${this.apiBase}/core/cargoclase`;
  }

  getCargos(): Observable<CargoClase[]> {
    return this.http.get<CargoClase[]>(`${this.url}/`);
  }

  getClases(): Observable<Clase[]> {
    return this.http.get<Clase[]>(`${this.apiBase}/core/clase/`);
  }

  create(cargo: CargoClase): Observable<CargoClase> {
    return this.http.post<CargoClase>(`${this.url}/`, cargo);
  }

  update(cargoClaseId: number, cargo: CargoClase): Observable<CargoClase> {
    return this.http.put<CargoClase>(`${this.url}/${cargoClaseId}`, cargo);
  }

  /** Legajos asignados al cargo en el período (sólo lectura en este módulo). */
  getDetalle(cargoClaseId: number, anho: number, mes: number): Observable<CargoClaseDetalle[]> {
    return this.http.get<CargoClaseDetalle[]>(
      `${this.apiBase}/core/cargoclasedetalle/cargoclase/${cargoClaseId}/${anho}/${mes}`,
    );
  }
}
