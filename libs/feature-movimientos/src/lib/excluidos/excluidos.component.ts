import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Persona, PersonaSearchService } from '@haberes/shared-api';
import { PersonaSearchComponent } from '@haberes/ui-layout';

import { ExcluidosService } from '../excluidos.service';
import { Excluido, ExcluidosReporte } from '../movimientos.models';
import { descargarBlob } from '../shared/descarga-archivo';
import { PeriodoNavComponent } from '../shared/periodo-nav/periodo-nav.component';

/**
 * ABM de excluidos (legacy: `frmExcluidos`). La grilla y la impresión salen del
 * reporte de excluidos, que agrega el importe del código 99 como el `rptExcluidos`.
 */
@Component({
  selector: 'haberes-excluidos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, FormsModule, PersonaSearchComponent, PeriodoNavComponent],
  templateUrl: './excluidos.component.html',
})
export class ExcluidosComponent implements OnInit {
  private readonly personas = inject(PersonaSearchService);
  private readonly service = inject(ExcluidosService);

  anho = signal(new Date().getFullYear());
  mes = signal(new Date().getMonth() + 1);

  persona = signal<Persona | null>(null);
  legajoInput = signal('');
  documentoInput = signal('');
  observaciones = signal('');

  excluidos = signal<Excluido[]>([]);
  reporte = signal<ExcluidosReporte | null>(null);
  cargando = signal(false);
  guardando = signal(false);
  descargando = signal(false);
  mensaje = signal<string | null>(null);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.service.listar(this.anho(), this.mes()).subscribe({
      next: (excluidos) => this.excluidos.set(excluidos ?? []),
      error: () => this.excluidos.set([]),
    });
    this.service.reporte(this.anho(), this.mes()).subscribe({
      next: (reporte) => {
        this.reporte.set(reporte);
        this.cargando.set(false);
      },
      error: () => {
        this.reporte.set(null);
        this.cargando.set(false);
      },
    });
  }

  onPeriodo(periodo: { anho: number; mes: number }): void {
    this.anho.set(periodo.anho);
    this.mes.set(periodo.mes);
    this.mensaje.set(null);
    this.error.set(null);
    this.cargar();
  }

  onPersonaSeleccionada(persona: Persona | null): void {
    if (!persona) {
      this.persona.set(null);
      return;
    }
    this.persona.set(persona);
    this.legajoInput.set(String(persona.legajoId));
    this.documentoInput.set(
      persona.documento === null || persona.documento === undefined ? '' : String(persona.documento),
    );
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

  agregar(): void {
    const persona = this.persona();
    if (!persona) {
      this.error.set('Seleccione un legajo.');
      return;
    }
    this.guardando.set(true);
    this.error.set(null);
    this.mensaje.set(null);
    const existente = this.excluidos().find((excluido) => excluido.legajoId === persona.legajoId);
    const excluido: Excluido = {
      legajoId: persona.legajoId,
      anho: this.anho(),
      mes: this.mes(),
      fecha: this.fechaAlta(),
      observaciones: this.observaciones().trim(),
    };
    const accion = existente?.excluidoId
      ? this.service.actualizar(excluido, existente.excluidoId)
      : this.service.crear(excluido);
    accion.subscribe({
      next: () => {
        this.mensaje.set(
          `Legajo ${persona.legajoId} ${existente ? 'actualizado' : 'agregado'} en excluidos del período.`,
        );
        this.observaciones.set('');
        this.guardando.set(false);
        this.cargar();
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(this.mensajeHttp(err, 'No se pudo guardar el excluido.'));
        this.guardando.set(false);
      },
    });
  }

  eliminar(legajoId: number): void {
    if (!confirm(`¿Quitar el legajo ${legajoId} de los excluidos del período?`)) {
      return;
    }
    this.error.set(null);
    this.mensaje.set(null);
    this.service.eliminar(legajoId, this.anho(), this.mes()).subscribe({
      next: () => {
        this.mensaje.set(`Legajo ${legajoId} eliminado de excluidos.`);
        this.cargar();
      },
      error: (err: HttpErrorResponse) =>
        this.error.set(this.mensajeHttp(err, 'No se pudo eliminar el excluido.')),
    });
  }

  descargarPdf(): void {
    this.descargar('pdf', 'excluidos.pdf');
  }

  descargarXlsx(): void {
    this.descargar('xlsx', 'excluidos.xlsx');
  }

  private descargar(formato: 'pdf' | 'xlsx', nombre: string): void {
    this.descargando.set(true);
    this.error.set(null);
    const peticion = formato === 'pdf' ? this.service.pdf(this.anho(), this.mes()) : this.service.xlsx(this.anho(), this.mes());
    peticion.subscribe({
      next: (blob) => {
        descargarBlob(blob, nombre);
        this.descargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(this.mensajeHttp(err, `No se pudo generar el ${formato.toUpperCase()} de excluidos.`));
        this.descargando.set(false);
      },
    });
  }

  private fechaAlta(): string {
    const hoy = new Date();
    const dos = (valor: number) => String(valor).padStart(2, '0');
    return `${hoy.getFullYear()}-${dos(hoy.getMonth() + 1)}-${dos(hoy.getDate())}T00:00:00Z`;
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
