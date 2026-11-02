import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';

import { NovedadCurso, PadronesNovedades } from './autorizar-novedades.models';

/**
 * Novedades de cursos de las facultades (altas, bajas y cambios de cargos).
 * La autorización es una operación de servidor: el backend aplica la novedad
 * sobre curso_cargo, actualiza legajo_control y depura la fusión en una sola
 * transacción.
 */
@Injectable({ providedIn: 'root' })
export class AutorizarNovedadesService {
  private readonly http = inject(HttpClient);

  private readonly baseUrl = '/api/haberes/core/cursocargonovedad';
  private readonly reportUrl = '/api/haberes/report/cursocargonovedad';

  getPadrones(anho: number, mes: number): Observable<PadronesNovedades> {
    return forkJoin({
      pendienteAlta: this.get<NovedadCurso>('pendientealta', anho, mes),
      pendienteBaja: this.get<NovedadCurso>('pendientebaja', anho, mes),
      autorizadaAlta: this.get<NovedadCurso>('autorizadoalta', anho, mes),
      autorizadaBaja: this.get<NovedadCurso>('autorizadobaja', anho, mes),
      rechazadaAlta: this.get<NovedadCurso>('rechazadoalta', anho, mes),
      rechazadaBaja: this.get<NovedadCurso>('rechazadobaja', anho, mes)
    }).pipe(
      map((padrones) => ({
        pendienteAlta: ordenar(padrones.pendienteAlta),
        pendienteBaja: ordenar(padrones.pendienteBaja),
        autorizadaAlta: ordenar(padrones.autorizadaAlta),
        autorizadaBaja: ordenar(padrones.autorizadaBaja),
        rechazadaAlta: ordenar(padrones.rechazadaAlta),
        rechazadaBaja: ordenar(padrones.rechazadaBaja)
      }))
    );
  }

  autorizar(cursoCargoNovedadId: number, respuesta: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/autorizar/${cursoCargoNovedadId}`, { respuesta });
  }

  rechazar(cursoCargoNovedadId: number, respuesta: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/rechazar/${cursoCargoNovedadId}`, { respuesta });
  }

  anular(cursoCargoNovedadId: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/anular/${cursoCargoNovedadId}`, {});
  }

  /** Padrón completo del período (pendientes, autorizadas y rechazadas). */
  descargarPeriodo(anho: number, mes: number): Observable<Blob> {
    return this.http.get(`${this.reportUrl}/periodo/${anho}/${mes}`, { responseType: 'blob' });
  }

  /** Sólo las novedades todavía sin resolver. */
  descargarPendientes(anho: number, mes: number): Observable<Blob> {
    return this.http.get(`${this.reportUrl}/pendientes/${anho}/${mes}`, { responseType: 'blob' });
  }

  private get<T>(padron: string, anho: number, mes: number): Observable<T[]> {
    return this.http.get<T[]>(`${this.baseUrl}/${padron}/${anho}/${mes}`);
  }
}

function ordenar(novedades: NovedadCurso[]): NovedadCurso[] {
  return [...novedades].sort((a, b) => {
    const apellidoA = a.persona?.apellido ?? '';
    const apellidoB = b.persona?.apellido ?? '';
    if (apellidoA !== apellidoB) {
      return apellidoA.localeCompare(apellidoB, 'es');
    }
    return (a.persona?.nombre ?? '').localeCompare(b.persona?.nombre ?? '', 'es');
  });
}
