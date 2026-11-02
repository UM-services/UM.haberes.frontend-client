import { Component, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, concatMap, finalize, from, of, toArray } from 'rxjs';

import { mensajeDeError } from '@haberes/shared-api';

import { CargosClaseService } from './cargos-clase.service';
import {
  CargoClaseDetalle,
  Facultad,
  Periodo,
  moverMes,
  numeroDePeriodo,
  periodoTexto
} from './cargos-clase.models';

/**
 * Duplicación de los cargos con clase de un período a otro.
 *
 * Toma el detalle mensual de una facultad y, por cada fila marcada, crea un
 * cargo con clase en el rango destino. El servidor controla los períodos
 * acreditados y genera los detalles del nuevo rango.
 */
@Component({
  selector: 'haberes-cargos-clase-duplicar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, FormsModule],
  templateUrl: './cargos-clase-duplicar.component.html'
})
export class CargosClaseDuplicarComponent {
  private readonly service = inject(CargosClaseService);

  readonly facultades = signal<Facultad[]>([]);
  readonly facultadId = signal<number | null>(null);
  readonly periodoOrigen = signal<Periodo>(periodoActual());

  readonly detalles = signal<CargoClaseDetalle[]>([]);
  readonly seleccionados = signal<Set<number>>(new Set<number>());

  readonly desde = signal<Periodo>(periodoActual());
  readonly hasta = signal<Periodo>(periodoActual());

  readonly isLoading = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly procesados = signal<number>(0);
  readonly total = signal<number>(0);
  readonly error = signal<string | null>(null);
  readonly exito = signal<string | null>(null);

  readonly cantidadSeleccionada = computed<number>(() => this.seleccionados().size);
  readonly todosSeleccionados = computed<boolean>(
    () => this.detalles().length > 0 && this.seleccionados().size === this.detalles().length
  );

  constructor() {
    this.service
      .getFacultades()
      .pipe(catchError(() => of([] as Facultad[])))
      .subscribe((facultades) => this.facultades.set(facultades));
  }

  onFacultad(facultadId: number | null): void {
    this.facultadId.set(facultadId);
    this.detalles.set([]);
    this.seleccionados.set(new Set<number>());
    this.exito.set(null);
    this.error.set(null);
  }

  moverOrigen(incremento: number): void {
    this.periodoOrigen.set(moverMes(this.periodoOrigen(), incremento));
    this.detalles.set([]);
    this.seleccionados.set(new Set<number>());
  }

  moverDesde(incremento: number): void {
    this.desde.set(moverMes(this.desde(), incremento));
  }

  moverHasta(incremento: number): void {
    this.hasta.set(moverMes(this.hasta(), incremento));
  }

  revisar(): void {
    const facultadId = this.facultadId();
    if (!facultadId) {
      this.error.set('Seleccione una facultad.');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);
    this.exito.set(null);
    this.seleccionados.set(new Set<number>());
    const periodo = this.periodoOrigen();
    this.service
      .getDetalleByFacultad(facultadId, periodo.anho, periodo.mes)
      .pipe(
        catchError(() => {
          this.error.set('No se pudo cargar el detalle del período.');
          return of([] as CargoClaseDetalle[]);
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe((detalles) => this.detalles.set(detalles));
  }

  estaSeleccionado(detalle: CargoClaseDetalle): boolean {
    return this.seleccionados().has(detalle.cargoClaseDetalleId);
  }

  alternar(detalle: CargoClaseDetalle): void {
    const seleccionados = new Set(this.seleccionados());
    if (seleccionados.has(detalle.cargoClaseDetalleId)) {
      seleccionados.delete(detalle.cargoClaseDetalleId);
    } else {
      seleccionados.add(detalle.cargoClaseDetalleId);
    }
    this.seleccionados.set(seleccionados);
  }

  /** Invierte la selección de toda la grilla. */
  invertir(): void {
    const seleccionados = new Set<number>();
    for (const detalle of this.detalles()) {
      if (!this.seleccionados().has(detalle.cargoClaseDetalleId)) {
        seleccionados.add(detalle.cargoClaseDetalleId);
      }
    }
    this.seleccionados.set(seleccionados);
  }

  duplicar(): void {
    const seleccionados = this.detalles().filter((detalle) =>
      this.seleccionados().has(detalle.cargoClaseDetalleId)
    );
    if (seleccionados.length === 0) {
      this.error.set('Seleccione al menos un cargo para duplicar.');
      return;
    }
    if (numeroDePeriodo(this.hasta()) < numeroDePeriodo(this.desde())) {
      this.error.set('El período HASTA no puede ser anterior al período DESDE.');
      return;
    }

    const desde = periodoTexto(numeroDePeriodo(this.desde()));
    const hasta = periodoTexto(numeroDePeriodo(this.hasta()));
    const mensaje = `Se duplicarán ${seleccionados.length} cargos con clase del período ` +
      `${periodoTexto(numeroDePeriodo(this.periodoOrigen()))} al rango ${desde} - ${hasta}. ¿Continuar?`;
    if (!window.confirm(mensaje)) {
      return;
    }
    if (!window.confirm('¿Está realmente seguro? La operación no se puede deshacer.')) {
      return;
    }

    this.isSaving.set(true);
    this.error.set(null);
    this.exito.set(null);
    this.procesados.set(0);
    this.total.set(seleccionados.length);

    from(seleccionados)
      .pipe(
        concatMap((detalle) =>
          this.service
            .addPeriodo({
              legajoId: detalle.legajoId,
              cargoClaseId: detalle.cargoClaseId,
              dependenciaId: detalle.dependenciaId,
              facultadId: detalle.facultadId,
              geograficaId: detalle.geograficaId,
              periodoDesde: numeroDePeriodo(this.desde()),
              periodoHasta: numeroDePeriodo(this.hasta()),
              horas: detalle.horas,
              aplicaAdicional: detalle.aplicaAdicional,
              descripcion: detalle.cargoClasePeriodo?.descripcion ?? ''
            })
            .pipe(
              catchError(() => of('ERROR: no se pudo duplicar el cargo')),
              finalize(() => this.procesados.update((valor) => valor + 1))
            )
        ),
        toArray(),
        finalize(() => this.isSaving.set(false))
      )
      .subscribe({
        next: (resultados) => {
          const fallidos = resultados.filter((mensaje) => mensaje.trim().toLowerCase() !== 'ok');
          if (fallidos.length === 0) {
            this.exito.set(`Proceso terminado: ${resultados.length} cargos duplicados.`);
          } else {
            this.error.set(
              `Proceso terminado con ${fallidos.length} error(es): ${fallidos[0]}`
            );
          }
          this.seleccionados.set(new Set<number>());
        },
        error: (err: HttpErrorResponse) =>
          this.error.set(mensajeDeError(err, 'No se pudo completar la duplicación.'))
      });
  }

  periodoLegible(valor: number | null | undefined): string {
    return periodoTexto(valor);
  }

  etiquetaCargo(detalle: CargoClaseDetalle): string {
    const cargo = detalle.cargoClase;
    if (!cargo) {
      return '';
    }
    return cargo.clase?.nombre ? `${cargo.nombre} - ${cargo.clase.nombre}` : cargo.nombre;
  }
}

function periodoActual(): Periodo {
  const hoy = new Date();
  return { anho: hoy.getFullYear(), mes: hoy.getMonth() + 1 };
}
