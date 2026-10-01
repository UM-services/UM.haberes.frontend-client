import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DesignacionesService } from './designaciones.service';
import { AuthService, Persona } from '@haberes/shared-api';
import { PersonaSearchComponent } from '@haberes/ui-layout';

@Component({
  selector: 'haberes-designaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, PersonaSearchComponent],
  templateUrl: './designaciones.component.html'
})
export class DesignacionesComponent {
  private readonly service = inject(DesignacionesService);
  private readonly auth = inject(AuthService);

  anho = signal<number>(new Date().getFullYear());
  mes = signal<number>(new Date().getMonth() + 1);

  // Búsqueda de personas: buscador estándar del portal (ui-persona-search).
  personaSeleccionada = signal<Persona | null>(null);

  cursosCargo = signal<any[]>([]);
  cursosFusion = signal<any[]>([]);
  isLoading = signal<boolean>(false);

  facultadId = computed(() => {
    let fid = null;
    this.auth.currentUser$.subscribe(u => { if (u) fid = u.facultadId; }).unsubscribe();
    return fid;
  });

  onPersonaSeleccionada(persona: Persona | null) {
    this.personaSeleccionada.set(persona);
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
