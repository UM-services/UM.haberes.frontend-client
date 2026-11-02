import { Component, computed, inject, input, signal, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnotadorService } from './anotador.service';
import { AuthService, Persona } from '@haberes/shared-api';
import { PersonaSearchComponent } from '@haberes/ui-layout';

@Component({
  selector: 'haberes-anotador',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, FormsModule, PersonaSearchComponent],
  templateUrl: './anotador.component.html'
})
export class AnotadorComponent {
  private readonly service = inject(AnotadorService);
  private readonly auth = inject(AuthService);

  /**
   * Facultad explícita (opcional). Sin valor se toma la de la sesión; si
   * tampoco hay, la pantalla trabaja en modo global (módulo Liquidación), que
   * consulta todas las facultades y visa las anotaciones pendientes.
   */
  readonly facultadId = input<number | null>(null);

  readonly facultadEfectiva = computed<number | null>(() => this.facultadId() ?? this.auth.facultadId());
  readonly esGlobal = computed<boolean>(() => this.facultadEfectiva() === null);

  anho = signal<number>(new Date().getFullYear());
  mes = signal<number>(new Date().getMonth() + 1);
  
  pendientes = signal<any[]>([]);
  revisados = signal<any[]>([]);
  activeTab = signal<'pendientes' | 'revisados'>('pendientes');
  isLoadingList = signal<boolean>(false);

  // Buscador de personas: buscador estándar del portal (ui-persona-search).
  personaSeleccionada = signal<Persona | null>(null);
  /** Anotación seleccionada en la lista; es la que se visa en el módulo global. */
  anotadorSeleccionado = signal<any | null>(null);
  historial = signal<any[]>([]);
  isLoadingHistory = signal<boolean>(false);

  nuevaAnotacion = signal<string>('');
  respuestaVisado = signal<string>('');
  canAdd = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  isVisando = signal<boolean>(false);
  error = signal<string | null>(null);
  exito = signal<string | null>(null);

  // Reportes del período (equivalentes a los dos botones de impresión de VB6).
  isPrintingPendientes = signal<boolean>(false);
  isPrintingRevisados = signal<boolean>(false);

  constructor() {
    effect(() => {
      this.checkAcreditacion();
      this.revisar();
    });
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

  // Tanto la selección en el buscador como el click en las listas de novedades
  // pasan por acá: fija la persona y carga su historial.
  seleccionarPersona(persona: Persona | null) {
    if (!persona) {
      return;
    }
    this.personaSeleccionada.set(persona);
    this.loadHistorial(persona.legajoId);
  }

  // Selección de una anotación concreta (módulo global): además de la persona
  // guarda la novedad para poder visarla.
  seleccionarAnotacion(item: any) {
    this.anotadorSeleccionado.set(item);
    this.respuestaVisado.set('');
    this.error.set(null);
    this.exito.set(null);
    this.seleccionarPersona(this.personaDeNovedad(item));
  }

  // Las filas de novedades traen la persona embebida; el fallback cubre respuestas
  // incompletas y arma sólo el legajo, que es lo único que usa el flujo de selección.
  personaDeNovedad(item: any): Persona {
    if (item.persona) return item.persona as Persona;
    return { legajoId: item.legajoId, apellidoNombre: `Legajo ${item.legajoId}` } as Persona;
  }

  revisar() {
    const fid = this.facultadEfectiva();
    const global = fid === null;

    this.isLoadingList.set(true);
    const pendientes$ = global
      ? this.service.getPendientesPeriodo(this.anho(), this.mes())
      : this.service.getPendientes(fid as number, this.anho(), this.mes());
    const revisados$ = global
      ? this.service.getRevisadosPeriodo(this.anho(), this.mes())
      : this.service.getRevisados(fid as number, this.anho(), this.mes());

    pendientes$.subscribe({
      next: (data) => {
        this.pendientes.set(data);
        this.isLoadingList.set(false);
      },
      error: () => {
        this.pendientes.set([]);
        this.isLoadingList.set(false);
      }
    });

    revisados$.subscribe({
      next: (data) => this.revisados.set(data),
      error: () => this.revisados.set([])
    });
  }

  loadHistorial(legajoId: number) {
    this.isLoadingHistory.set(true);
    const fid = this.facultadEfectiva();

    this.service.getHistorial(legajoId).subscribe({
      next: (data) => {
        // En modo facultad sólo se muestra el historial de esa facultad;
        // el módulo global ve todas.
        this.historial.set(fid === null ? data : data.filter(h => h.facultadId === fid));
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
    this.anotadorSeleccionado.set(null);
    this.respuestaVisado.set('');
    this.error.set(null);
    this.exito.set(null);
  }

  /** Autoriza o rechaza la anotación seleccionada (módulo global). */
  visar(autorizado: boolean) {
    const anotador = this.anotadorSeleccionado();
    const respuesta = this.respuestaVisado().trim();
    if (!anotador) {
      this.error.set('Elija una novedad de la lista.');
      return;
    }
    if (!respuesta) {
      this.error.set('Falta RESPUESTA.');
      return;
    }

    this.isVisando.set(true);
    this.error.set(null);
    this.exito.set(null);
    this.service.visar(anotador.anotadorId, autorizado, respuesta).subscribe({
      next: () => {
        this.isVisando.set(false);
        this.exito.set(autorizado ? 'Anotación autorizada.' : 'Anotación rechazada.');
        this.anotadorSeleccionado.set(null);
        this.respuestaVisado.set('');
        this.revisar();
        const persona = this.personaSeleccionada();
        if (persona) {
          this.loadHistorial(persona.legajoId);
        }
      },
      error: () => {
        this.isVisando.set(false);
        this.error.set('No se pudo registrar el visado de la anotación.');
      }
    });
  }

  agregarAnotacion() {
    const p = this.personaSeleccionada();
    const fid = this.auth.facultadId();
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

  // Imprime las anotaciones pendientes del período (VB6: anotadorPendientes).
  imprimirPendientes() {
    const fid = this.facultadEfectiva();
    const global = fid === null;

    this.isPrintingPendientes.set(true);
    const descarga$ = global
      ? this.service.downloadPendientesPeriodoReport(this.anho(), this.mes())
      : this.service.downloadPendientesReport(fid as number, this.anho(), this.mes());
    descarga$.subscribe({
      next: (blob) => {
        this.guardarBlob(blob, `AnotadorPendientes_${fid ?? 'periodo'}_${this.anho()}_${this.mes()}.pdf`);
        this.isPrintingPendientes.set(false);
      },
      error: () => {
        this.error.set('No se pudo generar el reporte de pendientes.');
        this.isPrintingPendientes.set(false);
      }
    });
  }

  // Imprime las anotaciones autorizadas/rechazadas del período (VB6: anotadorRevisados).
  imprimirRevisados() {
    const fid = this.facultadEfectiva();
    const global = fid === null;

    this.isPrintingRevisados.set(true);
    const descarga$ = global
      ? this.service.downloadRevisadosPeriodoReport(this.anho(), this.mes())
      : this.service.downloadRevisadosReport(fid as number, this.anho(), this.mes());
    descarga$.subscribe({
      next: (blob) => {
        this.guardarBlob(blob, `AnotadorAutorizadosRechazados_${fid ?? 'periodo'}_${this.anho()}_${this.mes()}.pdf`);
        this.isPrintingRevisados.set(false);
      },
      error: () => {
        this.error.set('No se pudo generar el reporte de revisados.');
        this.isPrintingRevisados.set(false);
      }
    });
  }

  private guardarBlob(blob: Blob, nombre: string) {
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    a.remove();
  }
}
