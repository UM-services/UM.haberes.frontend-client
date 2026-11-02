import { Component, inject, signal, computed, effect, OnInit, ViewChild, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AsignacionCursosService, CargoPayload, CursoPayload, CursoResumen, FacultadResumen, NivelResumen } from './asig-cursos.service';
import { AuthService, Persona, mensajeDeError } from '@haberes/shared-api';
import { PersonaSearchComponent } from '@haberes/ui-layout';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of, tap, catchError, forkJoin, finalize } from 'rxjs';

@Component({
  selector: 'haberes-asig-cursos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, FormsModule, PersonaSearchComponent],
  templateUrl: './asig-cursos.component.html'
})
export class AsigCursosComponent implements OnInit {
  private readonly service = inject(AsignacionCursosService);
  private readonly auth = inject(AuthService);

  /**
   * Facultad explícita. Sin valor se usa la de la sesión; si tampoco hay, la
   * pantalla trabaja en modo global (módulo Liquidación) con selector de facultad
   * y alta/edición/baja de cursos.
   */
  readonly facultadId = input<number | null>(null);
  readonly facultadEfectiva = computed<number | null>(() => this.facultadId() ?? this.auth.facultadId());
  readonly esGlobal = computed<boolean>(() => this.facultadEfectiva() === null);

  facultades = signal<FacultadResumen[]>([]);
  niveles = signal<NivelResumen[]>([]);
  facultadSeleccionada = signal<number | null>(null);

  /** Facultad con la que se consultan los cursos: la de sesión o la elegida. */
  readonly facultadActiva = computed<number | null>(() => this.facultadEfectiva() ?? this.facultadSeleccionada());

  // Formulario de curso (sólo módulo global)
  cursoForm = signal<CursoPayload>(cursoVacio());
  isSavingCurso = signal<boolean>(false);
  errorCurso = signal<string | null>(null);
  exitoCurso = signal<string | null>(null);

  // Asignación directa de cargos (sólo módulo global)
  isSavingCargo = signal<boolean>(false);
  errorCargo = signal<string | null>(null);

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

  // Buscador Docente: buscador estándar del portal (ui-persona-search).
  personaSeleccionada = signal<Persona | null>(null);
  @ViewChild(PersonaSearchComponent) docenteSearch?: PersonaSearchComponent;

  // Grillas
  // El plantel se compone de titulares y contratados. Se guardan por separado y se
  // combinan en un computed para que el nombre del cargo contratado se resuelva con
  // la colección de cargos tipo (que puede llegar después de la carga del curso).
  private cargosTitulares = signal<any[]>([]);
  private cargosContratados = signal<any[]>([]);

  cargosActuales = computed(() => {
    const cargoTipos = new Map<number, any>(this.cargosTipo().map(ct => [ct.cargoTipoId, ct]));
    const titulares = this.cargosTitulares().map(t => ({
      ...t,
      isContratado: false,
      key: 'T' + t.cursoCargoId
    }));
    const contratados = this.cargosContratados().map(c => ({
      ...c,
      isContratado: true,
      key: 'C' + c.cursoCargoContratadoId,
      persona: { apellidoNombre: `${c.contratadoPersona?.apellido ?? ''}, ${c.contratadoPersona?.nombre ?? ''}` },
      cargoTipo: cargoTipos.get(c.cargoTipoId) ?? { nombre: `Cargo ${c.cargoTipoId}` }
    }));
    return [...titulares, ...contratados];
  });

  cargoSeleccionado = signal<any | null>(null); // Fila seleccionada en la grilla central
  readonly puedeEliminarCargo = computed<boolean>(() => {
    const cargo = this.cargoSeleccionado();
    return this.esGlobal() && !!cargo && !cargo.isContratado;
  });
  
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

  constructor() {
    effect(() => {
      this.checkAcreditacion();
      if (this.sedeSeleccionada() !== null) {
         this.filtroCursoSubject.next(this.filtroCurso());
      }
    });

    // Filtro de cursos con debounce (las condiciones se resuelven del lado del servidor)
    this.filtroCursoSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => this.isLoading.set(true)),
      switchMap(text => {
        const fid = this.facultadActiva();
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
    // El catálogo de facultades también se usa en modo facultad para mostrar el
    // nombre en la grilla (los cursos sólo traen facultadId).
    this.service.getFacultades().subscribe(data => this.facultades.set(data));
    if (this.esGlobal()) {
      this.service.getNiveles().subscribe(data => this.niveles.set(data));
    }
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

  // Cambio de sede: VB6 hace vCursoId = 0 y limpia el curso, de modo que no se
  // pueda proponer una novedad sobre un curso que pertenece a otra sede.
  seleccionarSede(sedeId: number | null) {
    this.sedeSeleccionada.set(sedeId);
    this.cursoSeleccionado.set(null);
    this.limpiarFormulario();
  }

  // Cambio de facultad (módulo global): reinicia curso, formulario y listado.
  seleccionarFacultad(facultadId: number | null) {
    this.facultadSeleccionada.set(facultadId);
    this.cursoSeleccionado.set(null);
    this.limpiarFormulario();
    this.cursoForm.set(cursoVacio());
    this.cursos.set([]);
    this.loadCursos();
  }

  // --- CRUD de cursos (sólo módulo global) ---

  actualizarCampoCurso(campo: keyof CursoPayload, valor: string | number | null) {
    this.cursoForm.set({ ...this.cursoForm(), [campo]: valor });
    this.errorCurso.set(null);
    this.exitoCurso.set(null);
  }

  agregarCurso() {
    const payload = this.payloadCurso();
    if (!payload) {
      return;
    }

    this.isSavingCurso.set(true);
    this.errorCurso.set(null);
    this.exitoCurso.set(null);
    this.service
      .addCurso(payload)
      .pipe(finalize(() => this.isSavingCurso.set(false)))
      .subscribe({
        next: () => {
          this.exitoCurso.set('Curso creado.');
          this.cursoForm.set({ ...cursoVacio(), facultadId: payload.facultadId, geograficaId: payload.geograficaId });
          this.loadCursos();
        },
        error: (err: HttpErrorResponse) =>
          this.errorCurso.set(mensajeDeError(err, 'No se pudo crear el curso.'))
      });
  }

  actualizarCurso() {
    const curso = this.cursoSeleccionado();
    if (!curso) {
      this.errorCurso.set('Seleccione un curso de la lista.');
      return;
    }
    const payload = this.payloadCurso();
    if (!payload) {
      return;
    }

    this.isSavingCurso.set(true);
    this.errorCurso.set(null);
    this.exitoCurso.set(null);
    this.service
      .updateCurso(curso.cursoId, payload)
      .pipe(
        // El curso cambió: los legajos con cargos en él deben volver a fusionarse.
        switchMap(() => this.service.invalidarFusionCurso(curso.cursoId, this.anho(), this.mes())),
        finalize(() => this.isSavingCurso.set(false))
      )
      .subscribe({
        next: () => {
          this.exitoCurso.set('Curso actualizado. Los legajos asignados quedaron para re-fusionar.');
          this.loadCursos();
          this.loadGrids();
        },
        error: (err: HttpErrorResponse) =>
          this.errorCurso.set(mensajeDeError(err, 'No se pudo actualizar el curso.'))
      });
  }

  eliminarCurso() {
    const curso = this.cursoSeleccionado();
    if (!curso) {
      this.errorCurso.set('Seleccione un curso de la lista.');
      return;
    }

    this.errorCurso.set(null);
    this.exitoCurso.set(null);
    // Igual que el legacy: no se borra un curso con docentes asignados.
    this.service.getCargosCursoAny(curso.cursoId).subscribe({
      next: (cargos) => {
        if (cargos.length > 0) {
          this.errorCurso.set('ERROR: Hay docentes asignados al curso en algún período.');
          return;
        }
        if (!window.confirm(`¿Eliminar el curso "${curso.nombre}"?`)) {
          return;
        }
        this.isSavingCurso.set(true);
        this.service
          .deleteCurso(curso.cursoId)
          .pipe(finalize(() => this.isSavingCurso.set(false)))
          .subscribe({
            next: () => {
              this.exitoCurso.set('Curso eliminado.');
              this.cursoSeleccionado.set(null);
              this.cursoForm.set(cursoVacio());
              this.limpiarFormulario();
              this.loadCursos();
            },
            error: (err: HttpErrorResponse) =>
              this.errorCurso.set(mensajeDeError(err, 'No se pudo eliminar el curso.'))
          });
      },
      error: (err: HttpErrorResponse) =>
        this.errorCurso.set(mensajeDeError(err, 'No se pudo verificar los cargos del curso.'))
    });
  }

  loadCursos() {
    this.filtroCursoSubject.next(this.filtroCurso());
  }

  seleccionarCurso(curso: any) {
    this.cursoSeleccionado.set(curso);
    this.cursoForm.set({
      nombre: curso.nombre ?? '',
      facultadId: curso.facultadId,
      geograficaId: curso.geograficaId,
      anual: curso.anual ?? 0,
      semestre1: curso.semestre1 ?? 0,
      semestre2: curso.semestre2 ?? 0,
      nivelId: curso.nivelId ?? null,
      adicionalCargaHoraria: curso.adicionalCargaHoraria ?? 0
    });
    this.errorCurso.set(null);
    this.exitoCurso.set(null);
    this.limpiarFormulario();
    this.loadGrids();
  }

  // Elimina la asignación de un cargo (módulo global). El legacy reseteaba el
  // flag de fusión del legajo antes de borrar; acá el servidor invalida el curso.
  eliminarCargoActual() {
    const cargo = this.cargoSeleccionado();
    const curso = this.cursoSeleccionado();
    if (!cargo || !curso || cargo.isContratado) {
      alert('Seleccione un cargo titular de la grilla.');
      return;
    }
    if (!window.confirm(`¿Eliminar el cargo de ${cargo.persona?.apellidoNombre ?? 'legajo ' + cargo.legajoId}?`)) {
      return;
    }

    this.service
      .eliminarCargo(cargo.cursoCargoId)
      .pipe(switchMap(() => this.service.invalidarFusionCurso(curso.cursoId, this.anho(), this.mes())))
      .subscribe({
        next: () => {
          this.cargoSeleccionado.set(null);
          this.loadGrids();
        },
        error: (err: HttpErrorResponse) => alert(mensajeDeError(err, 'No se pudo eliminar el cargo.'))
      });
  }

  // Resetea el formulario de alta/baja y las grillas sin tocar el curso elegido.
  private limpiarFormulario() {
    this.cargoSeleccionado.set(null);
    this.personaSeleccionada.set(null);
    this.docenteSearch?.limpiar();
    this.horasSemanales.set(null);
    this.cargoAltaSeleccionado.set(null);
    this.desarraigo.set(false);
    this.observacionesAlta.set('');
    this.observacionesBaja.set('');
    this.cleanGrids();
  }

  loadGrids() {
    const cursoId = this.cursoSeleccionado()?.cursoId;
    if (!cursoId) return;

    // Carga el plantel actual (titulares + contratados)
    forkJoin({
      titulares: this.service.getCargosTitulares(cursoId, this.anho(), this.mes()).pipe(catchError(() => of([]))),
      contratados: this.service.getCargosContratados(cursoId, this.anho(), this.mes()).pipe(catchError(() => of([])))
    }).subscribe(({ titulares, contratados }) => {
       this.cargosTitulares.set(titulares);
       this.cargosContratados.set(contratados);
    });

    this.service.getCargosAlta(cursoId, this.anho(), this.mes()).subscribe(data => this.cargosAlta.set(data));
    this.service.getCargosBaja(cursoId, this.anho(), this.mes()).subscribe(data => this.cargosBaja.set(data));
  }

  cleanGrids() {
    this.cargosTitulares.set([]);
    this.cargosContratados.set([]);
    this.cargosAlta.set([]);
    this.cargosBaja.set([]);
  }

  // Búsqueda de personas: el buscador estándar entrega la persona ya recargada por legajo.
  onDocente(persona: Persona | null) {
    this.personaSeleccionada.set(persona);
  }

  // Interacción Grilla Central
  seleccionarCargoActual(cargo: any) {
    // Los contratados no se pueden seleccionar (igual que VB6: RowData = 0 -> Exit Sub)
    if (cargo.isContratado) return;

    this.cargoSeleccionado.set(cargo);

    // Completa el panel de alta con los datos de la fila elegida
    this.cargoAltaSeleccionado.set(cargo.cargoTipoId);
    this.horasSemanales.set(cargo.horasSemanales);
    this.desarraigo.set(cargo.desarraigo === 1);
    if (cargo.persona) this.personaSeleccionada.set(cargo.persona as Persona);
  }

  // LÓGICA DE NEGOCIO (Alta / Cambio / Reemplazo) -> Botón "+" Izquierdo
  agregarCargoAlta() {
    // En el módulo global la asignación es directa sobre curso_cargo; en el de
    // facultad se propone una novedad que rectorado debe autorizar.
    if (this.esGlobal()) {
      this.asignarCargoDirecto();
      return;
    }

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

    // Verifica que no exista ya una novedad pendiente para el docente en el curso
    this.service.getNovedadPendienteByLegajo(p.legajoId, cursoId, this.anho(), this.mes()).subscribe(pendientes => {
      if (pendientes.length > 0) {
        alert("ERROR: Novedad EXISTENTE para este DOCENTE en este curso y período");
        return;
      }

      let isBaja = false;
      let isCambioDesarraigo = false;
      let isCambioHoras = false;

      // Verifica si el docente ya está en el plantel del curso
      const cargoActual = this.cargosActuales().find(c => c.legajoId === p.legajoId && !c.isContratado);

      if (cargoActual) {
        // ¿Es el mismo cargo?
        if (cargoActual.cargoTipoId === cargoTipoId) {
           if (cargoActual.desarraigo !== desarr || cargoActual.horasSemanales !== horas) {
              if (cargoActual.desarraigo !== desarr) isCambioDesarraigo = true;
              if (cargoActual.horasSemanales !== horas) isCambioHoras = true;
           } else {
              alert("No hay modificaciones reales en horas o desarraigo.");
              return;
           }
        } else {
           // Distinto cargo: se da de baja el anterior y se agrega el nuevo
           isBaja = true;
        }
      }

      if (isCambioDesarraigo || isCambioHoras) {
        // CAMBIO de horas y/o desarraigo
        this.service.addNovedad(this.payloadNovedad({
          cursoId, legajoId: p.legajoId, cargoTipoId, horasSemanales: horas, desarraigo: desarr,
          solicitud: obs, alta: 0, baja: 0, cambio: 1
        })).subscribe({ next: () => this.loadGrids(), error: (e) => console.error(e) });
      } else {
        // ALTA
        this.service.addNovedad(this.payloadNovedad({
          cursoId, legajoId: p.legajoId, cargoTipoId, horasSemanales: horas, desarraigo: desarr,
          solicitud: obs, alta: 1, baja: 0, cambio: 0
        })).subscribe({ next: () => this.loadGrids(), error: (e) => console.error(e) });
      }

      if (isBaja) {
        // BAJA AUTOMÁTICA del cargo anterior
        this.service.addNovedad(this.payloadNovedad({
          cursoId, legajoId: p.legajoId, cargoTipoId: cargoActual.cargoTipoId,
          horasSemanales: cargoActual.horasSemanales, desarraigo: cargoActual.desarraigo,
          solicitud: obs, alta: 0, baja: 1, cambio: 0
        })).subscribe({ next: () => this.loadGrids(), error: (e) => console.error(e) });
      }
      
      this.observacionesAlta.set('');
    });
  }

  // LÓGICA DE NEGOCIO (Baja manual) -> Botón "+" Derecho
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

    // Verifica que no exista ya una novedad pendiente para el docente en el curso
    this.service.getNovedadPendienteByLegajo(cargo.legajoId, cargo.cursoId, this.anho(), this.mes()).subscribe(pendientes => {
      if (pendientes.length > 0) {
        alert("ERROR: Novedad EXISTENTE para este DOCENTE");
        return;
      }

      this.service.addNovedad(this.payloadNovedad({
        cursoId: cargo.cursoId,
        legajoId: cargo.legajoId,
        cargoTipoId: cargo.cargoTipoId,
        horasSemanales: cargo.horasSemanales,
        desarraigo: cargo.desarraigo,
        solicitud: obs,
        alta: 0, baja: 1, cambio: 0
      })).subscribe(() => {
         this.observacionesBaja.set('');
         this.loadGrids();
      });
    });
  }

  /**
   * Asignación directa (módulo global): crea o modifica el cargo del docente en
   * el curso y deja el curso marcado para re-fusionar. Replica cmdAsignar del
   * formulario legacy, que no generaba novedades.
   */
  private asignarCargoDirecto() {
    const cursoId = this.cursoSeleccionado()?.cursoId;
    const persona = this.personaSeleccionada();
    const cargoTipoId = this.cargoAltaSeleccionado();
    const horas = this.horasSemanales();

    if (!cursoId || !persona || !cargoTipoId || horas === null) {
      alert('Faltan datos: Docente, Cargo y Horas Semanales.');
      return;
    }

    this.isSavingCargo.set(true);
    this.errorCargo.set(null);
    this.service
      .getCargoPorLegajo(cursoId, this.anho(), this.mes(), persona.legajoId)
      .pipe(
        catchError(() => of(null)),
        switchMap((existente) => {
          const payload: CargoPayload = {
            cursoId,
            anho: this.anho(),
            mes: this.mes(),
            cargoTipoId,
            legajoId: persona.legajoId,
            horasSemanales: horas,
            horasTotales: existente?.horasTotales ?? 0,
            desarraigo: this.desarraigo() ? 1 : 0
          };
          return existente?.cursoCargoId
            ? this.service.updateCargo(existente.cursoCargoId, payload)
            : this.service.addCargo(payload);
        }),
        switchMap(() => this.service.invalidarFusionCurso(cursoId, this.anho(), this.mes())),
        finalize(() => this.isSavingCargo.set(false))
      )
      .subscribe({
        next: () => this.loadGrids(),
        error: (err: HttpErrorResponse) =>
          this.errorCargo.set(mensajeDeError(err, 'No se pudo asignar el cargo.'))
      });
  }

  // Payload alineado con makeParams de clsMODCursoCargoNovedad.cls: sólo los
  // campos de curso_cargo_novedad (sin facultadId/visado/rectorado, que no existen
  // en la entidad del backend).
  private payloadNovedad(datos: {
    cursoId: number;
    legajoId: number;
    cargoTipoId: number;
    horasSemanales: number;
    desarraigo: number;
    solicitud: string;
    alta: number;
    baja: number;
    cambio: number;
  }) {
    return {
      ...datos,
      anho: this.anho(),
      mes: this.mes(),
      horasTotales: 0,
      autorizado: 0,
      rechazado: 0,
      respuesta: null,
      transferido: 0
    };
  }

  eliminarNovedad(novedad: any) {
    if (!confirm('¿Seguro que desea eliminar esta solicitud pendiente?')) return;
    // VB6 recorre collectionPendientesByLegajo y borra todas las del legajo/curso
    this.service.deleteNovedadPendiente(novedad.legajoId, novedad.cursoId, this.anho(), this.mes()).subscribe(() => {
       this.loadGrids();
    });
  }

  imprimir() {
    const fid = this.facultadActiva();
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

  // --- Utilidades del módulo global ---

  nombreFacultad(curso: any): string {
    if (curso?.facultad?.reducido) {
      return curso.facultad.reducido;
    }
    return this.facultades().find((f) => f.facultadId === curso?.facultadId)?.reducido ?? '';
  }

  nombreSede(curso: any): string {
    if (curso?.geografica?.reducido) {
      return curso.geografica.reducido;
    }
    return this.sedes().find((s) => s.geograficaId === curso?.geograficaId)?.reducido ?? '';
  }

  /** Valida el formulario y arma el payload que espera el core. */
  private payloadCurso(): CursoPayload | null {
    const form = this.cursoForm();
    const facultadId = form.facultadId || this.facultadActiva();
    const geograficaId = form.geograficaId || this.sedeSeleccionada();

    if (!form.nombre.trim()) {
      this.errorCurso.set('Falta NOMBRE del curso.');
      return null;
    }
    if (!facultadId || !geograficaId) {
      this.errorCurso.set('Falta FACULTAD o SEDE.');
      return null;
    }
    if (!form.nivelId) {
      this.errorCurso.set('Falta NIVEL.');
      return null;
    }

    return {
      ...form,
      nombre: form.nombre.trim(),
      facultadId,
      geograficaId
    };
  }
}

function cursoVacio(): CursoPayload {
  return {
    nombre: '',
    facultadId: 0,
    geograficaId: 0,
    anual: 0,
    semestre1: 0,
    semestre2: 0,
    nivelId: null,
    adicionalCargaHoraria: 0
  };
}
