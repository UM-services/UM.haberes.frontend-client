import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@haberes/shared-api';
import { CargosReportService } from '../cargos-legajo/cargos-report.service';

@Component({
  selector: 'haberes-docentes-sede',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './docentes-sede.component.html'
})
export class DocentesSedeComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly reportService = inject(CargosReportService);

  anho = signal<number>(new Date().getFullYear());
  mes = signal<number>(new Date().getMonth() + 1);
  
  sedes = signal<any[]>([]);
  sedeSeleccionada = signal<number | null>(null);
  
  isDownloading = signal<boolean>(false);
  isLoadingSedes = signal<boolean>(true);

  facultadId = computed(() => {
    let fid = null;
    this.auth.currentUser$.subscribe(u => { if (u) fid = u.facultadId; }).unsubscribe();
    return fid;
  });

  ngOnInit() {
    this.reportService.getGeograficas().subscribe({
      next: (data) => {
        this.sedes.set(data);
        this.isLoadingSedes.set(false);
      },
      error: () => {
        this.isLoadingSedes.set(false);
      }
    });
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
    const sedeId = this.sedeSeleccionada();
    const facId = this.facultadId();
    
    if (!sedeId) {
      alert("Seleccione una Sede");
      return;
    }
    if (!facId) {
      alert("Error de sesión: No tiene facultad asignada");
      return;
    }

    this.isDownloading.set(true);

    this.reportService.downloadDocentesSedeReport(facId, sedeId, this.anho(), this.mes())
      .subscribe({
        next: (blob) => {
          const downloadUrl = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = `DocentesSede_${facId}_${sedeId}_${this.anho()}_${this.mes()}.pdf`;
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
