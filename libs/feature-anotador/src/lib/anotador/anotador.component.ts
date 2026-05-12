import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnotadorService } from './anotador.service';
import { AuthService } from '@haberes/shared-api';
import { DesignacionesService } from '@haberes/feature-designaciones';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of, tap, catchError } from 'rxjs';

@Component({
  selector: 'haberes-anotador',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './anotador.component.html'
})
export class AnotadorComponent {
  private readonly service = inject(AnotadorService);
  private readonly desigService = inject(DesignacionesService);
  private readonly auth = inject(AuthService);

  anho = signal<number>(new Date().getFullYear());
  mes = signal<number>(new Date().getMonth() + 1);
  
  pendientes = signal<any[]>([]);
  revisados = signal<any[]>([]);
  activeTab = signal<'pendientes' | 'revisados'>('pendientes');
  isLoadingList = signal<boolean>(false);

  personaSeleccionada = signal<any | null>(null);
  historial = signal<any[]>([]);
  isLoadingHistory = signal<boolean>(false);

  nuevaAnotacion = signal<string>('');
  canAdd = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);

  personaInput = signal<string>('');
  resultadosBusqueda = signal<any[]>([]);
  isSearching = signal<boolean>(false);
  showDropdown = signal<boolean>(false);
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
           return this.desigService.getPersonaByLegajo(Number(term)).pipe(
               switchMap(p => of([p])),
               catchError(() => of([]))
           );
        }
        return this.desigService.searchPersonas(term).pipe(catchError(() => of([])));
      })
    ).subscribe(resultados => {
      this.resultadosBusqueda.set(resultados);
      this.isSearching.set(false);
      this.showDropdown.set(resultados.length > 0);
    });

    effect(() => {
      this.checkAcreditacion();
      this.revisar();
    }, { allowSignalWrites: true });
  }

  checkAcreditacion() {
    this.service.getAcreditacion(this.anho(), this.mes()).subscribe({
      next: (acr) => {
        const today = new Date();
        const limite = acr.limiteNovedades ? new Date(acr.limiteNovedades) : null;
        // Si no hay limite (null), nunca expira. Si hay, verificamos que no se haya pasado.
        const isExpired = limite ? today > limite : false;
        this.canAdd.set(acr.acreditado !== 1 && !isExpired);
      },
      error: () => {
        // En VB6, si no existe el periodo (400 Bad Request), el sistema permite seguir agregando 
        // porque la validacion de "limite" falla al ser nulo.
        this.canAdd.set(true);
      }
    });
  }

  onSearchInput(value: string) {
    this.personaInput.set(value);
    this.searchSubject.next(value);
  }

  seleccionarPersona(p: any) {
    this.personaSeleccionada.set(p);
    this.personaInput.set(p.apellidoNombre || `${p.apellido}, ${p.nombre}`);
    this.showDropdown.set(false);
    this.loadHistorial(p.legajoId);
  }

  revisar() {
    const fid = this.facultadId();
    if (!fid) return;

    this.isLoadingList.set(true);
    this.service.getPendientes(fid, this.anho(), this.mes()).subscribe({
      next: (data) => {
        this.pendientes.set(data);
        this.isLoadingList.set(false);
      },
      error: () => {
        this.pendientes.set([]);
        this.isLoadingList.set(false);
      }
    });

    this.service.getRevisados(fid, this.anho(), this.mes()).subscribe({
      next: (data) => this.revisados.set(data),
      error: () => this.revisados.set([])
    });
  }

  loadHistorial(legajoId: number) {
    this.isLoadingHistory.set(true);
    const fid = this.facultadId();
    
    this.service.getHistorial(legajoId).subscribe({
      next: (data) => {
        this.historial.set(data.filter(h => h.facultadId === fid));
        this.isLoadingHistory.set(false);
      },
      error: () => {
        this.historial.set([]);
        this.isLoadingHistory.set(false);
      }
    });
  }

  cambiarMes(inc: number) {
    let m = this.mes() + inc;
    let a = this.anho();
    if (m > 12) { m = 1; a++; }
    if (m < 1) { m = 12; a--; }
    this.mes.set(m);
    this.anho.set(a);
  }

  agregarAnotacion() {
    const p = this.personaSeleccionada();
    const fid = this.facultadId();
    const txt = this.nuevaAnotacion().trim();
    
    if (!p || !fid || !txt) return;

    this.isSubmitting.set(true);

    this.auth.currentUser$.subscribe(user => {
      // Replicando el payload exacto de makeParams de clsMODAnotador.cls
      const payload = {
        legajoId: p.legajoId,
        anho: this.anho(),
        mes: this.mes(),
        facultadId: fid,
        anotacion: txt,
        visado: 0,
        ipVisado: null,
        user: user?.apellidoNombre || user?.nombre || 'Web User',
        respuesta: null,
        autorizado: 0,
        rechazado: 0,
        rectorado: 0,
        transferido: 0
      };

      this.service.addAnotacion(payload).subscribe({
        next: () => {
          this.nuevaAnotacion.set('');
          this.loadHistorial(p.legajoId);
          this.revisar();
          this.isSubmitting.set(false);
        },
        error: () => {
          alert('Error al guardar la anotación');
          this.isSubmitting.set(false);
        }
      });
    }).unsubscribe();
  }

  cambiarTab(tab: 'pendientes' | 'revisados') {
    this.activeTab.set(tab);
  }
}
