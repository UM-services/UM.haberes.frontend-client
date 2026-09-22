import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import {
  Subject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  of,
  switchMap,
  take,
  tap
} from 'rxjs';

import { AuthService } from '@haberes/shared-api';
// Reutiliza la búsqueda de personas expuesta por Designaciones (patrón de feature-cargos)
import { DesignacionesService } from '@haberes/feature-designaciones';

import { BonoReportService } from './bono-report.service';
import { IntegridadBonoResponse } from './bono.models';

export interface BonoPersona {
  legajoId: number;
  documento?: number | string | null;
  apellido?: string;
  nombre?: string;
  apellidoNombre?: string;
}

@Component({
  selector: 'haberes-bono-individual',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bono-individual.component.html'
})
export class BonoIndividualComponent {
  private readonly auth = inject(AuthService);
  private readonly searchService = inject(DesignacionesService);
  private readonly bonoService = inject(BonoReportService);
  private readonly router = inject(Router);

  private readonly searchSubject = new Subject<string>();

  private readonly mensajesFaltantesMap: Record<string, string> = {
    DEPENDENCIA: 'ERROR: Legajo SIN Dependencia',
    LIQUIDACION: 'ERROR: Falta LIQUIDACIÓN',
    ITEM: 'ERROR: Falta ITEM',
    ACTIVIDAD: 'ERROR: Falta ACTIVIDAD',
    LEGAJO_CONTROL: 'ERROR: Falta CONTROL DE LEGAJO'
  };

  anho = signal<number>(new Date().getFullYear());
  mes = signal<number>(new Date().getMonth() + 1);

  personaInput = signal<string>('');
  personaSeleccionada = signal<BonoPersona | null>(null);
  resultadosBusqueda = signal<BonoPersona[]>([]);
  isSearching = signal<boolean>(false);
  showDropdown = signal<boolean>(false);

  mailInstitucional = signal<string>('');
  mailInvalido = signal<boolean>(false);

  integridad = signal<IntegridadBonoResponse | null>(null);
  error = signal<string | null>(null);
  exito = signal<string | null>(null);

  isVerifying = signal<boolean>(false);
  isPrinting = signal<boolean>(false);
  isSending = signal<boolean>(false);

  legajoSolicitante = signal<number | null>(null);

  mensajesFaltantes = computed<string[]>(() =>
    (this.integridad()?.faltantes ?? []).map(
      (faltante) => this.mensajesFaltantesMap[faltante] ?? `ERROR: faltan datos (${faltante})`
    )
  );

  constructor() {
    this.auth.currentUser$.pipe(take(1)).subscribe((usuario) => {
      if (usuario) {
        this.legajoSolicitante.set(usuario.legajoId);
      }
    });

    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => this.isSearching.set(true)),
        switchMap((rawTerm) => {
          const term = rawTerm.trim();
          if (!term || term.length < 3) {
            return of([] as BonoPersona[]);
          }
          if (!isNaN(Number(term))) {
            return this.searchService
              .getPersonaByLegajo(Number(term))
              .pipe(map((persona) => (persona ? [persona as BonoPersona] : [])));
          }
          return this.searchService
            .searchPersonas(term)
            .pipe(map((lista) => (Array.isArray(lista) ? lista : []) as BonoPersona[]));
        }),
        catchError(() => of([] as BonoPersona[]))
      )
      .subscribe((resultados) => {
        this.resultadosBusqueda.set(resultados);
        this.isSearching.set(false);
        this.showDropdown.set(resultados.length > 0);
      });
  }

  onSearchInput(value: string): void {
    this.personaInput.set(value);
    this.personaSeleccionada.set(null);
    this.integridad.set(null);
    this.searchSubject.next(value);
  }

  seleccionarPersona(persona: BonoPersona): void {
    this.personaSeleccionada.set(persona);
    this.personaInput.set(BonoIndividualComponent.textoPersona(persona));
    this.showDropdown.set(false);
    this.integridad.set(null);
    this.error.set(null);
    this.exito.set(null);
    this.bonoService.getContacto(persona.legajoId).subscribe({
      next: (contacto) => {
        this.mailInstitucional.set(contacto.mailInstitucional ?? '');
        this.mailInvalido.set(false);
      },
      error: () => {
        this.mailInstitucional.set('');
        this.mailInvalido.set(false);
      }
    });
  }

  onMailInput(value: string): void {
    this.mailInstitucional.set(value);
    this.mailInvalido.set(false);
  }

  onMailBlur(): void {
    const mail = this.mailInstitucional().trim();
    this.mailInstitucional.set(mail);
    if (!mail) {
      this.mailInvalido.set(false);
      return;
    }
    this.bonoService.validateMail(mail).subscribe({
      next: (valido) => this.mailInvalido.set(!valido),
      error: () => this.mailInvalido.set(false)
    });
  }

  cambiarMes(incremento: number): void {
    let m = this.mes() + incremento;
    let a = this.anho();
    if (m > 12) {
      m = 1;
      a++;
    }
    if (m < 1) {
      m = 12;
      a--;
    }
    this.mes.set(m);
    this.anho.set(a);
    this.integridad.set(null);
  }

  verificarIntegridad(): void {
    const persona = this.personaSeleccionada();
    if (!persona) {
      this.error.set('Seleccione un legajo.');
      return;
    }
    this.isVerifying.set(true);
    this.error.set(null);
    this.exito.set(null);
    this.bonoService.verificarIntegridad(persona.legajoId, this.anho(), this.mes()).subscribe({
      next: (respuesta) => {
        this.integridad.set(respuesta);
        this.isVerifying.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(this.mensajeHttp(err, 'No se pudo verificar la integridad del legajo.'));
        this.isVerifying.set(false);
      }
    });
  }

  imprimir(): void {
    const persona = this.personaSeleccionada();
    const solicitante = this.legajoSolicitante();
    if (!persona) {
      this.error.set('Seleccione un legajo.');
      return;
    }
    if (!solicitante) {
      this.error.set('Error de sesión: no se pudo identificar al solicitante.');
      return;
    }
    this.isPrinting.set(true);
    this.error.set(null);
    this.exito.set(null);
    this.integridad.set(null);
    this.bonoService.prepare(persona.legajoId, this.anho(), this.mes()).subscribe({
      next: () => this.descargarPdf(persona, solicitante),
      error: (err: HttpErrorResponse) => {
        this.isPrinting.set(false);
        if (err.status === 400) {
          // prepare falla por datos incompletos: se consulta la integridad para
          // mostrar al usuario los faltantes concretos del período.
          this.bonoService.verificarIntegridad(persona.legajoId, this.anho(), this.mes()).subscribe({
            next: (respuesta) => this.integridad.set(respuesta),
            error: () => this.error.set('No se pudo preparar la impresión del bono.')
          });
          return;
        }
        this.error.set(this.mensajeHttp(err, 'No se pudo preparar la impresión del bono.'));
      }
    });
  }

  enviar(): void {
    const persona = this.personaSeleccionada();
    const mail = this.mailInstitucional().trim();
    const solicitante = this.legajoSolicitante();
    if (!persona || !mail) {
      return;
    }
    if (!solicitante) {
      this.error.set('Error de sesión: no se pudo identificar al solicitante.');
      return;
    }
    this.isSending.set(true);
    this.error.set(null);
    this.exito.set(null);
    this.bonoService
      .sendPrepare(persona.legajoId, this.anho(), this.mes(), {
        mailInstitucional: mail,
        legajoIdSolicitud: solicitante
      })
       .pipe(switchMap(() => this.bonoService.sendBono(persona.legajoId, this.anho(), this.mes())))
      .subscribe({
        next: (mensaje) => {
          this.exito.set(mensaje?.trim() || 'Bono enviado.');
          this.isSending.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.error.set(this.mensajeHttp(err, 'No se pudo enviar el bono por e-mail.'));
          this.isSending.set(false);
        }
      });
  }

  salir(): void {
    this.router.navigate(['/inicio']);
  }

  private descargarPdf(persona: BonoPersona, legajoIdSolicitud: number): void {
    const legajoId = persona.legajoId;
    this.bonoService.downloadBonoPdf(legajoId, this.anho(), this.mes()).subscribe({
      next: (blob) => {
        this.abrirPdf(blob, this.nombreBono(persona));
        this.isPrinting.set(false);
        // La auditoria con la IP real del request la registra el core (ClientIpResolver),
        // no el report service; se hace solo despues de obtener el PDF.
        this.bonoService.registrarAuditoria(legajoId, this.anho(), this.mes(), legajoIdSolicitud).subscribe({
          error: () => this.error.set('El bono se imprimió, pero no se pudo registrar la auditoría.')
        });
      },
      error: (err: HttpErrorResponse) => {
        this.isPrinting.set(false);
        this.error.set(this.mensajeHttp(err, 'No se pudo generar el PDF del bono.'));
      }
    });
  }

  // Mismo formato que VB6 (clsCtlPrint.cls): apellido.nombre.legajoId.anho.mes.pdf
  private nombreBono(persona: BonoPersona): string {
    const limpiar = (valor?: string | number | null): string =>
      (valor === undefined || valor === null ? '' : String(valor)).replace(/[\\/:*?"<>|\r\n\t]/g, '-').trim();
    return `${limpiar(persona.apellido)}.${limpiar(persona.nombre)}.${persona.legajoId}.${this.anho()}.${this.mes()}.pdf`;
  }

  private abrirPdf(blob: Blob, nombre: string): void {
    // Sin MIME application/pdf el browser descarga el blob en vez de abrirlo en el visor.
    const pdf = blob.type === 'application/pdf' ? blob : new Blob([blob], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(pdf);
    const ventana = window.open(url, '_blank');
    if (!ventana) {
      const a = document.createElement('a');
      a.href = url;
      a.download = nombre;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
    setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
  }

  private mensajeHttp(err: HttpErrorResponse, generico: string): string {
    const body = err.error as { message?: unknown } | string | null;
    if (typeof body === 'string' && body.trim()) {
      return body.trim();
    }
    if (body && typeof body === 'object' && typeof body.message === 'string' && body.message) {
      return body.message;
    }
    return generico;
  }

  static textoPersona(persona: BonoPersona): string {
    return persona.apellidoNombre || `${persona.apellido ?? ''}, ${persona.nombre ?? ''}`;
  }
}
