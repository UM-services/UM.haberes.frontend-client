import { Component, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { EMPTY, Subject, catchError, concatMap, finalize, from, map, of, switchMap, takeUntil, tap, toArray } from 'rxjs';

import { mensajeDeError } from '@haberes/shared-api';

import { FalloLote, FusionTodosService, PersonaLote } from './fusion-todos.service';
import { Periodo, moverMes, periodoTexto } from '../cargos-clase/cargos-clase.models';

type Fase = 'duplicar' | 'fusionar';

/** Estado de la consulta que habilita (o no) la duplicación del período. */
type EstadoCargos = 'cargando' | 'ok' | 'error';

/**
 * Proceso masivo del período: duplica los cargos del mes anterior (opcional),
 * fusiona todas las designaciones y recalcula el desarraigo.
 *
 * El backend procesa lotes de legajos (cada legajo en su transacción); la
 * pantalla divide el período para mostrar progreso y permitir cancelar.
 * No hay opción "forzar": el proceso siempre resetea el flag de fusión de cada
 * legajo, igual que el formulario legacy (donde el check estaba declarado pero
 * nunca se usaba).
 */
@Component({
  selector: 'haberes-fusion-todos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, FormsModule],
  templateUrl: './fusion-todos.component.html'
})
export class FusionTodosComponent {
  private readonly service = inject(FusionTodosService);
  private static readonly TAMANO_LOTE = 50;

  private cancel$ = new Subject<void>();

  readonly periodo = signal<Periodo>(periodoActual());
  readonly duplicar = signal<boolean>(false);
  readonly hayCargos = signal<boolean>(false);
  readonly estadoCargos = signal<EstadoCargos>('cargando');

  readonly running = signal<boolean>(false);
  readonly cancelado = signal<boolean>(false);
  readonly procesados = signal<number>(0);
  readonly total = signal<number>(0);
  readonly estado = signal<string>('');
  readonly fallidos = signal<FalloLote[]>([]);
  readonly depuracionPendiente = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly exito = signal<string | null>(null);

  readonly progreso = computed<number>(() =>
    this.total() === 0 ? 0 : Math.min(100, Math.round((this.procesados() * 100) / this.total()))
  );

  readonly periodoTexto = computed<string>(() => periodoTexto(this.periodo().anho * 100 + this.periodo().mes));

  constructor() {
    this.cargarEstadoDuplicar();
  }

  cambiarMes(incremento: number): void {
    this.periodo.set(moverMes(this.periodo(), incremento));
    this.error.set(null);
    this.exito.set(null);
    this.fallidos.set([]);
    this.procesados.set(0);
    this.total.set(0);
    this.estado.set('');
    this.cargarEstadoDuplicar();
  }

  /** Fusionar Todos: duplicar (opcional) + fusión + desarraigo + depuración. */
  fusionarTodos(): void {
    if (this.running() || this.estadoCargos() !== 'ok') {
      return;
    }
    const { anho, mes } = this.periodo();
    const duplicar = this.duplicar();
    const previo = moverMes(this.periodo(), -1);
    this.reiniciar();

    // G1: los docentes del período se leen DESPUÉS de duplicar, igual que el legacy.
    // Antes se leían en paralelo con la duplicación, por lo que un período vacío
    // (el único caso donde se permite duplicar) producía una fase de fusión vacía.
    const previos$ = duplicar ? this.service.getDocentes(previo.anho, previo.mes) : of<PersonaLote[]>([]);
    let duplicados = 0;

    previos$
      .pipe(
        tap((previos) => {
          duplicados = previos.length;
          if (duplicar) {
            this.total.update((valor) => valor + previos.length);
          }
        }),
        switchMap((previos) => {
          if (!duplicar || previos.length === 0 || this.cancelado()) {
            return of(null);
          }
          return this.procesarLotes('duplicar', previos.map((persona) => persona.legajoId)).pipe(
            toArray(),
            map(() => null)
          );
        }),
        switchMap(() => {
          if (this.cancelado()) {
            return of<PersonaLote[]>([]);
          }
          this.estado.set('Leyendo los docentes del período...');
          return this.service.getDocentes(anho, mes);
        }),
        tap((actuales) => this.total.update((valor) => valor + actuales.length)),
        switchMap((actuales) => {
          if (this.cancelado()) {
            return of(false);
          }
          if (actuales.length === 0) {
            this.error.set(
              duplicados > 0
                ? 'Se duplicaron los cargos del mes anterior, pero el período quedó sin docentes para fusionar.'
                : 'No hay docentes para procesar en el período.'
            );
            return of(false);
          }
          return this.procesarLotes('fusionar', actuales.map((persona) => persona.legajoId)).pipe(
            toArray(),
            map(() => true)
          );
        }),
        switchMap((fusionado) => {
          if (!fusionado || this.cancelado()) {
            return of(false);
          }
          this.estado.set('Depurando fusiones huérfanas...');
          return this.service.depurar(anho, mes).pipe(
            map(() => true),
            catchError(() => {
              this.depuracionPendiente.set(true);
              return of(false);
            })
          );
        }),
        finalize(() => this.running.set(false))
      )
      .subscribe({
        next: (ok) => {
          if (ok && !this.cancelado()) {
            this.cargarEstadoDuplicar();
          }
        },
        complete: () => this.cerrarProceso(),
        error: (err: HttpErrorResponse) => {
          this.error.set(mensajeDeError(err, 'No se pudo completar la fusión del período.'));
        }
      });
  }

  /** Recalc. Desarraigo: sólo recalcula los legajos con cursos de desarraigo. */
  recalcularDesarraigo(): void {
    if (this.running()) {
      return;
    }
    const { anho, mes } = this.periodo();
    this.reiniciar();

    this.service
      .getLegajosDesarraigo(anho, mes)
      .pipe(
        switchMap((personas) => {
          const legajos = personas.map((persona) => persona.legajoId);
          this.total.set(legajos.length);
          if (legajos.length === 0) {
            this.exito.set('No hay legajos con desarraigo en el período.');
            return of(false);
          }
          return this.procesarLotes('desarraigo', legajos).pipe(toArray(), map(() => true));
        }),
        finalize(() => this.running.set(false))
      )
      .subscribe({
        complete: () => this.cerrarProceso(),
        error: (err: HttpErrorResponse) =>
          this.error.set(mensajeDeError(err, 'No se pudieron obtener los legajos con desarraigo.'))
      });
  }

  cancelar(): void {
    if (!this.running()) {
      return;
    }
    this.cancelado.set(true);
    this.estado.set('Cancelando...');
    this.cancel$.next();
  }

  private procesarLotes(tipo: Fase | 'desarraigo', legajos: number[]) {
    if (legajos.length === 0) {
      return of(null);
    }
    const lotes = dividirEnLotes(legajos, FusionTodosComponent.TAMANO_LOTE);
    const { anho, mes } = this.periodo();
    let numeroLote = 0;

    this.estado.set(`${textoFase(tipo)} ${legajos.length} legajos...`);

    return from(lotes).pipe(
      takeUntil(this.cancel$),
      concatMap((lote) => {
        // El lote ya encolado no se envía si el usuario canceló: la cancelación
        // aplica entre lotes (el que está en vuelo termina normalmente).
        if (this.cancelado()) {
          return EMPTY;
        }
        numeroLote++;
        const peticion =
          tipo === 'duplicar'
            ? this.service.duplicarLote(lote, anho, mes)
            : tipo === 'fusionar'
              ? this.service.fusionarLote(lote, anho, mes)
              : this.service.desarraigoLote(lote, anho, mes);

        return peticion.pipe(
          tap((resumen) => {
            this.procesados.update((valor) => valor + resumen.procesados + resumen.fallidos.length);
            if (resumen.fallidos.length > 0) {
              this.fallidos.update((actuales) => [...actuales, ...resumen.fallidos]);
            }
            this.estado.set(`${textoFase(tipo)} lote ${numeroLote} de ${lotes.length}...`);
          }),
          catchError(() => {
            this.fallidos.update((actuales) => [
              ...actuales,
              ...lote.map((legajoId) => ({ legajoId, error: 'Error de comunicación con el servidor' }))
            ]);
            this.procesados.update((valor) => valor + lote.length);
            return of(null);
          })
        );
      })
    );
  }

  private cerrarProceso(): void {
    if (this.cancelado()) {
      this.exito.set(`Proceso cancelado: ${this.procesados()} de ${this.total()} legajos.`);
      return;
    }
    if (this.error()) {
      return;
    }
    const fallidos = this.fallidos().length;
    if (fallidos > 0) {
      this.exito.set(`Proceso terminado: ${this.procesados()} legajos, ${fallidos} con error.`);
    } else if (this.total() > 0) {
      this.exito.set(`Proceso TERMINADO: ${this.procesados()} legajos.`);
    }
  }

  private reiniciar(): void {
    this.cancel$ = new Subject<void>();
    this.running.set(true);
    this.cancelado.set(false);
    this.procesados.set(0);
    this.total.set(0);
    this.fallidos.set([]);
    this.depuracionPendiente.set(false);
    this.error.set(null);
    this.exito.set(null);
    this.estado.set('Iniciando proceso...');
  }

  /** Público: lo invoca el template al cambiar el período. */
  cargarEstadoDuplicar(): void {
    const { anho, mes } = this.periodo();
    this.estadoCargos.set('cargando');
    this.service.getCargosPeriodo(anho, mes).subscribe({
      next: (cargos) => {
        const hay = cargos.length > 0;
        this.hayCargos.set(hay);
        this.estadoCargos.set('ok');
        if (hay) {
          // Como el legacy: si el período ya tiene cargos no se puede duplicar.
          this.duplicar.set(false);
        }
      },
      error: (err: HttpErrorResponse) => {
        // Fail closed: sin poder verificar el período no se habilita duplicar.
        this.hayCargos.set(false);
        this.duplicar.set(false);
        this.estadoCargos.set('error');
        this.error.set(
          mensajeDeError(err, 'No se pudo verificar si el período ya tiene cargos cargados.')
        );
      }
    });
  }
}

function dividirEnLotes(legajos: number[], tamano: number): number[][] {
  const lotes: number[][] = [];
  for (let indice = 0; indice < legajos.length; indice += tamano) {
    lotes.push(legajos.slice(indice, indice + tamano));
  }
  return lotes;
}

function textoFase(tipo: Fase | 'desarraigo'): string {
  switch (tipo) {
    case 'duplicar':
      return 'Duplicando';
    case 'fusionar':
      return 'Fusionando';
    default:
      return 'Recalculando desarraigo';
  }
}

function periodoActual(): Periodo {
  const hoy = new Date();
  return { anho: hoy.getFullYear(), mes: hoy.getMonth() + 1 };
}
