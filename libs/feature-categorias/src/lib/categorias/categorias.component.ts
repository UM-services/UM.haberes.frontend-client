import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { mensajeDeError } from '@haberes/shared-api';
import { ImportePipe } from '@haberes/ui-layout';
import { Categoria, CategoriasService } from './categorias.service';

interface CategoriaForm {
  categoriaId: number;
  nombre: string;
  basico: number;
  estadoDocente: number;
  puntos: number;
  docente: boolean;
  noDocente: boolean;
  liquidaPorHora: boolean;
}

@Component({
  selector: 'lib-categorias',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, FormsModule, ImportePipe],
  templateUrl: './categorias.component.html',
})
export class CategoriasComponent implements OnInit {
  private readonly service = inject(CategoriasService);

  readonly categorias = signal<Categoria[]>([]);
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly importando = signal(false);
  readonly error = signal('');
  readonly mensaje = signal('');
  readonly esNueva = signal(true);

  // El legacy usaba la fecha del sistema: el período no se elige en pantalla.
  private readonly anho = new Date().getFullYear();
  private readonly mes = new Date().getMonth() + 1;

  form: CategoriaForm = this.formVacio();

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.service.getCategorias().subscribe({
      next: (categorias) => {
        this.categorias.set(categorias);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(mensajeDeError(err, 'No se pudieron cargar las categorías'));
        this.cargando.set(false);
      },
    });
  }

  nueva(): void {
    this.limpiar();

    // Sugerencia inmediata con la grilla ya cargada; no depende del request.
    const ultimoLocal = this.categorias().reduce(
      (max, categoria) => Math.max(max, Number(categoria.categoriaId) || 0),
      0,
    );
    const sugerido = ultimoLocal + 1;
    this.form = { ...this.formVacio(), categoriaId: sugerido };
    this.esNueva.set(true);

    // Si la grilla está desactualizada, el backend puede tener un ID mayor.
    this.service.getLast().subscribe({
      next: (ultima) => {
        const siguiente = Math.max(ultimoLocal, Number(ultima?.categoriaId) || 0) + 1;
        if (this.esNueva() && this.form.categoriaId === sugerido) {
          this.form = { ...this.form, categoriaId: siguiente };
        }
      },
      error: () => {
        // La sugerencia local ya quedó cargada.
      },
    });
  }

  seleccionar(categoria: Categoria): void {
    this.limpiarMensajes();
    this.form = {
      categoriaId: categoria.categoriaId,
      nombre: categoria.nombre ?? '',
      basico: Number(categoria.basico ?? 0),
      estadoDocente: Number(categoria.estadoDocente ?? 0),
      puntos: Number(categoria.puntos ?? 0),
      docente: categoria.docente === 1,
      noDocente: categoria.noDocente === 1,
      liquidaPorHora: categoria.liquidaPorHora === 1,
    };
    this.esNueva.set(false);
  }

  limpiar(): void {
    this.limpiarMensajes();
    this.esNueva.set(true);
    this.form = this.formVacio();
  }

  get esCargoEtec(): boolean {
    return Number(this.form.puntos ?? 0) > 0;
  }

  /** Al cargar puntos, el cargo pasa al circuito ETEC (docente, sin básico ni hora). */
  onPuntosChange(): void {
    if (this.esCargoEtec) {
      this.form.docente = true;
      this.form.noDocente = false;
      this.form.liquidaPorHora = false;
      this.form.basico = 0;
    }
  }

  guardar(): void {
    this.limpiarMensajes();

    if (!this.form.nombre.trim()) {
      this.error.set('El nombre de la categoría es obligatorio.');
      return;
    }

    const categoriaId = Number(this.form.categoriaId);
    if (!Number.isInteger(categoriaId) || categoriaId <= 0) {
      this.error.set('La categoría debe tener un ID entero mayor a cero.');
      return;
    }
    if (this.esNueva() && this.categorias().some((categoria) => categoria.categoriaId === categoriaId)) {
      this.error.set(`La categoría ${categoriaId} ya existe. Seleccionala en la grilla para editarla.`);
      return;
    }

    const puntos = Number(this.form.puntos ?? 0);
    if (puntos < 0) {
      this.error.set('Los puntos no pueden ser negativos.');
      return;
    }

    // Un cargo con puntos (ETEC) se liquida por puntos × valor del punto: no usa
    // básico, es docente y no liquida por hora.
    if (puntos > 0) {
      this.form.docente = true;
      this.form.noDocente = false;
      this.form.liquidaPorHora = false;
      this.form.basico = 0;
    } else if (!this.form.basico || this.form.basico <= 0) {
      this.error.set('El básico debe ser mayor a cero, o el cargo debe tener puntos.');
      return;
    }

    const payload = {
      categoriaId,
      nombre: this.form.nombre.trim(),
      basico: Number(this.form.basico),
      estadoDocente: Number(this.form.estadoDocente ?? 0),
      docente: this.form.docente ? 1 : 0,
      noDocente: this.form.noDocente ? 1 : 0,
      liquidaPorHora: this.form.liquidaPorHora ? 1 : 0,
      puntos,
    };

    const request$ = this.esNueva()
      ? this.service.create(payload, this.anho, this.mes)
      : this.service.update(payload, this.anho, this.mes);

    this.guardando.set(true);
    request$.subscribe({
      next: () => {
        this.guardando.set(false);
        this.mensaje.set('Categoría guardada correctamente.');
        this.cargar();
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(mensajeDeError(err, 'No se pudo guardar la categoría'));
      },
    });
  }

  eliminar(categoria: Categoria): void {
    if (!confirm(`¿Eliminar la categoría ${categoria.categoriaId} — ${categoria.nombre}?`)) return;

    this.limpiarMensajes();
    this.service.delete(categoria.categoriaId).subscribe({
      next: () => {
        this.mensaje.set('Categoría eliminada.');
        if (this.form.categoriaId === categoria.categoriaId) this.limpiar();
        this.cargar();
      },
      error: (err) => this.error.set(mensajeDeError(err, 'No se pudo eliminar la categoría')),
    });
  }

  exportar(): void {
    this.limpiarMensajes();
    this.service.download().subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = 'categorias.xlsx';
        document.body.appendChild(enlace);
        enlace.click();
        enlace.remove();
        URL.revokeObjectURL(url);
      },
      error: (err) => this.error.set(mensajeDeError(err, 'No se pudo generar la planilla')),
    });
  }

  importar(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
    input.value = '';
    if (!archivo) return;

    const anho = this.anho;
    const mes = this.mes;

    this.limpiarMensajes();
    this.importando.set(true);

    const lector = new FileReader();
    lector.onload = () => {
      const dataUrl = String(lector.result ?? '');
      const base64 = dataUrl.includes(',') ? dataUrl.slice(dataUrl.indexOf(',') + 1) : dataUrl;

      this.service.upload({ filename: archivo.name, base64 }, anho, mes).subscribe({
        next: () => {
          this.importando.set(false);
          this.mensaje.set('Importación completada.');
          this.cargar();
        },
        error: (err) => {
          this.importando.set(false);
          this.error.set(mensajeDeError(err, 'No se pudo importar la planilla'));
        },
      });
    };
    lector.onerror = () => {
      this.importando.set(false);
      this.error.set('No se pudo leer el archivo seleccionado.');
    };
    lector.readAsDataURL(archivo);
  }

  private formVacio(): CategoriaForm {
    return {
      categoriaId: 0,
      nombre: '',
      basico: 0,
      estadoDocente: 0,
      puntos: 0,
      docente: false,
      noDocente: false,
      liquidaPorHora: false,
    };
  }

  private limpiarMensajes(): void {
    this.error.set('');
    this.mensaje.set('');
  }
}
