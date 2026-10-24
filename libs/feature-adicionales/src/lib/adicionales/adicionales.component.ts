import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { mensajeDeError, periodoTexto } from '@haberes/shared-api';
import { AdicionalRango, AdicionalTabla, AdicionalesService } from './adicionales.service';

@Component({
  selector: 'lib-adicionales',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, FormsModule],
  templateUrl: './adicionales.component.html',
})
export class AdicionalesComponent implements OnInit {
  private readonly service = inject(AdicionalesService);

  readonly tablas = signal<AdicionalTabla[]>([]);
  readonly rangos = signal<AdicionalRango[]>([]);
  readonly seleccionada = signal<AdicionalTabla | null>(null);

  readonly cargando = signal(false);
  readonly cargandoRangos = signal(false);
  readonly guardando = signal(false);
  readonly error = signal('');
  readonly mensaje = signal('');

  form = { horasDesde: 0, horasHasta: 0, porcentaje: 0 };

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.service.getTablas().subscribe({
      next: (tablas) => {
        this.tablas.set(tablas);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(mensajeDeError(err, 'No se pudieron cargar las tablas de adicional'));
        this.cargando.set(false);
      },
    });
  }

  seleccionar(tabla: AdicionalTabla): void {
    this.limpiarMensajes();
    this.seleccionada.set(tabla);
    this.form = { horasDesde: 0, horasHasta: 0, porcentaje: 0 };

    this.cargandoRangos.set(true);
    this.service.getRangos(tabla.adicionalCursoTablaId).subscribe({
      next: (rangos) => {
        this.rangos.set(rangos);
        this.cargandoRangos.set(false);
      },
      error: (err) => {
        this.rangos.set([]);
        this.cargandoRangos.set(false);
        this.error.set(mensajeDeError(err, 'No se pudieron cargar los rangos'));
      },
    });
  }

  agregar(): void {
    this.limpiarMensajes();
    const tabla = this.seleccionada();
    if (!tabla) {
      this.error.set('Seleccione una tabla de adicional.');
      return;
    }

    const horasDesde = Number(this.form.horasDesde ?? 0);
    const horasHasta = Number(this.form.horasHasta ?? 0);
    const porcentaje = Number(this.form.porcentaje ?? 0);

    if (horasDesde === 0 && horasHasta === 0) {
      this.error.set('Ingrese el rango de horas.');
      return;
    }
    if (horasHasta < horasDesde) {
      this.error.set('Las horas hasta no pueden ser menores que las horas desde.');
      return;
    }
    if (porcentaje < 0) {
      this.error.set('El porcentaje no puede ser negativo.');
      return;
    }

    this.guardando.set(true);
    this.service
      .addRango({
        horasDesde,
        horasHasta,
        porcentaje,
        adicionalCursoTablaId: tabla.adicionalCursoTablaId,
      })
      .subscribe({
        next: () => {
          this.guardando.set(false);
          this.form = { horasDesde: 0, horasHasta: 0, porcentaje: 0 };
          this.seleccionar(tabla);
          this.cargar();
          this.mensaje.set('Rango agregado.');
        },
        error: (err) => {
          this.guardando.set(false);
          this.error.set(mensajeDeError(err, 'No se pudo agregar el rango'));
        },
      });
  }

  eliminar(rango: AdicionalRango): void {
    if (!confirm(`¿Eliminar el rango ${rango.horasDesde}–${rango.horasHasta} horas?`)) return;

    this.limpiarMensajes();
    this.service.deleteRango(rango.adicionalCursoRangoId).subscribe({
      next: () => {
        const tabla = this.seleccionada();
        if (tabla) this.seleccionar(tabla);
        this.cargar();
        this.mensaje.set('Rango eliminado.');
      },
      error: (err) => this.error.set(mensajeDeError(err, 'No se pudo eliminar el rango')),
    });
  }

  facultad(tabla: AdicionalTabla): string {
    return tabla.facultad?.nombre ?? (tabla.facultadId ? `#${tabla.facultadId}` : '—');
  }

  sede(tabla: AdicionalTabla): string {
    return tabla.geografica?.nombre ?? (tabla.geograficaId ? `#${tabla.geograficaId}` : 'Todas');
  }

  textoPeriodo(valor: number): string {
    return periodoTexto(valor);
  }

  private limpiarMensajes(): void {
    this.error.set('');
    this.mensaje.set('');
  }
}
