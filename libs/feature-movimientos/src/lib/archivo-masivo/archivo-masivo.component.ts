import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { API_URL } from '@haberes/shared-api';
import { InputFechaComponent } from '@haberes/ui-layout';

import { AcreditacionArchivoService } from '../acreditacion-archivo.service';
import {
  Banco,
  Codigo,
  Dependencia,
  RechazoAcreditacion,
} from '../movimientos.models';
import { descargarBase64 } from '../shared/descarga-archivo';
import { PeriodoNavComponent } from '../shared/periodo-nav/periodo-nav.component';
import { RechazosGridComponent } from '../shared/rechazos-grid/rechazos-grid.component';

/**
 * Generación masiva del archivo de acreditación (legacy: `frmGenSantander` y
 * `frmGenOtrosBcos`). Cambia sólo el banco: acuerdo, forma de pago y CCI.
 */
@Component({
  selector: 'haberes-archivo-masivo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    CommonModule,
    FormsModule,
    InputFechaComponent,
    PeriodoNavComponent,
    RechazosGridComponent,
  ],
  templateUrl: './archivo-masivo.component.html',
})
export class ArchivoMasivoComponent implements OnInit {
  readonly banco = input.required<Banco>();

  private readonly http = inject(HttpClient);
  private readonly service = inject(AcreditacionArchivoService);
  private readonly apiBase = inject(API_URL, { optional: true }) || '/api/haberes';

  readonly esOtrosBancos = computed(() => this.banco() === 'otrosbancos');

  anho = signal(new Date().getFullYear());
  mes = signal(new Date().getMonth() + 1);
  fechaPago = signal(this.hoyIso());
  numEnvio = signal(1);

  administrativos = signal(false);
  docentes = signal(false);

  dependencias = signal<Dependencia[]>([]);
  dependenciaId = signal(0);

  soloCodigo = signal(false);
  codigoBusqueda = signal('');
  codigos = signal<Codigo[]>([]);
  codigoId = signal<number | null>(null);

  cci = signal(false);

  generando = signal(false);
  eliminando = signal(false);
  rechazos = signal<RechazoAcreditacion[]>([]);
  mensaje = signal<string | null>(null);
  error = signal<string | null>(null);

  readonly salida = computed(() => {
    const adm = this.administrativos();
    const doc = this.docentes();
    if (adm && !doc) {
      return 'A';
    }
    if (doc && !adm) {
      return 'D';
    }
    return 'T';
  });

  ngOnInit(): void {
    this.cargarDependencias();
  }

  cargarDependencias(): void {
    this.http.get<Dependencia[]>(`${this.apiBase}/core/dependencia/`).subscribe({
      next: (dependencias) => this.dependencias.set(dependencias ?? []),
      error: () => this.dependencias.set([]),
    });
  }

  onPeriodo(periodo: { anho: number; mes: number }): void {
    this.anho.set(periodo.anho);
    this.mes.set(periodo.mes);
    this.rechazos.set([]);
    this.mensaje.set(null);
    this.error.set(null);
  }

  buscarCodigos(): void {
    const texto = this.codigoBusqueda().trim();
    if (texto.length < 2) {
      this.codigos.set([]);
      return;
    }
    this.http
      .get<Codigo[]>(`${this.apiBase}/core/codigo/search/${encodeURIComponent(texto)}`)
      .subscribe({
        next: (codigos) => this.codigos.set(codigos ?? []),
        error: () => this.codigos.set([]),
      });
  }

  onCodigoSeleccionado(valor: number | string): void {
    const codigoId = Number(valor);
    this.codigoId.set(Number.isInteger(codigoId) && codigoId > 0 ? codigoId : null);
  }

  onSoloCodigo(marcado: boolean): void {
    this.soloCodigo.set(marcado);
    if (!marcado) {
      this.codigoId.set(null);
      this.codigos.set([]);
      this.codigoBusqueda.set('');
    }
  }

  generar(): void {
    this.error.set(null);
    this.mensaje.set(null);
    this.rechazos.set([]);

    if (!this.fechaPago()) {
      this.error.set('Debe indicar la fecha de pago.');
      return;
    }
    if (this.soloCodigo() && !this.codigoId()) {
      this.error.set('Seleccione el código de novedades.');
      return;
    }

    this.generando.set(true);
    this.service
      .generar(this.banco(), {
        anho: this.anho(),
        mes: this.mes(),
        fechaPago: this.fechaPago(),
        numEnvio: this.numEnvio() || 1,
        salida: this.salida(),
        dependenciaId: this.dependenciaId() || 0,
        codigoId: this.soloCodigo() ? this.codigoId() ?? 0 : 0,
        cci: this.esOtrosBancos() ? this.cci() : false,
        individual: false,
      })
      .subscribe({
        next: (respuesta) => {
          descargarBase64(respuesta.contenido, respuesta.nombreArchivo);
          this.rechazos.set(respuesta.rechazos ?? []);
          this.mensaje.set(
            `Archivo ${respuesta.nombreArchivo}: ${respuesta.cantidad} legajos por ${this.importe(
              respuesta.total,
            )}.${respuesta.periodoAcreditado ? ' El período quedó marcado como acreditado.' : ''}`,
          );
          this.generando.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.error.set(this.mensajeHttp(err, 'No se pudo generar el archivo bancario.'));
          this.generando.set(false);
        },
      });
  }

  eliminarPeriodo(): void {
    if (
      !confirm(
        `¿Eliminar todos los CBUs preparados del período ${this.mes()}/${this.anho()}? ` +
          'Las liquidaciones ya acreditadas no se revierten.',
      )
    ) {
      return;
    }
    this.eliminando.set(true);
    this.error.set(null);
    this.mensaje.set(null);
    this.service.eliminarPeriodo(this.anho(), this.mes()).subscribe({
      next: () => {
        this.mensaje.set('CBUs del período eliminados.');
        this.rechazos.set([]);
        this.eliminando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(this.mensajeHttp(err, 'No se pudieron eliminar los CBUs del período.'));
        this.eliminando.set(false);
      },
    });
  }

  importe(valor: number | null | undefined): string {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(valor ?? 0);
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
