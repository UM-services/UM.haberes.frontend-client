import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Persona, PersonaSearchService } from '@haberes/shared-api';
import { InputFechaComponent, PersonaSearchComponent } from '@haberes/ui-layout';

import { AcreditacionArchivoService } from '../acreditacion-archivo.service';
import { Banco, FilaAcreditacion, RechazoAcreditacion } from '../movimientos.models';
import { descargarBase64 } from '../shared/descarga-archivo';
import { PeriodoNavComponent } from '../shared/periodo-nav/periodo-nav.component';
import { RechazosGridComponent } from '../shared/rechazos-grid/rechazos-grid.component';

interface Seleccionado {
  legajoId: number;
  cbu: string;
  acreditado: number;
  apellidoNombre: string;
}

/**
 * Emisión individual (legacy: `frmGenSantanderInd` / `frmGenOtrosBancosInd`).
 * La colección vive en memoria: el importe editado viaja en el archivo y no se
 * persiste en `legajo_banco` (ajuste manual, igual que el legacy).
 */
@Component({
  selector: 'haberes-archivo-individual',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    CommonModule,
    FormsModule,
    InputFechaComponent,
    PersonaSearchComponent,
    PeriodoNavComponent,
    RechazosGridComponent,
  ],
  templateUrl: './archivo-individual.component.html',
})
export class ArchivoIndividualComponent {
  readonly banco = input.required<Banco>();

  private readonly personas = inject(PersonaSearchService);
  private readonly service = inject(AcreditacionArchivoService);

  readonly esOtrosBancos = computed(() => this.banco() === 'otrosbancos');

  anho = signal(new Date().getFullYear());
  mes = signal(new Date().getMonth() + 1);
  fechaPago = signal(this.hoyIso());
  numEnvio = signal(1);
  cci = signal(false);

  persona = signal<Persona | null>(null);
  legajoInput = signal('');
  documentoInput = signal('');

  preparando = signal(false);
  filas = signal<FilaAcreditacion[]>([]);
  cbuSeleccionado = signal('');
  acreditado = signal<number | null>(null);

  seleccionados = signal<Seleccionado[]>([]);
  generando = signal(false);
  rechazos = signal<RechazoAcreditacion[]>([]);
  mensaje = signal<string | null>(null);
  error = signal<string | null>(null);

  readonly cbus = computed(() =>
    this.filas()
      .filter((fila) =>
        this.esOtrosBancos() ? !fila.cbu.startsWith('072') : fila.cbu.startsWith('072'),
      )
      .map((fila) => fila.cbu),
  );

  onPeriodo(periodo: { anho: number; mes: number }): void {
    this.anho.set(periodo.anho);
    this.mes.set(periodo.mes);
    this.limpiarSeleccion();
  }

  onPersonaSeleccionada(persona: Persona | null): void {
    if (!persona) {
      this.persona.set(null);
      this.filas.set([]);
      this.cbuSeleccionado.set('');
      this.acreditado.set(null);
      return;
    }
    this.persona.set(persona);
    this.legajoInput.set(String(persona.legajoId));
    this.documentoInput.set(
      persona.documento === null || persona.documento === undefined ? '' : String(persona.documento),
    );
    this.preparar();
  }

  buscarPorLegajo(): void {
    const texto = this.legajoInput().trim();
    if (!/^\d+$/.test(texto) || this.persona()?.legajoId === Number(texto)) {
      return;
    }
    this.personas.getPersonaByLegajo(Number(texto)).subscribe({
      next: (persona) => this.onPersonaSeleccionada(persona),
      error: (err: HttpErrorResponse) =>
        this.error.set(this.mensajeHttp(err, `No se encontró personal con legajo ${texto}.`)),
    });
  }

  buscarPorDocumento(): void {
    const texto = this.documentoInput().trim();
    if (!/^\d+$/.test(texto) || String(this.persona()?.documento ?? '') === texto) {
      return;
    }
    this.personas.getPersonaByDocumento(texto).subscribe({
      next: (persona) => this.onPersonaSeleccionada(persona),
      error: (err: HttpErrorResponse) =>
        this.error.set(this.mensajeHttp(err, `No se encontró personal con documento ${texto}.`)),
    });
  }

  preparar(): void {
    const persona = this.persona();
    if (!persona) {
      return;
    }
    this.preparando.set(true);
    this.error.set(null);
    this.mensaje.set(null);
    this.service.prepararLegajo(persona.legajoId, this.anho(), this.mes()).subscribe({
      next: (preparacion) => {
        this.filas.set(preparacion.filas ?? []);
        const cbu = this.cbus()[0] ?? '';
        this.cbuSeleccionado.set(cbu);
        this.acreditado.set(this.importeDe(cbu));
        this.preparando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.filas.set([]);
        this.cbuSeleccionado.set('');
        this.acreditado.set(null);
        this.error.set(this.mensajeHttp(err, 'No se pudieron preparar los CBUs del legajo.'));
        this.preparando.set(false);
      },
    });
  }

  onCbuSeleccionado(cbu: string): void {
    this.cbuSeleccionado.set(cbu);
    this.acreditado.set(this.importeDe(cbu));
  }

  agregar(): void {
    this.error.set(null);
    const persona = this.persona();
    const cbu = this.cbuSeleccionado();
    const acreditado = this.acreditado();
    if (!persona) {
      this.error.set('Seleccione un legajo.');
      return;
    }
    if (!cbu) {
      this.error.set('Seleccione un CBU.');
      return;
    }
    if (acreditado === null || acreditado <= 0) {
      this.error.set('El importe a acreditar debe ser mayor a cero.');
      return;
    }
    if (this.seleccionados().some((fila) => fila.legajoId === persona.legajoId && fila.cbu === cbu)) {
      this.error.set('Ese legajo y CBU ya están en la lista.');
      return;
    }
    this.seleccionados.update((filas) => [
      ...filas,
      {
        legajoId: persona.legajoId,
        cbu,
        acreditado,
        apellidoNombre: `${persona.apellido}, ${persona.nombre}`,
      },
    ]);
    this.acreditado.set(null);
  }

  quitar(index: number): void {
    this.seleccionados.update((filas) => filas.filter((_, i) => i !== index));
  }

  generar(): void {
    this.error.set(null);
    this.mensaje.set(null);
    this.rechazos.set([]);
    if (this.seleccionados().length === 0) {
      this.error.set('Agregue al menos un legajo con CBU e importe.');
      return;
    }
    this.generando.set(true);
    this.service
      .generar(this.banco(), {
        anho: this.anho(),
        mes: this.mes(),
        fechaPago: this.fechaPago(),
        numEnvio: this.numEnvio() || 1,
        cci: this.esOtrosBancos() ? this.cci() : false,
        individual: true,
        legajos: this.seleccionados().map((fila) => ({
          legajoId: fila.legajoId,
          cbu: fila.cbu,
          acreditado: fila.acreditado,
        })),
      })
      .subscribe({
        next: (respuesta) => {
          descargarBase64(respuesta.contenido, respuesta.nombreArchivo);
          this.rechazos.set(respuesta.rechazos ?? []);
          this.mensaje.set(
            `Archivo ${respuesta.nombreArchivo}: ${respuesta.cantidad} legajos por ${this.importe(
              respuesta.total,
            )}.`,
          );
          this.generando.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.error.set(this.mensajeHttp(err, 'No se pudo generar el archivo bancario.'));
          this.generando.set(false);
        },
      });
  }

  importe(valor: number | null | undefined): string {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(valor ?? 0);
  }

  private importeDe(cbu: string): number | null {
    const fila = this.filas().find((f) => f.cbu === cbu);
    return fila?.acreditado ?? null;
  }

  private limpiarSeleccion(): void {
    this.seleccionados.set([]);
    this.rechazos.set([]);
    this.mensaje.set(null);
    this.error.set(null);
    this.filas.set([]);
    this.cbuSeleccionado.set('');
    this.acreditado.set(null);
  }

  private hoyIso(): string {
    const hoy = new Date();
    return `${hoy.getFullYear()}-${this.dos(hoy.getMonth() + 1)}-${this.dos(hoy.getDate())}`;
  }

  private dos(valor: number): string {
    return String(valor).padStart(2, '0');
  }

  private mensajeHttp(err: HttpErrorResponse, generico: string): string {
    const body = err.error as { message?: unknown; detail?: unknown } | string | null;
    if (typeof body === 'string' && body.trim()) {
      return body.trim();
    }
    if (body && typeof body === 'object') {
      if (typeof body.detail === 'string' && body.detail) {
        return body.detail;
      }
      if (typeof body.message === 'string' && body.message) {
        return body.message;
      }
    }
    return generico;
  }
}
