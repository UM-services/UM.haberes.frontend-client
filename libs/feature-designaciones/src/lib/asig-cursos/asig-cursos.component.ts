import { Component, inject, signal, computed, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AsignacionCursosService } from './asig-cursos.service';
import { DesignacionesService } from '../designaciones/designaciones.service';
import { AuthService } from '@haberes/shared-api';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of, tap, catchError, forkJoin } from 'rxjs';

@Component({
  selector: 'haberes-asig-cursos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './asig-cursos.component.html'
})
export class AsigCursosComponent implements OnInit {
  private readonly service = inject(AsignacionCursosService);
  private readonly desigService = inject(DesignacionesService);
  private readonly auth = inject(AuthService);

  anho = signal<number>(new Date().getFullYear());
  mes = signal<number>(new Date().getMonth() + 1);
  
  // Combos
  sedes = signal<any[]>([]);
  sedeSeleccionada = signal<number | null>(null);
  cargosTipo = signal<any[]>([]);
  cargoAltaSeleccionado = signal<number | null>(null);

  // Filtro
  filtroCurso = signal<string>('');
  private filtroCursoSubject = new Subject<string>();
  cursos = signal<any[]>([]);
  cursoSeleccionado = signal<any | null>(null);

  // Buscador Docente
  personaInput = signal<string>('');
  personaSeleccionada = signal<any | null>(null);
  resultadosBusqueda = signal<any[]>([]);
  isSearching = signal<boolean>(false);
  showDropdown = signal<boolean>(false);
  private searchSubject = new Subject<string>();

  // Grillas
  cargosActuales = signal<any[]>([]); // Combines titulares and contratados
  cargoSeleccionado = signal<any | null>(null); // Fila seleccionada en la grilla central
  
  cargosAlta = signal<any[]>([]);
  cargosBaja = signal<any[]>([]);
  
  // Formularios
  horasSemanales = signal<number | null>(null);
  desarraigo = signal<boolean>(false);
  observacionesAlta = signal<string>('');
  observacionesBaja = signal<string>('');

  // Estados
  canModify = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  isPrinting = signal<boolean>(false);

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
      if (this.sedeSeleccionada() !== null) {
         this.filtroCursoSubject.next(this.filtroCurso());
      }
    }, { allowSignalWrites: true });

    // Server-side debounced course filtering
    this.filtroCursoSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => this.isLoading.set(true)),
      switchMap(text => {
        const fid = this.facultadId();
        const sid = this.sedeSeleccionada();
        if (!fid || !sid) return of([]);
        return this.service.getCursosFiltrados(fid, sid, text).pipe(catchError(() => of([])));
      })
    ).subscribe(data => {
      this.cursos.set(data);
      this.isLoading.set(false);
    });
  }

  ngOnInit() {
    this.service.getSedes().subscribe(data => this.sedes.set(data));
    this.service.getCargosTipos().subscribe(data => this.cargosTipo.set(data));
  }

  checkAcreditacion() {
    this.service.getAcreditacion(this.anho(), this.mes()).subscribe({
      next: (acr) => {
        const today = new Date();
        const limite = acr.limiteNovedades ? new Date(acr.limiteNovedades) : null;
        const isExpired = limite ? today > limite : false;
        this.canModify.set(acr.acreditado !== 1 && !isExpired);
      },
      error: () => this.canModify.set(true)
    });
  }

  cambiarMes(inc: number) {
    let m = this.mes() + inc;
    let a = this.anho();
    if (m > 12) { m = 1; a++; }
    if (m < 1) { m = 12; a--; }
    this.mes.set(m);
    this.anho.set(a);
    this.cursoSeleccionado.set(null);
    this.cleanGrids();
  }

  loadCursos() {
    this.filtroCursoSubject.next(this.filtroCurso());
  }

  seleccionarCurso(curso: any) {
    this.cursoSeleccionado.set(curso);
    this.cargoSeleccionado.set(null);
    this.personaInput.set('');
    this.personaSeleccionada.set(null);
    this.horasSemanales.set(null);
    this.cargoAltaSeleccionado.set(null);
    this.desarraigo.set(false);
    this.observacionesAlta.set('');
    this.observacionesBaja.set('');
    this.loadGrids();
  }

  loadGrids() {
    const cursoId = this.cursoSeleccionado()?.cursoId;
    if (!cursoId) return;

    // Load current roster (titulares + contratados)
    forkJoin({
      titulares: this.service.getCargosTitulares(cursoId, this.anho(), this.mes()).pipe(catchError(() => of([]))),
      contratados: this.service.getCargosContratados(cursoId, this.anho(), this.mes()).pipe(catchError(() => of([])))
    }).subscribe(({ titulares, contratados }) => {
       const mappedTitulares = titulares.map(t => ({ ...t, isContratado: false }));
       const mappedContratados = contratados.map(c => ({ 
           ...c, 
           isContratado: true,
           persona: { apellidoNombre: c.contratadoPersona?.apellido + ', ' + c.contratadoPersona?.nombre },
           cargoTipo: { nombre: 'Contratado (Consulte ID)' } // VB6 does a map to cargoTipos via collection
       }));
       this.cargosActuales.set([...mappedTitulares, ...mappedContratados]);
    });

    this.service.getCargosAlta(cursoId, this.anho(), this.mes()).subscribe(data => this.cargosAlta.set(data));
    this.service.getCargosBaja(cursoId, this.anho(), this.mes()).subscribe(data => this.cargosBaja.set(data));
  }

  cleanGrids() {
    this.cargosActuales.set([]);
    this.cargosAlta.set([]);
    this.cargosBaja.set([]);
  }

  // Búsqueda de personas
  onSearchInput(value: string) {
    this.personaInput.set(value);
    this.personaSeleccionada.set(null);
    this.searchSubject.next(value);
  }

  seleccionarPersona(p: any) {
    this.personaSeleccionada.set(p);
    this.personaInput.set(p.apellidoNombre || p.apellido + ', ' + p.nombre);
    this.showDropdown.set(false);
  }

  // Interacción Grilla Central
  seleccionarCargoActual(cargo: any) {
    this.cargoSeleccionado.set(cargo);
    
    // Auto-fill left panel
    if (!cargo.isContratado) {
       this.cargoAltaSeleccionado.set(cargo.cargoTipoId);
       this.horasSemanales.set(cargo.horasSemanales);
       this.desarraigo.set(cargo.desarraigo === 1);
       if (cargo.persona) this.seleccionarPersona(cargo.persona);
    }
  }

  // LOGICA DE NEGOCIO (Alta / Cambio / Reemplazo) -> Botón "+" Izquierdo
  agregarCargoAlta() {
    const cursoId = this.cursoSeleccionado()?.cursoId;
    const p = this.personaSeleccionada();
    const cargoTipoId = this.cargoAltaSeleccionado();
    const obs = this.observacionesAlta().trim();
    const horas = this.horasSemanales();
    const desarr = this.desarraigo() ? 1 : 0;
    
    if (!cursoId || !p || !cargoTipoId || !obs || horas === null) {
      alert("Faltan datos en el panel de Alta/Modificación (Docente, Cargo, Horas u Observaciones)");
      return;
    }

    // Step 1: Verify if novelty already exists
    this.service.getNovedadPendienteByLegajo(p.legajoId, cursoId, this.anho(), this.mes()).subscribe(pendientes => {
      if (pendientes.length > 0) {
        alert("ERROR: Novedad EXISTENTE para este DOCENTE en este curso y período");
        return;
      }

      let isBaja = false;
      let isCambioDesarraigo = false;
      let isCambioHoras = false;

      // Check if person is already in the roster for this course
      const cargoActual = this.cargosActuales().find(c => c.legajoId === p.legajoId && !c.isContratado);

      if (cargoActual) {
        // Is it the same cargo role?
        if (cargoActual.cargoTipoId === cargoTipoId) {
           if (cargoActual.desarraigo !== desarr || cargoActual.horasSemanales !== horas) {
              if (cargoActual.desarraigo !== desarr) isCambioDesarraigo = true;
              if (cargoActual.horasSemanales !== horas) isCambioHoras = true;
           } else {
              alert("No hay modificaciones reales en horas o desarraigo.");
              return;
           }
        } else {
           isBaja = true; // Different role means drop the old one, add new one
        }
      }

      // Replicando el payload exacto de makeParams de clsMODCursoCargoNovedad.cls
      const basePayload = {
        cursoId: cursoId,
        anho: this.anho(),
        mes: this.mes(),
        legajoId: p.legajoId,
        horasSemanales: horas,
        horasTotales: 0,
        desarraigo: desarr,
        solicitud: obs,
        autorizado: 0,
        rechazado: 0,
        respuesta: null,
        transferido: 0
      };

      if (isCambioDesarraigo || isCambioHoras) {
        // CAMBIO
        this.service.addNovedad({ ...basePayload, cargoTipoId, alta: 0, baja: 0, cambio: 1 }).subscribe({ next: () => this.loadGrids(), error: (e) => console.error(e) });
      } else {
        // ALTA
        this.service.addNovedad({ ...basePayload, cargoTipoId, alta: 1, baja: 0, cambio: 0 }).subscribe({ next: () => this.loadGrids(), error: (e) => console.error(e) });
      }

      if (isBaja) {
        // BAJA AUTOMATICA DEL CARGO ANTERIOR
        this.service.addNovedad({ ...basePayload, cargoTipoId: cargoActual.cargoTipoId, horasSemanales: cargoActual.horasSemanales, desarraigo: cargoActual.desarraigo, alta: 0, cambio: 0, baja: 1 }).subscribe({ next: () => this.loadGrids(), error: (e) => console.error(e) });
      }
      
      this.observacionesAlta.set('');
    });
  }

  // LOGICA DE NEGOCIO (Baja manual) -> Botón "+" Derecho
  agregarCargoBaja() {
    const cargo = this.cargoSeleccionado();
    const obs = this.observacionesBaja().trim();

    if (!cargo || cargo.isContratado) {
       alert("Seleccione un cargo titular válido en la grilla central");
       return;
    }
    if (!obs) {
       alert("ERROR: Faltan OBSERVACIONES");
       return;
    }

    // Verify if novelty already exists
    this.service.getNovedadPendienteByLegajo(cargo.legajoId, cargo.cursoId, this.anho(), this.mes()).subscribe(pendientes => {
      if (pendientes.length > 0) {
        alert("ERROR: Novedad EXISTENTE para este DOCENTE");
        return;
      }

      const payload = {
        cursoId: cargo.cursoId,
        anho: this.anho(),
        mes: this.mes(),
        legajoId: cargo.legajoId,
        cargoTipoId: cargo.cargoTipoId,
        horasSemanales: cargo.horasSemanales,
        horasTotales: 0,
        desarraigo: cargo.desarraigo,
        alta: 0,
        cambio: 0,
        baja: 1,
        solicitud: obs,
        facultadId: this.facultadId(),
        visado: 0, autorizado: 0, rechazado: 0, rectorado: 0, transferido: 0
      };

      this.service.addNovedad(payload).subscribe(() => {
         this.observacionesBaja.set('');
         this.loadGrids();
      });
    });
  }

  eliminarNovedad(novedad: any) {
    if (!confirm('¿Seguro que desea eliminar esta solicitud pendiente?')) return;
    // The VB6 code loops through collectionPendientesByLegajo and deletes them all for that legajo/curso
    this.service.deleteNovedadPendiente(novedad.legajoId, novedad.cursoId, this.anho(), this.mes()).subscribe(() => {
       this.loadGrids();
    });
  }

  imprimir() {
    const fid = this.facultadId();
    if (!fid) return;
    
    this.isPrinting.set(true);
    this.service.downloadReport(fid, this.anho(), this.mes()).subscribe({
       next: (blob) => {
         const downloadUrl = window.URL.createObjectURL(blob);
         const a = document.createElement('a');
         a.href = downloadUrl;
         a.download = `NovedadesDocentes_${fid}_${this.anho()}_${this.mes()}.pdf`;
         document.body.appendChild(a);
         a.click();
         window.URL.revokeObjectURL(downloadUrl);
         a.remove();
         this.isPrinting.set(false);
       },
       error: () => {
         alert('Error al generar el reporte');
         this.isPrinting.set(false);
       }
    });
  }
}
