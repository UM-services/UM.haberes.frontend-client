import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { mensajeDeError } from '@haberes/shared-api';
import { Sede, SedesService } from './sedes.service';

@Component({
  selector: 'lib-sedes',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, FormsModule],
  templateUrl: './sedes.component.html',
})
export class SedesComponent implements OnInit {
  private readonly service = inject(SedesService);

  readonly sedes = signal<Sede[]>([]);
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly error = signal('');
  readonly mensaje = signal('');
  readonly haySeleccion = signal(false);

  form = {
    geograficaId: 0,
    nombre: '',
    reducido: '',
    desarraigo: 0,
    geograficaIdReemplazo: null as number | null,
  };

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.service.getSedes().subscribe({
      next: (sedes) => {
        this.sedes.set(sedes);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(mensajeDeError(err, 'No se pudieron cargar las sedes'));
        this.cargando.set(false);
      },
    });
  }

  seleccionar(sede: Sede): void {
    this.limpiarMensajes();
    this.form = {
      geograficaId: sede.geograficaId,
      nombre: sede.nombre ?? '',
      reducido: sede.reducido ?? '',
      desarraigo: Number(sede.desarraigo ?? 0),
      geograficaIdReemplazo: sede.geograficaIdReemplazo ?? null,
    };
    this.haySeleccion.set(true);
  }

  guardar(): void {
    this.limpiarMensajes();

    if (!this.haySeleccion()) {
      this.error.set('Seleccione una sede para editarla.');
      return;
    }
    if (!this.form.nombre.trim()) {
      this.error.set('El nombre de la sede es obligatorio.');
      return;
    }

    const payload = {
      nombre: this.form.nombre.trim(),
      reducido: this.form.reducido.trim() || null,
      desarraigo: Number(this.form.desarraigo ?? 0),
      geograficaIdReemplazo: this.form.geograficaIdReemplazo,
    };

    this.guardando.set(true);
    this.service.update(this.form.geograficaId, payload).subscribe({
      next: (sede) => {
        this.guardando.set(false);
        this.mensaje.set('Sede actualizada correctamente.');
        this.seleccionar(sede);
        this.cargar();
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(mensajeDeError(err, 'No se pudo guardar la sede'));
      },
    });
  }

  sedesReemplazo(): Sede[] {
    return this.sedes().filter((sede) => sede.geograficaId !== this.form.geograficaId);
  }

  nombreSede(geograficaId: number | null | undefined): string {
    if (!geograficaId) return 'Sin reemplazo';
    return (
      this.sedes().find((sede) => sede.geograficaId === geograficaId)?.nombre ?? `#${geograficaId}`
    );
  }

  private limpiarMensajes(): void {
    this.error.set('');
    this.mensaje.set('');
  }
}
