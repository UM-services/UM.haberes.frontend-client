import { Component, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, finalize, of } from 'rxjs';

import { mensajeDeError } from '@haberes/shared-api';

import { AutorizarNovedadesService } from './autorizar-novedades.service';
import {
  EstadoNovedad,
  NovedadCurso,
  NovedadCursoVm,
  PadronesNovedades,
  TipoNovedad,
  padronVacio
} from './autorizar-novedades.models';

/**
 * Autorización de las novedades de cursos (altas, bajas y cambios de cargos)
 * que envían las facultades.
 *
 * Seis padrones (alta/baja × pendiente/autorizada/rechazada) sobre una sola
 * tabla: la acción de autorizar o rechazar la ejecuta el servidor, que aplica
 * el efecto sobre el cargo y deja el legajo listo para re-fusionar.
 */
@Component({
  selector: 'haberes-autorizar-novedades',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, FormsModule],
  templateUrl: './autorizar-novedades.component.html'
})
export class AutorizarNovedadesComponent {
  private readonly service = inject(AutorizarNovedadesService);

  readonly anho = signal<number>(new Date().getFullYear());
  readonly mes = signal<number>(new Date().getMonth() + 1);

  readonly padrones = signal<PadronesNovedades>(padronVacio());
  readonly tipo = signal<TipoNovedad>('alta');
  readonly estado = signal<EstadoNovedad>('pendiente');
  readonly seleccionada = signal<NovedadCurso | null>(null);
  readonly respuesta = signal<string>('');

  readonly isLoading = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly isPrinting = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly exito = signal<string | null>(null);

  readonly filas = computed<NovedadCursoVm[]>(() => {
    const padron = this.padronActual();
    return padron.map((novedad) => {
      const persona = novedad.persona;
      const nombre = persona?.apellidoNombre
        ? persona.apellidoNombre
        : `${persona?.apellido ?? ''}, ${persona?.nombre ?? ''}`.replace(/^, |, $/g, '');
      return {
        novedad,
        legajo: novedad.legajoId,
        docente: nombre || `Legajo ${novedad.legajoId}`,
        facultad: novedad.curso?.facultad?.nombre ?? '',
        sede: novedad.curso?.geografica?.nombre ?? '',
        curso: novedad.curso?.nombre ?? '',
        cargo: novedad.cargoTipo?.nombre ?? '',
        horas: novedad.horasSemanales ?? null,
        desarraigo: novedad.desarraigo === 1,
        solicitud: novedad.solicitud ?? '',
        respuesta: novedad.respuesta ?? ''
      };
    });
  });

  readonly totalPendientes = computed<number>(
    () => this.padrones().pendienteAlta.length + this.padrones().pendienteBaja.length
  );

  readonly puedeVisar = computed<boolean>(() => {
    const novedad = this.seleccionada();
    return !!novedad && this.estado() === 'pendiente' && !this.isSaving();
  });

  readonly puedeAnular = computed<boolean>(() => {
    const novedad = this.seleccionada();
    return !!novedad && this.estado() !== 'pendiente' && !this.isSaving();
  });

  cambiarMes(incremento: number): void {
    let mes = this.mes() + incremento;
    let anho = this.anho();
    if (mes > 12) {
      mes = 1;
      anho++;
    }
    if (mes < 1) {
      mes = 12;
      anho--;
    }
    this.mes.set(mes);
    this.anho.set(anho);
    this.limpiarSeleccion();
    this.padrones.set(padronVacio());
  }

  onMesChange(valor: number): void {
    this.mes.set(valor);
    this.padrones.set(padronVacio());
    this.limpiarSeleccion();
  }

  onAnhoChange(valor: number): void {
    this.anho.set(valor);
    this.padrones.set(padronVacio());
    this.limpiarSeleccion();
  }

  cambiarTipo(tipo: TipoNovedad): void {
    this.tipo.set(tipo);
    this.limpiarSeleccion();
  }

  cambiarEstado(estado: EstadoNovedad): void {
    this.estado.set(estado);
    this.limpiarSeleccion();
  }

  seleccionar(fila: NovedadCursoVm): void {
    this.seleccionada.set(fila.novedad);
    this.respuesta.set('');
    this.error.set(null);
    this.exito.set(null);
  }

  revisar(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.exito.set(null);
    this.limpiarSeleccion();
    this.service
      .getPadrones(this.anho(), this.mes())
      .pipe(
        catchError(() => {
          this.error.set('No se pudieron cargar las novedades del período.');
          return of(padronVacio());
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe((padrones) => this.padrones.set(padrones));
  }

  autorizar(): void {
    this.visar(true);
  }

  rechazar(): void {
    this.visar(false);
  }

  /** Imprime el padrón del período completo o sólo los pendientes. */
  imprimir(soloPendientes: boolean): void {
    this.isPrinting.set(true);
    this.error.set(null);
    const descarga$ = soloPendientes
      ? this.service.descargarPendientes(this.anho(), this.mes())
      : this.service.descargarPeriodo(this.anho(), this.mes());

    descarga$.pipe(finalize(() => this.isPrinting.set(false))).subscribe({
      next: (blob) => {
        const sufijo = soloPendientes ? '-pendientes' : '';
        this.abrirPdf(blob, `novedades-cursos${sufijo}-${this.mes()}-${this.anho()}.pdf`);
      },
      error: (err: HttpErrorResponse) =>
        this.error.set(mensajeDeError(err, 'No se pudo generar el reporte de novedades.'))
    });
  }

  anular(): void {
    const novedad = this.seleccionada();
    if (!novedad) {
      return;
    }
    const mensaje = 'Se revertirá el estado de la novedad y su efecto sobre el cargo del docente. ¿Continuar?';
    if (!window.confirm(mensaje)) {
      return;
    }

    this.isSaving.set(true);
    this.error.set(null);
    this.exito.set(null);
    this.service
      .anular(novedad.cursoCargoNovedadId)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.exito.set('Novedad anulada.');
          this.recargar();
        },
        error: (err: HttpErrorResponse) =>
          this.error.set(mensajeDeError(err, 'No se pudo anular la novedad.'))
      });
  }

  private visar(autorizado: boolean): void {
    const novedad = this.seleccionada();
    const respuesta = this.respuesta().trim();
    if (!novedad) {
      this.error.set('Elija una novedad de la lista.');
      return;
    }
    if (!respuesta) {
      this.error.set('Falta RESPUESTA.');
      return;
    }

    this.isSaving.set(true);
    this.error.set(null);
    this.exito.set(null);
    const accion$ = autorizado
      ? this.service.autorizar(novedad.cursoCargoNovedadId, respuesta)
      : this.service.rechazar(novedad.cursoCargoNovedadId, respuesta);

    accion$.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.exito.set(autorizado ? 'Novedad autorizada y aplicada.' : 'Novedad rechazada.');
        this.recargar();
      },
      error: (err: HttpErrorResponse) =>
        this.error.set(mensajeDeError(err, 'No se pudo registrar la novedad.'))
    });
  }

  /** Recarga los padrones sin limpiar el mensaje de resultado. */
  private recargar(): void {
    this.isLoading.set(true);
    this.service
      .getPadrones(this.anho(), this.mes())
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (padrones) => {
          this.padrones.set(padrones);
          this.seleccionada.set(null);
          this.respuesta.set('');
        },
        error: () => this.error.set('No se pudieron recargar las novedades del período.')
      });
  }

  private limpiarSeleccion(): void {
    this.seleccionada.set(null);
    this.respuesta.set('');
  }

  private abrirPdf(blob: Blob, nombre: string): void {
    const pdf = blob.type === 'application/pdf' ? blob : new Blob([blob], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(pdf);
    const ventana = window.open(url, '_blank');
    if (!ventana) {
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = nombre;
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
    }
    setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
  }

  private padronActual(): NovedadCurso[] {
    const padrones = this.padrones();
    const tipo = this.tipo();
    switch (this.estado()) {
      case 'pendiente':
        return tipo === 'alta' ? padrones.pendienteAlta : padrones.pendienteBaja;
      case 'autorizada':
        return tipo === 'alta' ? padrones.autorizadaAlta : padrones.autorizadaBaja;
      default:
        return tipo === 'alta' ? padrones.rechazadaAlta : padrones.rechazadaBaja;
    }
  }
}
