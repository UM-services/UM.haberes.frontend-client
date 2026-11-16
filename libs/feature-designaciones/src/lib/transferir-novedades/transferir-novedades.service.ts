import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, throwError } from 'rxjs';

import {
  AcreditacionPeriodo,
  AnotacionFacultad,
  CargoNovedad
} from './transferir-novedades.models';

/**
 * Transferencia mensual de novedades: anotaciones de facultades y cargos.
 *
 * Usa exclusivamente los contratos existentes de haberes-core. El proceso es
 * una secuencia de escrituras individuales (el legacy hacía lo mismo), por eso
 * el componente controla el progreso y los errores fila por fila.
 */
@Injectable({ providedIn: 'root' })
export class TransferirNovedadesService {
  private readonly http = inject(HttpClient);

  private readonly url = '/api/haberes/core';

  /** Anotaciones pendientes del período (autorizado = 0 y rechazado = 0). */
  anotacionesPendientes(anho: number, mes: number): Observable<AnotacionFacultad[]> {
    return this.http.get<AnotacionFacultad[]>(`${this.url}/anotador/pendiente/${anho}/${mes}`);
  }

  /** Cargos pendientes del período (autorizado = 0 y rechazado = 0). */
  cargosPendientes(anho: number, mes: number): Observable<CargoNovedad[]> {
    return this.http.get<CargoNovedad[]>(`${this.url}/cursocargonovedad/pendiente/${anho}/${mes}`);
  }

  /**
   * Todas las novedades de cargos del período (pendientes, autorizadas y
   * rechazadas). Se usa para conocer las claves que ya existen en el destino
   * con una sola lectura, en lugar de una consulta por fila.
   */
  cargosDelPeriodo(anho: number, mes: number): Observable<CargoNovedad[]> {
    return this.http.get<CargoNovedad[]>(`${this.url}/cursocargonovedad/periodo/${anho}/${mes}`);
  }

  /** 404 = período sin registro de acreditación (abierto). */
  acreditacionDelPeriodo(anho: number, mes: number): Observable<AcreditacionPeriodo | null> {
    return this.http
      .get<AcreditacionPeriodo>(`${this.url}/acreditacion/periodo/${anho}/${mes}`)
      .pipe(catchError((error: { status?: number }) => error.status === 404 ? of(null) : throwError(() => error)));
  }

  /**
   * Mueve la anotación al período destino conservando su estado pendiente.
   * El backend hace un reemplazo total: se envían sólo los escalares de la
   * entidad (sin `persona` ni `facultad`, que resuelve por id).
   */
  moverAnotacion(anotacion: AnotacionFacultad, anho: number, mes: number,
                 solicitante: number | null): Observable<AnotacionFacultad> {
    return this.http.put<AnotacionFacultad>(
      `${this.url}/anotador/${anotacion.anotadorId}`,
      {
        legajoId: anotacion.legajoId,
        anho,
        mes,
        facultadId: anotacion.facultadId,
        anotacion: anotacion.anotacion,
        visado: anotacion.visado,
        ipVisado: anotacion.ipVisado,
        user: anotacion.user,
        respuesta: anotacion.respuesta,
        autorizado: anotacion.autorizado,
        rechazado: anotacion.rechazado,
        rectorado: anotacion.rectorado,
        transferido: 1
      },
      this.headers(solicitante)
    );
  }

  /**
   * Clona el cargo pendiente en el período destino. Se omiten el id y los
   * objetos embebidos (`curso`, `cargoTipo`, `persona`): el backend los
   * resuelve por sus identificadores.
   */
  crearCargo(cargo: CargoNovedad, anho: number, mes: number,
             solicitante: number | null): Observable<CargoNovedad> {
    return this.http.post<CargoNovedad>(
      `${this.url}/cursocargonovedad/`,
      {
        cursoId: cargo.cursoId,
        anho,
        mes,
        cargoTipoId: cargo.cargoTipoId,
        legajoId: cargo.legajoId,
        horasSemanales: cargo.horasSemanales,
        horasTotales: cargo.horasTotales,
        desarraigo: cargo.desarraigo,
        alta: cargo.alta,
        baja: cargo.baja,
        cambio: cargo.cambio,
        solicitud: cargo.solicitud,
        autorizado: cargo.autorizado,
        rechazado: cargo.rechazado,
        respuesta: cargo.respuesta,
        transferido: 1
      },
      this.headers(solicitante)
    );
  }

  private headers(solicitante: number | null): { headers: Record<string, string> } {
    return { headers: this.headerMap(solicitante) };
  }

  private headerMap(solicitante: number | null): Record<string, string> {
    return solicitante === null
      ? {}
      : { 'X-Legajo-Solicitante': String(solicitante) };
  }
}
