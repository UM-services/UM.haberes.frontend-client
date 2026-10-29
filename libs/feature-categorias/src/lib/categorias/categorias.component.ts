import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { mensajeDeError } from '@haberes/shared-api';
import { Categoria, CategoriasService } from './categorias.service';

interface CategoriaForm {
  categoriaId: number;
  nombre: string;
  basico: number;
  estadoDocente: number;
  docente: boolean;
  noDocente: boolean;
  liquidaPorHora: boolean;
}

@Component({
  selector: 'lib-categorias',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, FormsModule],
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

  readonly anho = signal(new Date().getFullYear());
  readonly mes = signal(new Date().getMonth() + 1);

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
    this.service.getLast().subscribe({
      next: (ultima) => {
        this.form = { ...this.formVacio(), categoriaId: (ultima?.categoriaId ?? 0) + 1 };
        this.esNueva.set(true);
      },
      error: () => {
        this.form = { ...this.formVacio(), categoriaId: 1 };
        this.esNueva.set(true);
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

  guardar(): void {
    this.limpiarMensajes();

    if (!this.form.nombre.trim()) {
      this.error.set('El nombre de la categoría es obligatorio.');
      return;
    }
    if (!this.form.basico || this.form.basico <= 0) {
      this.error.set('El básico debe ser mayor a cero.');
      return;
    }

    const anho = Number(this.anho());
    const mes = Number(this.mes());
    if (!anho || anho < 2000 || !mes || mes < 1 || mes > 12) {
      this.error.set('El período debe tener un año válido y un mes entre 1 y 12.');
      return;
    }

    const payload = {
      categoriaId: this.form.categoriaId,
      nombre: this.form.nombre.trim(),
      basico: Number(this.form.basico),
      estadoDocente: Number(this.form.estadoDocente ?? 0),
      docente: this.form.docente ? 1 : 0,
      noDocente: this.form.noDocente ? 1 : 0,
      liquidaPorHora: this.form.liquidaPorHora ? 1 : 0,
    };

    const request$ = this.esNueva()
      ? this.service.create(payload, anho, mes)
      : this.service.update(payload, anho, mes);

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

    const anho = Number(this.anho());
    const mes = Number(this.mes());
    if (!anho || anho < 2000 || !mes || mes < 1 || mes > 12) {
      this.error.set('El período debe tener un año válido y un mes entre 1 y 12.');
      return;
    }

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
