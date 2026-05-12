import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of, tap, catchError } from 'rxjs';

import { AuthService } from '@haberes/shared-api';
// Reusing the search logic from Designaciones (they expose searchPersonas)
import { DesignacionesService } from '@haberes/feature-designaciones';
import { CargosReportService } from './cargos-report.service';

@Component({
  selector: 'haberes-cargos-legajo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cargos-legajo.component.html'
})
export class CargosLegajoComponent {
  private readonly auth = inject(AuthService);
  private readonly searchService = inject(DesignacionesService);
  private readonly reportService = inject(CargosReportService);

  anho = signal<number>(new Date().getFullYear());
  mes = signal<number>(new Date().getMonth() + 1);
  
  personaInput = signal<string>('');
  personaSeleccionada = signal<any | null>(null);
  resultadosBusqueda = signal<any[]>([]);
  isSearching = signal<boolean>(false);
  showDropdown = signal<boolean>(false);
  isDownloading = signal<boolean>(false);
  
  private searchSubject = new Subject<string>();

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
           return this.searchService.getPersonaByLegajo(Number(term)).pipe(
               switchMap(p => of([p])),
               catchError(() => of([]))
           );
        }
        return this.searchService.searchPersonas(term).pipe(catchError(() => of([])));
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
    this.searchSubject.next(value);
  }

  seleccionarPersona(p: any) {
    this.personaSeleccionada.set(p);
    this.personaInput.set(p.apellidoNombre || `${p.apellido}, ${p.nombre}`);
    this.showDropdown.set(false);
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
