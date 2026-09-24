import { Component, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Subject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  of,
  switchMap,
  tap
} from 'rxjs';

import { ContabilidadService } from './contabilidad.service';
import { ImputacionIndividualResponse, PersonaImputacion } from './imputacion.models';

@Component({
  selector: 'haberes-imputacion-individual',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe],
  templateUrl: './imputacion-individual.component.html'
})
export class ImputacionIndividualComponent {
  private readonly contabilidadService = inject(ContabilidadService);
  private readonly searchSubject = new Subject<string>();

  anho = signal<number>(new Date().getFullYear());
  mes = signal<number>(new Date().getMonth() + 1);

  personaInput = signal<string>('');
  documentoInput = signal<string>('');
  legajoInput = signal<string>('');
  personaSeleccionada = signal<PersonaImputacion | null>(null);

  resultadosBusqueda = signal<PersonaImputacion[]>([]);
  isSearching = signal<boolean>(false);
  showDropdown = signal<boolean>(false);

  isLoading = signal<boolean>(false);
  isGenerating = signal<boolean>(false);
  error = signal<string | null>(null);
  exito = signal<string | null>(null);

  imputacionData = signal<ImputacionIndividualResponse | null>(null);

  constructor() {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => this.isSearching.set(true)),
        switchMap((rawTerm) => {
          const term = rawTerm.trim();
          if (!term || term.length < 3) {
            return of([] as PersonaImputacion[]);
          }
          if (!isNaN(Number(term))) {
            return this.contabilidadService
              .getPersonaByLegajo(Number(term))
              .pipe(map((persona) => (persona ? [persona] : [])));
          }
          return this.contabilidadService
            .searchPersonas(term)
            .pipe(map((lista) => (Array.isArray(lista) ? lista : [])));
        }),
        catchError(() => of([] as PersonaImputacion[]))
      )
      .subscribe((resultados) => {
        this.resultadosBusqueda.set(resultados);
        this.isSearching.set(false);
        this.showDropdown.set(resultados.length > 0);
      });
  }

  onSearchInput(value: string): void {
    this.personaInput.set(value);
    this.searchSubject.next(value);
  }

  seleccionarPersona(persona: PersonaImputacion): void {
    this.personaSeleccionada.set(persona);
    this.personaInput.set(this.obtenerNombreCompleto(persona));
    this.legajoInput.set(String(persona.legajoId));
    this.documentoInput.set(persona.documento ? String(persona.documento) : '');
    this.showDropdown.set(false);
    this.imputacionData.set(null);
    this.error.set(null);
    this.exito.set(null);
  }

  buscarPorLegajo(): void {
    const legajoId = Number(this.legajoInput().trim());
    if (!legajoId || isNaN(legajoId)) return;
    this.isLoading.set(true);
    this.contabilidadService.getPersonaByLegajo(legajoId).subscribe({
      next: (persona) => {
        this.isLoading.set(false);
        if (persona && persona.legajoId) {
          this.seleccionarPersona(persona);
        } else {
          this.error.set(`No se encontró personal con legajo ${legajoId}`);
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.error.set(`No se encontró personal con legajo ${legajoId}`);
      }
    });
  }

  buscarPorDocumento(): void {
    const doc = Number(this.documentoInput().trim());
    if (!doc || isNaN(doc)) return;
    this.isLoading.set(true);
    this.contabilidadService.getPersonaByDocumento(doc).subscribe({
      next: (persona) => {
        this.isLoading.set(false);
        if (persona && persona.legajoId) {
          this.seleccionarPersona(persona);
        } else {
          this.error.set(`No se encontró personal con documento ${doc}`);
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.error.set(`No se encontró personal con documento ${doc}`);
      }
    });
  }

  cambiarMes(delta: number): void {
    let nuevoMes = this.mes() + delta;
    let nuevoAnho = this.anho();

    if (nuevoMes < 1) {
      nuevoMes = 12;
      nuevoAnho -= 1;
    } else if (nuevoMes > 12) {
      nuevoMes = 1;
      nuevoAnho += 1;
    }

    this.mes.set(nuevoMes);
    this.anho.set(nuevoAnho);
    this.imputacionData.set(null);
    this.error.set(null);
    this.exito.set(null);
  }

  revisar(preservarExito = false): void {
    const persona = this.personaSeleccionada();
    if (!persona) {
      this.error.set('Debe seleccionar un empleado para consultar la imputación.');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);
    if (!preservarExito) {
      this.exito.set(null);
    }

    this.contabilidadService
      .getImputacionIndividual(persona.legajoId, this.anho(), this.mes())
      .subscribe({
        next: (data) => {
          this.imputacionData.set(data);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.error.set(err?.error?.message || 'Error al obtener la imputación contable.');
        }
      });
  }

  generar(): void {
    const persona = this.personaSeleccionada();
    if (!persona) {
      this.error.set('Debe seleccionar un empleado para generar la imputación.');
      return;
    }

    this.isGenerating.set(true);
    this.error.set(null);
    this.exito.set(null);

    this.contabilidadService
      .generarImputacionLegajo(persona.legajoId, this.anho(), this.mes())
      .subscribe({
        next: () => {
          this.isGenerating.set(false);
          this.exito.set('Imputación contable generada exitosamente.');
          this.revisar(true);
        },
        error: (err) => {
          this.isGenerating.set(false);
          this.error.set(err?.error?.message || 'ERROR: No pudo generarse la imputación contable.');
        }
      });
  }

  obtenerNombreCompleto(persona: PersonaImputacion): string {
    if (persona.apellidoNombre) return persona.apellidoNombre;
    const ape = persona.apellido ?? '';
    const nom = persona.nombre ?? '';
    return [ape, nom].filter(Boolean).join(', ');
  }
}
