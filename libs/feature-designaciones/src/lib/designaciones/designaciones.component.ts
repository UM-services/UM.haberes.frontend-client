import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DesignacionesService } from './designaciones.service';
import { AuthService } from '@haberes/shared-api';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of, tap, catchError } from 'rxjs';

@Component({
  selector: 'haberes-designaciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './designaciones.component.html'
})
export class DesignacionesComponent {
  private readonly service = inject(DesignacionesService);
  private readonly auth = inject(AuthService);

  anho = signal<number>(new Date().getFullYear());
  mes = signal<number>(new Date().getMonth() + 1);
  
  personaInput = signal<string>('');
  personaSeleccionada = signal<any | null>(null);
  resultadosBusqueda = signal<any[]>([]);
  isSearching = signal<boolean>(false);
  showDropdown = signal<boolean>(false);
  
  private searchSubject = new Subject<string>();

  cursosCargo = signal<any[]>([]);
  cursosFusion = signal<any[]>([]);
  isLoading = signal<boolean>(false);

  facultadId = computed(() => {
    let fid = null;
    this.auth.currentUser$.subscribe(u => { if (u) fid = u.facultadId; }).unsubscribe();
    return fid;
  });

  constructor() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => this.isSearching.set(true)),
      switchMap(rawTerm => {
        const term = rawTerm.trim();
        if (!term || term.length < 3) return of([]);
        if (!isNaN(Number(term))) {
           return this.service.getPersonaByLegajo(Number(term)).pipe(
               switchMap(p => of([p])),
               catchError(() => of([]))
           );
        }
        return this.service.searchPersonas(term).pipe(catchError(() => of([])));
      })
    ).subscribe(resultados => {
      this.resultadosBusqueda.set(resultados);
      this.isSearching.set(false);
      this.showDropdown.set(resultados.length > 0);
    });
  }

  onSearchInput(value: string) {
    this.personaInput.set(value);
    this.personaSeleccionada.set(null);
    this.cleanGrids();
    this.searchSubject.next(value);
  }

  seleccionarPersona(persona: any) {
    this.personaSeleccionada.set(persona);
    this.personaInput.set(persona.apellidoNombre || persona.apellido + ', ' + persona.nombre);
    this.showDropdown.set(false);
    this.cleanGrids();
  }

  cleanGrids() {
    this.cursosCargo.set([]);
    this.cursosFusion.set([]);
  }

  cambiarMes(incremento: number) {
    let m = this.mes() + incremento;
    let a = this.anho();
    if (m > 12) { m = 1; a++; }
    if (m < 1) { m = 12; a--; }
    this.mes.set(m);
    this.anho.set(a);
    this.cleanGrids();
  }

  revisar() {
    const persona = this.personaSeleccionada();
    const facId = this.facultadId();
    
    if (!persona) {
      alert("Seleccione un docente");
      return;
    }
    if (!facId) {
      alert("Error: No tiene facultad asignada");
      return;
    }

    this.isLoading.set(true);
    this.cleanGrids();

    this.service.getCursosCargo(persona.legajoId, this.anho(), this.mes(), facId).subscribe({
      next: (data) => this.cursosCargo.set(data),
      error: () => this.cursosCargo.set([])
    });

    this.service.getCursosFusion(persona.legajoId, this.anho(), this.mes(), facId).subscribe({
      next: (data) => this.cursosFusion.set(data),
      error: () => this.cursosFusion.set([])
    });
    
    setTimeout(() => this.isLoading.set(false), 500);
  }
}
