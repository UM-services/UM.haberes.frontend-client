import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { mensajeDeError } from '@haberes/shared-api';
import { Clase, ClasesService } from './clases.service';

@Component({
  selector: 'lib-clases',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, FormsModule],
  templateUrl: './clases.component.html',
})
export class ClasesComponent implements OnInit {
  private readonly service = inject(ClasesService);

  readonly clases = signal<Clase[]>([]);
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly error = signal('');
  readonly mensaje = signal('');
  readonly esNueva = signal(true);

  form: Clase = { claseId: 0, nombre: '', valorHora: 0 };

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.service.getClases().subscribe({
      next: (clases) => {
        this.clases.set(clases);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(mensajeDeError(err, 'No se pudieron cargar las clases'));
        this.cargando.set(false);
      },
    });
  }

  nueva(): void {
    this.limpiar();
    this.service.getLast().subscribe({
      next: (ultima) => {
        this.form = { claseId: (ultima?.claseId ?? 0) + 1, nombre: '', valorHora: 0 };
        this.esNueva.set(true);
      },
      error: () => {
        // Sin última clase (tabla vacía): el id arranca en 1.
        this.form = { claseId: 1, nombre: '', valorHora: 0 };
        this.esNueva.set(true);
      },
    });
  }

  seleccionar(clase: Clase): void {
    this.limpiarMensajes();
    this.form = { ...clase };
    this.esNueva.set(false);
  }

  limpiar(): void {
    this.limpiarMensajes();
    this.esNueva.set(true);
    this.form = { claseId: 0, nombre: '', valorHora: 0 };
  }

  guardar(): void {
    this.limpiarMensajes();

    if (!this.form.nombre.trim()) {
      this.error.set('El nombre de la clase es obligatorio.');
      return;
    }
    if (!this.form.valorHora || this.form.valorHora <= 0) {
      this.error.set('El valor hora debe ser mayor a cero.');
      return;
    }

    const payload: Clase = {
      claseId: this.form.claseId,
      nombre: this.form.nombre.trim(),
      valorHora: Number(this.form.valorHora),
    };

    const request$ = this.esNueva()
      ? this.service.create(payload)
      : this.service.update(payload.claseId, payload);

    this.guardando.set(true);
    request$.subscribe({
      next: () => {
        this.guardando.set(false);
        this.mensaje.set('Clase guardada correctamente.');
        this.cargar();
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(mensajeDeError(err, 'No se pudo guardar la clase'));
      },
    });
  }

  eliminar(clase: Clase): void {
    if (!confirm(`¿Eliminar la clase ${clase.claseId} — ${clase.nombre}?`)) return;

    this.limpiarMensajes();
    this.service.delete(clase.claseId).subscribe({
      next: () => {
        this.mensaje.set('Clase eliminada.');
        if (this.form.claseId === clase.claseId) this.limpiar();
        this.cargar();
      },
      error: (err) => this.error.set(mensajeDeError(err, 'No se pudo eliminar la clase')),
    });
  }

  private limpiarMensajes(): void {
    this.error.set('');
    this.mensaje.set('');
  }
}
