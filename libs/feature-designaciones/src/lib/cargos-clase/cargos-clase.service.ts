import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  Antiguedad,
  CargoClase,
  CargoClaseDetalle,
  CargoClasePeriodo,
  CargoClasePeriodoPayload,
  Dependencia,
  Facultad,
  Geografica
} from './cargos-clase.models';

/**
 * Cargos con clase: asignación por legajo y duplicación de períodos.
 *
 * Los procesos pesados (control de períodos acreditados y generación de los
 * detalles mensuales) los resuelve `cargoclasetool` en el servidor: acá sólo se
 * envían los datos y se muestra el mensaje que devuelve.
 */
@Injectable({ providedIn: 'root' })
export class CargosClaseService {
  private readonly http = inject(HttpClient);

  private readonly cargoClaseUrl = '/api/haberes/core/cargoclase';
  private readonly periodoUrl = '/api/haberes/core/cargoclaseperiodo';
  private readonly detalleUrl = '/api/haberes/core/cargoclasedetalle';
  private readonly herramientaUrl = '/api/haberes/core/cargoclasetool';
  private readonly facultadUrl = '/api/haberes/core/facultad';
  private readonly geograficaUrl = '/api/haberes/core/geografica';
  private readonly dependenciaUrl = '/api/haberes/core/dependencia';
  private readonly antiguedadUrl = '/api/haberes/core/antiguedad';
  private readonly designacionToolUrl = '/api/haberes/core/designaciontool';

  getCargosClase(): Observable<CargoClase[]> {
    return this.http.get<CargoClase[]>(`${this.cargoClaseUrl}/`);
  }

  getFacultades(): Observable<Facultad[]> {
    return this.http.get<Facultad[]>(`${this.facultadUrl}/`);
  }

  getGeograficas(): Observable<Geografica[]> {
    return this.http.get<Geografica[]>(`${this.geograficaUrl}/`);
  }

  getDependencias(facultadId: number, geograficaId: number): Observable<Dependencia[]> {
    return this.http.get<Dependencia[]>(`${this.dependenciaUrl}/context/${facultadId}/${geograficaId}`);
  }

  /** Períodos de cargo con clase de un legajo (todas las facultades). */
  getPeriodosByLegajo(legajoId: number): Observable<CargoClasePeriodo[]> {
    return this.http.get<CargoClasePeriodo[]>(`${this.periodoUrl}/legajo/${legajoId}`);
  }

  /** Detalle mensual de un período y facultad (base de la duplicación). */
  getDetalleByFacultad(facultadId: number, anho: number, mes: number): Observable<CargoClaseDetalle[]> {
    return this.http.get<CargoClaseDetalle[]>(`${this.detalleUrl}/facultad/${facultadId}/${anho}/${mes}`);
  }

  getIndicesAntiguedad(legajoId: number, anho: number, mes: number): Observable<number[]> {
    return this.http.get<number[]>(`${this.designacionToolUrl}/indiceantiguedad/${legajoId}/${anho}/${mes}`);
  }

  getAntiguedad(legajoId: number, anho: number, mes: number): Observable<Antiguedad> {
    return this.http.get<Antiguedad>(`${this.antiguedadUrl}/unique/${legajoId}/${anho}/${mes}`);
  }

  // --- Procesos (devuelven "Ok" o un mensaje de error de negocio) ---

  addPeriodo(payload: CargoClasePeriodoPayload): Observable<string> {
    return this.http.post(`${this.herramientaUrl}/`, payload, { responseType: 'text' });
  }

  deletePeriodo(cargoClasePeriodoId: number): Observable<string> {
    return this.http.delete(`${this.herramientaUrl}/${cargoClasePeriodoId}`, { responseType: 'text' });
  }

  changeHasta(cargoClasePeriodoId: number, anhoHasta: number, mesHasta: number): Observable<string> {
    return this.http.put(
      `${this.herramientaUrl}/${cargoClasePeriodoId}/${anhoHasta}/${mesHasta}`,
      {},
      { responseType: 'text' }
    );
  }
}
