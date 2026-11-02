import { Component, computed, inject, input, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, finalize, forkJoin, map, Observable, of, tap } from 'rxjs';

import { AuthService, Persona, mensajeDeError } from '@haberes/shared-api';
import { PersonaSearchComponent } from '@haberes/ui-layout';

import { DesignacionesService } from './designaciones.service';
import {
  CargoLiquidacion,
  CatalogosDesignaciones,
  CursoCargo,
  CursoFusion,
  CursoAsignadoVm,
  DesignacionFusionadaVm,
  DesignacionLiquidadaVm
} from './designaciones.models';

/**
 * Control de designaciones de un docente.
 *
 * Dos modos sobre el mismo componente:
 * - **Global** (`facultadId` nulo y sesión sin facultad, módulo Liquidación):
 *   liquidadas del mes anterior + cursos + fusionadas + totales y las acciones
 *   Redesignar / Fusionar / Imprimir.
 * - **Facultad** (`facultadId` de sesión, módulo Novedades): sólo cursos y
 *   fusionadas de la facultad del usuario, en modo consulta.
 */
@Component({
  selector: 'haberes-designaciones',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, FormsModule, PersonaSearchComponent],
  templateUrl: './designaciones.component.html'
})
export class DesignacionesComponent {
  private readonly service = inject(DesignacionesService);
  private readonly auth = inject(AuthService);

  /**
   * Facultad explícita (opcional). Si no se informa se toma la de la sesión;
   * si tampoco hay, la pantalla funciona en modo global.
   */
  readonly facultadId = input<number | null>(null);

  readonly anho = signal<number>(new Date().getFullYear());
  readonly mes = signal<number>(new Date().getMonth() + 1);

  // Búsqueda de personas: buscador estándar del portal (ui-persona-search).
  readonly personaSeleccionada = signal<Persona | null>(null);

  readonly liquidadas = signal<CargoLiquidacion[]>([]);
  readonly cursosCargo = signal<CursoCargo[]>([]);
  readonly cursosFusion = signal<CursoFusion[]>([]);
  readonly diferencia = signal<number>(0);
  readonly forzar = signal<boolean>(false);

  readonly isLoading = signal<boolean>(false);
  readonly isRedesignando = signal<boolean>(false);
  readonly isFusionando = signal<boolean>(false);
  readonly isPrinting = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly exito = signal<string | null>(null);

  private readonly catalogs = signal<CatalogosDesignaciones>(catalogosVacios());
  private catalogsLoaded = false;

  readonly facultadEfectiva = computed<number | null>(() => this.facultadId() ?? this.auth.facultadId());
  readonly esGlobal = computed<boolean>(() => this.facultadEfectiva() === null);
  readonly hayPersona = computed<boolean>(() => this.personaSeleccionada() !== null);
  readonly puedeOperar = computed<boolean>(() => this.hayPersona() && !this.isLoading());

  readonly liquidadasVm = computed<DesignacionLiquidadaVm[]>(() => {
    const catalogs = this.catalogs();
    return this.liquidadas().map((item) => {
      const dependencia = item.dependencia ?? catalogs.dependencias.get(item.dependenciaId);
      return {
        facultad: catalogs.facultades.get(dependencia?.facultadId ?? -1)?.nombre ?? '',
        sede: catalogs.geograficas.get(dependencia?.geograficaId ?? -1)?.nombre ?? '',
        designacion: this.nombreCategoria(item.categoriaId, item.categoria, item.categoriaNombre ?? ''),
        importe: item.categoria?.basico ?? item.categoriaBasico ?? 0
      };
    });
  });

  readonly cursosVm = computed<CursoAsignadoVm[]>(() => {
    const catalogs = this.catalogs();
    return this.cursosCargo().map((item) => ({
      facultad: catalogs.facultades.get(item.curso?.facultadId ?? -1)?.nombre ?? '',
      sede: catalogs.geograficas.get(item.curso?.geograficaId ?? -1)?.nombre ?? '',
      curso: item.curso?.nombre ?? '',
      horas: item.horasSemanales ?? null,
      cargo: catalogs.cargoTipos.get(item.cargoTipoId)?.nombre ?? '',
      designacion: catalogs.designacionTipos.get(item.designacionTipoId)?.nombre ?? '',
      importe: item.categoria?.basico ?? catalogs.categorias.get(item.categoriaId)?.basico ?? 0,
      desarraigo: item.desarraigo === 1,
      anual: item.curso?.anual === 1,
      semestre1: item.curso?.semestre1 === 1,
      semestre2: item.curso?.semestre2 === 1
    }));
  });

  readonly fusionVm = computed<DesignacionFusionadaVm[]>(() => {
    const catalogs = this.catalogs();
    return this.cursosFusion().map((item) => ({
      facultad: catalogs.facultades.get(item.facultadId)?.nombre ?? '',
      sede: catalogs.geograficas.get(item.geograficaId)?.nombre ?? '',
      cargo: catalogs.cargoTipos.get(item.cargoTipoId)?.nombre ?? '',
      designacion: catalogs.designacionTipos.get(item.designacionTipoId)?.nombre ?? '',
      categoria: catalogs.categorias.get(item.categoriaId)?.nombre ?? '',
      importe: catalogs.categorias.get(item.categoriaId)?.basico ?? 0
    }));
  });

  readonly totalLiquidadas = computed<number>(() => this.liquidadasVm().reduce((total, fila) => total + fila.importe, 0));
  readonly totalCursos = computed<number>(() => this.cursosVm().reduce((total, fila) => total + fila.importe, 0));
  readonly totalFusion = computed<number>(() => this.fusionVm().reduce((total, fila) => total + fila.importe, 0));

  onPersonaSeleccionada(persona: Persona | null): void {
    this.personaSeleccionada.set(persona);
    this.limpiarGrillas();
  }

  limpiarGrillas(): void {
    this.liquidadas.set([]);
    this.cursosCargo.set([]);
    this.cursosFusion.set([]);
    this.diferencia.set(0);
    this.error.set(null);
    this.exito.set(null);
  }

  cambiarMes(incremento: number): void {
    let mes = this.mes() + incremento;
    let anho = this.anho();
    if (mes > 12) {
      mes = 1;
      anho++;
    }
    if (mes < 1) {
      mes = 12;
      anho--;
    }
    this.mes.set(mes);
    this.anho.set(anho);
    this.limpiarGrillas();
  }

  revisar(): void {
    const persona = this.personaSeleccionada();
    if (!persona) {
      this.error.set('Seleccione un docente.');
      return;
    }
    this.limpiarGrillas();
    this.cargarPeriodo(persona);
  }

  /**
   * Trae los datos del período sin tocar los mensajes: lo usan tanto "Revisar"
   * como las acciones, que muestran su confirmación mientras recargan.
   */
  private cargarPeriodo(persona: Persona): void {
    const facultad = this.facultadEfectiva();
    const global = facultad === null;
    const anterior = periodoAnterior(this.anho(), this.mes());

    this.isLoading.set(true);

    forkJoin({
      catalogos: this.cargarCatalogs(),
      liquidadas: global
        ? this.service
            .getCargoLiquidacionDocente(persona.legajoId, anterior.anho, anterior.mes)
            .pipe(catchError(() => of([] as CargoLiquidacion[])))
        : of([] as CargoLiquidacion[]),
      cursos: this.service
        .getCursosCargo(persona.legajoId, this.anho(), this.mes(), facultad)
        .pipe(catchError(() => of([] as CursoCargo[]))),
      fusiones: this.service
        .getCursosFusion(persona.legajoId, this.anho(), this.mes(), facultad)
        .pipe(catchError(() => of([] as CursoFusion[]))),
      diferencia: global
        ? this.service
            .getDiferenciaDesignaciones(persona.legajoId, this.anho(), this.mes())
            .pipe(catchError(() => of(null)))
        : of(null)
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe(({ liquidadas, cursos, fusiones, diferencia }) => {
        this.liquidadas.set(liquidadas);
        this.cursosCargo.set(cursos);
        this.cursosFusion.set(fusiones);
        this.diferencia.set(diferencia?.importe ?? 0);
      });
  }

  redesignar(): void {
    const persona = this.personaSeleccionada();
    if (!persona) {
      return;
    }
    this.isRedesignando.set(true);
    this.error.set(null);
    this.exito.set(null);
    this.service
      .redesignar(persona.legajoId, this.anho(), this.mes())
      .pipe(finalize(() => this.isRedesignando.set(false)))
      .subscribe({
        next: () => {
          this.exito.set('Designaciones recalculadas para el período.');
          this.cargarPeriodo(persona);
        },
        error: (err: HttpErrorResponse) =>
          this.error.set(mensajeDeError(err, 'No se pudieron recalcular las designaciones.'))
      });
  }

  fusionar(): void {
    const persona = this.personaSeleccionada();
    if (!persona) {
      return;
    }
    const forzar = this.forzar();
    const mensaje = forzar
      ? 'Se volverán a fusionar las designaciones del período aunque ya estén fusionadas. ¿Continuar?'
      : 'Se fusionarán las designaciones del período. ¿Continuar?';
    if (!window.confirm(mensaje)) {
      return;
    }

    this.isFusionando.set(true);
    this.error.set(null);
    this.exito.set(null);
    this.service
      .fusionar(persona.legajoId, this.anho(), this.mes(), forzar)
      .pipe(finalize(() => this.isFusionando.set(false)))
      .subscribe({
        next: () => {
          this.exito.set('Designaciones fusionadas.');
          this.cargarPeriodo(persona);
        },
        error: (err: HttpErrorResponse) =>
          this.error.set(mensajeDeError(err, 'No se pudieron fusionar las designaciones.'))
      });
  }

  imprimir(): void {
    const persona = this.personaSeleccionada();
    if (!persona) {
      return;
    }
    this.isPrinting.set(true);
    this.error.set(null);
    this.service
      .descargarDetalle(persona.legajoId, this.anho(), this.mes())
      .pipe(finalize(() => this.isPrinting.set(false)))
      .subscribe({
        next: (blob) => this.abrirPdf(blob, `designaciones-${persona.legajoId}-${this.mes()}-${this.anho()}.pdf`),
        error: (err: HttpErrorResponse) =>
          this.error.set(mensajeDeError(err, 'No se pudo generar el detalle de designaciones.'))
      });
  }

  // --- Catálogos ---

  private cargarCatalogs(): Observable<CatalogosDesignaciones> {
    if (this.catalogsLoaded) {
      return of(this.catalogs());
    }
    return forkJoin({
      facultades: this.service.getFacultades().pipe(catchError(() => of([]))),
      geograficas: this.service.getGeograficas().pipe(catchError(() => of([]))),
      dependencias: this.service.getDependencias().pipe(catchError(() => of([]))),
      categorias: this.service.getCategorias().pipe(catchError(() => of([]))),
      cargoTipos: this.service.getCargoTipos().pipe(catchError(() => of([]))),
      designacionTipos: this.service.getDesignacionTipos().pipe(catchError(() => of([])))
    }).pipe(
      map(({ facultades, geograficas, dependencias, categorias, cargoTipos, designacionTipos }) => ({
        facultades: new Map(facultades.map((item) => [item.facultadId, item])),
        geograficas: new Map(geograficas.map((item) => [item.geograficaId, item])),
        dependencias: new Map(dependencias.map((item) => [item.dependenciaId, item])),
        categorias: new Map(categorias.map((item) => [item.categoriaId, item])),
        cargoTipos: new Map(cargoTipos.map((item) => [item.cargoTipoId, item])),
        designacionTipos: new Map(designacionTipos.map((item) => [item.designacionTipoId, item]))
      })),
      tap((catalogos) => {
        this.catalogs.set(catalogos);
        this.catalogsLoaded = true;
      })
    );
  }

  private nombreCategoria(categoriaId: number, categoria: { nombre?: string } | null | undefined, alternativo: string): string {
    if (categoria?.nombre) {
      return categoria.nombre;
    }
    return this.catalogs().categorias.get(categoriaId)?.nombre ?? alternativo;
  }

  private abrirPdf(blob: Blob, nombre: string): void {
    // Sin MIME application/pdf el browser descarga el blob en vez de abrirlo en el visor.
    const pdf = blob.type === 'application/pdf' ? blob : new Blob([blob], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(pdf);
    const ventana = window.open(url, '_blank');
    if (!ventana) {
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = nombre;
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
    }
    setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
  }
}

function catalogosVacios(): CatalogosDesignaciones {
  return {
    facultades: new Map(),
    geograficas: new Map(),
    dependencias: new Map(),
    categorias: new Map(),
    cargoTipos: new Map(),
    designacionTipos: new Map()
  };
}

/** Período inmediatamente anterior (enero retrocede al diciembre del año previo). */
function periodoAnterior(anho: number, mes: number): { anho: number; mes: number } {
  return mes === 1 ? { anho: anho - 1, mes: 12 } : { anho, mes: mes - 1 };
}
