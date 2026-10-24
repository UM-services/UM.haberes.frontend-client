import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { mensajeDeError, periodoTexto } from '@haberes/shared-api';
import { CargoClase, CargoClaseDetalle, CargosClaseService, Clase } from './cargos-clase.service';

@Component({
  selector: 'lib-cargos-clase',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, FormsModule],
  templateUrl: './cargos-clase.component.html',
})
export class CargosClaseComponent implements OnInit {
  private readonly service = inject(CargosClaseService);

  readonly cargos = signal<CargoClase[]>([]);
  readonly clases = signal<Clase[]>([]);
  readonly detalle = signal<CargoClaseDetalle[]>([]);

  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly cargandoDetalle = signal(false);
  readonly error = signal('');
  readonly mensaje = signal('');
  readonly esNuevo = signal(true);
  readonly haySeleccion = signal(false);

  readonly anho = signal(new Date().getFullYear());
  readonly mes = signal(new Date().getMonth() + 1);

  form: CargoClase = { cargoClaseId: null, nombre: '', claseId: null };

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    forkJoin({
      cargos: this.service.getCargos(),
      clases: this.service.getClases(),
    }).subscribe({
      next: ({ cargos, clases }) => {
        this.cargos.set(cargos);
        this.clases.set(clases);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(mensajeDeError(err, 'No se pudieron cargar los cargos con clase'));
        this.cargando.set(false);
      },
    });
  }

  nuevo(): void {
    this.limpiarMensajes();
    this.form = { cargoClaseId: null, nombre: '', claseId: null };
    this.esNuevo.set(true);
    this.haySeleccion.set(false);
    this.detalle.set([]);
  }

  seleccionar(cargo: CargoClase): void {
    this.limpiarMensajes();
    this.form = {
      cargoClaseId: cargo.cargoClaseId,
      nombre: cargo.nombre ?? '',
      claseId: cargo.claseId ?? null,
    };
    this.esNuevo.set(false);
    this.haySeleccion.set(true);
    this.cargarDetalle();
  }

  guardar(): void {
    this.limpiarMensajes();

    if (!this.form.nombre.trim()) {
      this.error.set('El nombre del cargo es obligatorio.');
      return;
    }
    if (!this.form.claseId) {
      this.error.set('Debe seleccionar una clase.');
      return;
    }

    const payload: CargoClase = {
      cargoClaseId: this.form.cargoClaseId,
      nombre: this.form.nombre.trim(),
      claseId: Number(this.form.claseId),
    };

    const request$ =
      this.esNuevo() || !payload.cargoClaseId
        ? this.service.create(payload)
        : this.service.update(payload.cargoClaseId, payload);

    this.guardando.set(true);
    request$.subscribe({
      next: (guardado) => {
        this.guardando.set(false);
        this.form = {
          cargoClaseId: guardado.cargoClaseId,
          nombre: guardado.nombre,
          claseId: guardado.claseId,
        };
        this.esNuevo.set(false);
        this.haySeleccion.set(true);
        this.mensaje.set('Cargo con clase guardado correctamente.');
        this.cargar();
        this.cargarDetalle();
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(mensajeDeError(err, 'No se pudo guardar el cargo con clase'));
      },
    });
  }

  cambiarMes(incremento: number): void {
    let mes = this.mes() + incremento;
    let anho = this.anho();
    if (mes > 12) {
      mes = 1;
      anho += 1;
    }
    if (mes < 1) {
      mes = 12;
      anho -= 1;
    }
    this.mes.set(mes);
    this.anho.set(anho);
    if (this.haySeleccion()) this.cargarDetalle();
  }

  nombrePersona(fila: CargoClaseDetalle): string {
    const persona = fila.persona;
    if (!persona) return `Legajo ${fila.legajoId}`;
    if (persona.apellidoNombre) return persona.apellidoNombre;
    const compuesto = [persona.apellido, persona.nombre].filter(Boolean).join(', ');
    return compuesto || `Legajo ${fila.legajoId}`;
  }

  periodo(fila: CargoClaseDetalle, desde: boolean): string {
    const periodo = desde
      ? fila.cargoClasePeriodo?.periodoDesde
      : fila.cargoClasePeriodo?.periodoHasta;
    return periodoTexto(periodo);
  }

  private cargarDetalle(): void {
    const cargoClaseId = this.form.cargoClaseId;
    if (!cargoClaseId) {
      this.detalle.set([]);
      return;
    }

    this.cargandoDetalle.set(true);
    this.service.getDetalle(cargoClaseId, this.anho(), this.mes()).subscribe({
      next: (detalle) => {
        this.detalle.set(detalle);
        this.cargandoDetalle.set(false);
      },
      error: (err) => {
        this.detalle.set([]);
        this.cargandoDetalle.set(false);
        this.error.set(mensajeDeError(err, 'No se pudo cargar el detalle del período'));
      },
    });
  }

  private limpiarMensajes(): void {
    this.error.set('');
    this.mensaje.set('');
  }
}
