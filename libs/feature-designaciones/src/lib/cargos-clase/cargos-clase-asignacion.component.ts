import { Component, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, finalize, forkJoin, of } from 'rxjs';

import { Persona, mensajeDeError } from '@haberes/shared-api';
import { PersonaSearchComponent } from '@haberes/ui-layout';

import { CargosClaseService } from './cargos-clase.service';
import {
  Antiguedad,
  CargoClase,
  CargoClasePeriodo,
  Dependencia,
  Facultad,
  Geografica,
  Periodo,
  mesesATexto,
  moverMes,
  numeroDePeriodo,
  periodoDeNumero,
  periodoTexto
} from './cargos-clase.models';

/**
 * Asignación de cargos con clase de un docente: alta, baja y cambio de período
 * hasta. El servidor controla los períodos acreditados y genera los detalles
 * mensuales del cargo.
 */
@Component({
  selector: 'haberes-cargos-clase-asignacion',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, FormsModule, PersonaSearchComponent],
  templateUrl: './cargos-clase-asignacion.component.html'
})
export class CargosClaseAsignacionComponent {
  private readonly service = inject(CargosClaseService);

  readonly persona = signal<Persona | null>(null);
  readonly periodoConsulta = signal<Periodo>(periodoActual());

  readonly facultades = signal<Facultad[]>([]);
  readonly geograficas = signal<Geografica[]>([]);
  readonly dependencias = signal<Dependencia[]>([]);
  readonly cargosClase = signal<CargoClase[]>([]);

  readonly periodos = signal<CargoClasePeriodo[]>([]);
  readonly seleccionado = signal<CargoClasePeriodo | null>(null);
  readonly indices = signal<number[]>([]);
  readonly antiguedad = signal<Antiguedad | null>(null);

  // Formulario
  readonly facultadId = signal<number | null>(null);
  readonly geograficaId = signal<number | null>(null);
  readonly dependenciaId = signal<number | null>(null);
  readonly cargoClaseId = signal<number | null>(null);
  readonly horas = signal<number | null>(null);
  readonly aplicaAdicional = signal<boolean>(false);
  readonly descripcion = signal<string>('');
  readonly desde = signal<Periodo>(periodoActual());
  readonly hasta = signal<Periodo>(periodoActual());

  readonly isLoading = signal<boolean>(false);
  readonly isLoadingAntiguedad = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly exito = signal<string | null>(null);

  readonly hayPersona = computed<boolean>(() => this.persona() !== null);
  readonly puedeOperar = computed<boolean>(
    () => this.hayPersona() && !this.isSaving() && !this.isLoading()
  );

  readonly antiguedadTexto = computed<string>(() => {
    const indices = this.indices();
    const antiguedad = this.antiguedad();
    const partes: string[] = [];
    if (indices.length >= 2) {
      partes.push(`Índices: ${indices[0]} / ${indices[1]}`);
    }
    if (antiguedad) {
      partes.push(
        `Antigüedad: ${mesesATexto(antiguedad.mesesDocentes)} / ${mesesATexto(antiguedad.mesesAdministrativos)}`
      );
    }
    return partes.join('  ·  ');
  });

  constructor() {
    forkJoin({
      facultades: this.service.getFacultades().pipe(catchError(() => of([]))),
      geograficas: this.service.getGeograficas().pipe(catchError(() => of([]))),
      cargosClase: this.service.getCargosClase().pipe(catchError(() => of([])))
    }).subscribe(({ facultades, geograficas, cargosClase }) => {
      this.facultades.set(facultades);
      this.geograficas.set(geograficas);
      this.cargosClase.set(cargosClase);
    });
  }

  onPersona(persona: Persona | null): void {
    this.persona.set(persona);
    this.seleccionado.set(null);
    this.error.set(null);
    this.exito.set(null);
    if (persona) {
      this.cargarPeriodos(persona.legajoId);
      this.cargarAntiguedad();
    } else {
      this.periodos.set([]);
      this.indices.set([]);
      this.antiguedad.set(null);
    }
  }

  cambiarMesConsulta(incremento: number): void {
    this.periodoConsulta.set(moverMes(this.periodoConsulta(), incremento));
    if (this.persona()) {
      this.cargarAntiguedad();
    }
  }

  onFacultad(facultadId: number | null): void {
    this.facultadId.set(facultadId);
    this.dependenciaId.set(null);
    this.cargarDependencias();
  }

  onGeografica(geograficaId: number | null): void {
    this.geograficaId.set(geograficaId);
    this.dependenciaId.set(null);
    this.cargarDependencias();
  }

  /** Carga la fila elegida en el formulario (equivalente a fillDetalle del legacy). */
  seleccionarPeriodo(periodo: CargoClasePeriodo): void {
    this.seleccionado.set(periodo);
    const desde = periodoDeNumero(periodo.periodoDesde);
    const hasta = periodoDeNumero(periodo.periodoHasta);
    this.facultadId.set(periodo.facultadId);
    this.geograficaId.set(periodo.geograficaId);
    this.dependenciaId.set(periodo.dependenciaId);
    this.cargoClaseId.set(periodo.cargoClaseId);
    this.horas.set(periodo.horas);
    this.aplicaAdicional.set(periodo.aplicaAdicional === 1);
    this.descripcion.set(periodo.descripcion ?? '');
    this.desde.set(desde);
    this.hasta.set(hasta);
    this.error.set(null);
    this.exito.set(null);
    this.cargarDependencias();
  }

  moverDesde(incremento: number): void {
    this.desde.set(moverMes(this.desde(), incremento));
  }

  moverHasta(incremento: number): void {
    this.hasta.set(moverMes(this.hasta(), incremento));
  }

  agregar(): void {
    const persona = this.persona();
    const cargoClaseId = this.cargoClaseId();
    const dependenciaId = this.dependenciaId();
    const facultadId = this.facultadId();
    const geograficaId = this.geograficaId();
    const horas = this.horas();

    if (!persona) {
      this.error.set('Seleccione un docente.');
      return;
    }
    if (!horas || horas <= 0) {
      this.error.set('Ingrese las horas del cargo.');
      return;
    }
    if (!facultadId || !geograficaId || !dependenciaId) {
      this.error.set('Falta Facultad, Sede o Dependencia.');
      return;
    }
    if (!cargoClaseId) {
      this.error.set('Falta el Cargo con Clase.');
      return;
    }
    const desde = numeroDePeriodo(this.desde());
    const hasta = numeroDePeriodo(this.hasta());
    if (hasta < desde) {
      this.error.set('El período HASTA no puede ser anterior al período DESDE.');
      return;
    }

    this.isSaving.set(true);
    this.error.set(null);
    this.exito.set(null);
    this.service
      .addPeriodo({
        legajoId: persona.legajoId,
        cargoClaseId,
        dependenciaId,
        facultadId,
        geograficaId,
        periodoDesde: desde,
        periodoHasta: hasta,
        horas,
        aplicaAdicional: this.aplicaAdicional() ? 1 : 0,
        descripcion: this.descripcion().trim()
      })
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (mensaje) => this.aplicarResultado(mensaje, 'Cargo con clase asignado.', persona.legajoId),
        error: (err: HttpErrorResponse) =>
          this.error.set(mensajeDeError(err, 'No se pudo asignar el cargo con clase.'))
      });
  }

  cambiarHasta(): void {
    const persona = this.persona();
    const periodo = this.seleccionado();
    if (!persona || !periodo) {
      this.error.set('Seleccione un cargo de la grilla.');
      return;
    }
    const hasta = this.hasta();
    if (!window.confirm(`¿Cambiar el período HASTA a ${periodoTexto(numeroDePeriodo(hasta))}?`)) {
      return;
    }

    this.isSaving.set(true);
    this.error.set(null);
    this.exito.set(null);
    this.service
      .changeHasta(periodo.cargoClasePeriodoId, hasta.anho, hasta.mes)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (mensaje) => this.aplicarResultado(mensaje, 'Período HASTA actualizado.', persona.legajoId),
        error: (err: HttpErrorResponse) =>
          this.error.set(mensajeDeError(err, 'No se pudo cambiar el período del cargo.'))
      });
  }

  eliminar(): void {
    const persona = this.persona();
    const periodo = this.seleccionado();
    if (!persona || !periodo) {
      this.error.set('Seleccione un cargo de la grilla.');
      return;
    }
    if (!window.confirm('Se eliminará el cargo con clase y todos sus períodos. ¿Continuar?')) {
      return;
    }

    this.isSaving.set(true);
    this.error.set(null);
    this.exito.set(null);
    this.service
      .deletePeriodo(periodo.cargoClasePeriodoId)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (mensaje) => this.aplicarResultado(mensaje, 'Cargo con clase eliminado.', persona.legajoId),
        error: (err: HttpErrorResponse) =>
          this.error.set(mensajeDeError(err, 'No se pudo eliminar el cargo con clase.'))
      });
  }

  etiquetaCargoClase(cargoClase: CargoClase | null | undefined): string {
    if (!cargoClase) {
      return '';
    }
    const clase = cargoClase.clase?.nombre;
    return clase ? `${cargoClase.nombre} - ${clase}` : cargoClase.nombre;
  }

  private aplicarResultado(mensaje: string, exito: string, legajoId: number): void {
    if (mensaje && mensaje.trim().toLowerCase() !== 'ok') {
      this.error.set(mensaje.trim());
      return;
    }
    this.exito.set(exito);
    this.cargarPeriodos(legajoId);
  }

  private cargarPeriodos(legajoId: number): void {
    this.isLoading.set(true);
    this.service
      .getPeriodosByLegajo(legajoId)
      .pipe(
        catchError(() => {
          this.error.set('No se pudieron cargar los cargos con clase del legajo.');
          return of([] as CargoClasePeriodo[]);
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe((periodos) => this.periodos.set(periodos));
  }

  periodoLegible(valor: number | null | undefined): string {
    return periodoTexto(valor);
  }

  /** Público: lo invoca el template al cambiar el período de consulta. */
  cargarAntiguedad(): void {
    const persona = this.persona();
    if (!persona) {
      return;
    }
    const periodo = this.periodoConsulta();
    this.isLoadingAntiguedad.set(true);
    forkJoin({
      indices: this.service
        .getIndicesAntiguedad(persona.legajoId, periodo.anho, periodo.mes)
        .pipe(catchError(() => of([] as number[]))),
      antiguedad: this.service
        .getAntiguedad(persona.legajoId, periodo.anho, periodo.mes)
        .pipe(catchError(() => of(null)))
    })
      .pipe(finalize(() => this.isLoadingAntiguedad.set(false)))
      .subscribe(({ indices, antiguedad }) => {
        this.indices.set(indices ?? []);
        this.antiguedad.set(antiguedad);
      });
  }

  private cargarDependencias(): void {
    const facultadId = this.facultadId();
    const geograficaId = this.geograficaId();
    if (!facultadId || !geograficaId) {
      this.dependencias.set([]);
      return;
    }
    this.service
      .getDependencias(facultadId, geograficaId)
      .pipe(catchError(() => of([] as Dependencia[])))
      .subscribe((dependencias) => this.dependencias.set(dependencias));
  }
}

function periodoActual(): Periodo {
  const hoy = new Date();
  return { anho: hoy.getFullYear(), mes: hoy.getMonth() + 1 };
}
