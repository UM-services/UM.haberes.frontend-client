import { Component, computed, inject, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, catchError, debounceTime, distinctUntilChanged, forkJoin, of, switchMap, tap } from 'rxjs';

import { AsignacionCursosService, FacultadResumen } from '../asig-cursos/asig-cursos.service';

/**
 * Consulta de cursos por facultad y sede.
 *
 * Es el alcance real del formulario legacy "Asignación de Materias": lista los
 * cursos que coinciden con el filtro, sin asignar nada.
 */
@Component({
  selector: 'haberes-cursos-consulta',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, FormsModule],
  templateUrl: './cursos-consulta.component.html'
})
export class CursosConsultaComponent implements OnInit {
  private readonly service = inject(AsignacionCursosService);
  private readonly filtro$ = new Subject<string>();

  readonly facultades = signal<FacultadResumen[]>([]);
  readonly sedes = signal<any[]>([]);
  readonly facultadId = signal<number | null>(null);
  readonly geograficaId = signal<number | null>(null);
  readonly filtro = signal<string>('');

  readonly cursos = signal<any[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  readonly hayFiltros = computed<boolean>(() => this.facultadId() !== null && this.geograficaId() !== null);

  constructor() {
    this.filtro$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => this.isLoading.set(true)),
        switchMap((texto) => {
          const facultadId = this.facultadId();
          const geograficaId = this.geograficaId();
          if (!facultadId || !geograficaId) {
            return of([]);
          }
          return this.service
            .getCursosFiltrados(facultadId, geograficaId, texto)
            .pipe(catchError(() => of([])));
        })
      )
      .subscribe((cursos) => {
        this.cursos.set(cursos);
        this.isLoading.set(false);
      });
  }

  ngOnInit(): void {
    forkJoin({
      facultades: this.service.getFacultades().pipe(catchError(() => of([]))),
      sedes: this.service.getSedes().pipe(catchError(() => of([])))
    }).subscribe(({ facultades, sedes }) => {
      this.facultades.set(facultades);
      this.sedes.set(sedes);
    });
  }

  onFacultad(facultadId: number | null): void {
    this.facultadId.set(facultadId);
    this.buscar();
  }

  onSede(geograficaId: number | null): void {
    this.geograficaId.set(geograficaId);
    this.buscar();
  }

  onFiltro(texto: string): void {
    this.filtro.set(texto);
    this.buscar();
  }

  buscar(): void {
    this.error.set(null);
    if (!this.hayFiltros()) {
      this.cursos.set([]);
      this.isLoading.set(false);
      return;
    }
    this.filtro$.next(this.filtro());
  }

  nombreFacultad(curso: any): string {
    return this.facultades().find((facultad) => facultad.facultadId === curso?.facultadId)?.nombre ?? '';
  }

  nombreSede(curso: any): string {
    return this.sedes().find((sede) => sede.geograficaId === curso?.geograficaId)?.nombre ?? '';
  }

  resultadoTexto(): string {
    if (!this.hayFiltros()) {
      return 'Seleccione facultad y sede para consultar.';
    }
    return `${this.cursos().length} curso(s) encontrados`;
  }
}
