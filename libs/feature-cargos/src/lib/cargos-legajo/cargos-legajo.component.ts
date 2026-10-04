import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AuthService, Persona } from '@haberes/shared-api';
import { PersonaSearchComponent } from '@haberes/ui-layout';
import { CargosReportService } from './cargos-report.service';

@Component({
  selector: 'haberes-cargos-legajo',
  standalone: true,
  imports: [CommonModule, FormsModule, PersonaSearchComponent],
  templateUrl: './cargos-legajo.component.html'
})
export class CargosLegajoComponent {
  private readonly auth = inject(AuthService);
  private readonly reportService = inject(CargosReportService);

  anho = signal<number>(new Date().getFullYear());
  mes = signal<number>(new Date().getMonth() + 1);

  // Buscador de personas: buscador estándar del portal (ui-persona-search).
  personaSeleccionada = signal<Persona | null>(null);
  isDownloading = signal<boolean>(false);

  facultadId = computed(() => {
    let fid = null;
    this.auth.currentUser$.subscribe(u => { if (u) fid = u.facultadId; }).unsubscribe();
    return fid;
  });

  onPersonaSeleccionada(persona: Persona | null) {
    this.personaSeleccionada.set(persona);
  }

  cambiarMes(incremento: number) {
    let m = this.mes() + incremento;
    let a = this.anho();
    if (m > 12) { m = 1; a++; }
    if (m < 1) { m = 12; a--; }
    this.mes.set(m);
    this.anho.set(a);
  }

  descargar() {
    const persona = this.personaSeleccionada();
    const facId = this.facultadId();

    if (!persona) {
      alert("Seleccione un docente");
      return;
    }
    if (!facId) {
      alert("Error de sesión: No tiene facultad asignada");
      return;
    }

    this.isDownloading.set(true);

    this.reportService.downloadCargosReport(persona.legajoId, this.anho(), this.mes(), facId)
      .subscribe({
        next: (blob) => {
          const downloadUrl = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = `Cargos_${persona.legajoId}_${this.anho()}_${this.mes()}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(downloadUrl);
          a.remove();
          this.isDownloading.set(false);
        },
        error: (err) => {
          console.error(err);
          alert('No se pudo generar el reporte o no hay datos para el período.');
          this.isDownloading.set(false);
        }
      });
  }
}
