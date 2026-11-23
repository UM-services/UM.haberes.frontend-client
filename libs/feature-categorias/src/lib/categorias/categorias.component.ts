import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, catchError, debounceTime, merge, of, switchMap, tap } from 'rxjs';
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
  etecHoras: boolean;
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
  private readonly destroyRef = inject(DestroyRef);

  readonly filas = signal<Categoria[]>([]);
  readonly total = signal(0);
  readonly pagina = signal(0);
  readonly filtroTexto = signal('');
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly importando = signal(false);
  readonly error = signal('');
  readonly mensaje = signal('');
  readonly esNueva = signal(true);

  /** Filas por página del buscador (contrato de `POST /categoria/search`). */
  readonly tamano = 50;

  readonly inicioRango = computed(() =>
    this.total() === 0 ? 0 : this.pagina() * this.tamano + 1,
  );
  readonly finRango = computed(() => this.pagina() * this.tamano + this.filas().length);
  readonly hayPaginaAnterior = computed(() => this.pagina() > 0);
  readonly hayPaginaSiguiente = computed(() => (this.pagina() + 1) * this.tamano < this.total());
  readonly hayFiltro = computed(() => this.filtroTexto().trim().length > 0);

  private readonly recargar$ = new Subject<void>();
  private readonly texto$ = new Subject<void>();

  // El legacy usaba la fecha del sistema: el período no se elige en pantalla.
  private readonly anho = new Date().getFullYear();
  private readonly mes = new Date().getMonth() + 1;

  form: CategoriaForm = this.formVacio();

  constructor() {
    merge(this.texto$.pipe(debounceTime(300)), this.recargar$)
      .pipe(
        tap(() => {
          this.error.set('');
          this.cargando.set(true);
        }),
        switchMap(() =>
          this.service
            .search({
              texto: this.filtroTexto().trim(),
              pagina: this.pagina(),
              tamano: this.tamano,
            })
            .pipe(
              catchError((err) => {
                this.error.set(mensajeDeError(err, 'No se pudieron cargar las categorías'));
                this.filas.set([]);
                this.total.set(0);
                return of(null);
              }),
            ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((page) => {
        this.cargando.set(false);
        if (!page) return;

        // La página quedó fuera de rango (p. ej. se borró su última fila): ir a la última válida.
        if (page.filas.length === 0 && page.pagina > 0 && page.total > 0) {
          this.pagina.set(Math.max(Math.ceil(page.total / this.tamano) - 1, 0));
          this.recargar$.next();
          return;
        }

        this.filas.set(page.filas);
        this.total.set(page.total);
      });
  }

  ngOnInit(): void {
    this.cargar();
  }

  /** Repite la búsqueda con el texto y la página vigentes. */
  cargar(): void {
    this.recargar$.next();
  }

  onFiltro(texto: string): void {
    this.filtroTexto.set(texto);
    this.pagina.set(0);
    this.texto$.next();
  }

  limpiarFiltro(): void {
    this.filtroTexto.set('');
    this.pagina.set(0);
    this.recargar$.next();
  }

  irPagina(delta: number): void {
    const destino = this.pagina() + delta;
    if (destino < 0 || destino * this.tamano >= this.total()) return;
    this.pagina.set(destino);
    this.recargar$.next();
  }

  nueva(): void {
    this.limpiar();

    // El ID se sugiere con el último del backend: la grilla es una página, no el catálogo.
    const provisional = 0;
    this.form = { ...this.formVacio(), categoriaId: provisional };
    this.esNueva.set(true);

    this.service.getLast().subscribe({
      next: (ultima) => {
        if (!this.esNueva() || this.form.categoriaId !== provisional) return;
        this.form = { ...this.form, categoriaId: Number(ultima?.categoriaId ?? 0) + 1 };
      },
      error: () => {
        // Sin sugerencia: el ID se puede cargar a mano.
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
      etecHoras: categoria.etecHoras === 1,
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
      this.form.etecHoras = false;
      this.form.basico = 0;
    }
  }

  /** Una categoría de horas ETEC no lleva básico, puntos ni jornada: la escala define el importe. */
  onEtecHorasChange(): void {
    if (this.form.etecHoras) {
      this.form.docente = true;
      this.form.noDocente = false;
      this.form.liquidaPorHora = false;
      this.form.puntos = 0;
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

    const puntos = Number(this.form.puntos ?? 0);
    if (puntos < 0) {
      this.error.set('Los puntos no pueden ser negativos.');
      return;
    }

    if (this.form.etecHoras) {
      // La categoría de horas ETEC liquida por la escala de horas: no usa básico ni puntos.
      this.form.docente = true;
      this.form.noDocente = false;
      this.form.liquidaPorHora = false;
      this.form.puntos = 0;
      this.form.basico = 0;
    } else if (puntos > 0) {
      // Un cargo con puntos (ETEC) se liquida por puntos × valor del punto: no usa
      // básico, es docente y no liquida por hora.
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
      puntos: this.form.etecHoras ? 0 : puntos,
      etecHoras: this.form.etecHoras ? 1 : 0,
    };

    const esNueva = this.esNueva();
    const request$ = esNueva
      ? this.service.create(payload, this.anho, this.mes)
      : this.service.update(payload, this.anho, this.mes);

    this.guardando.set(true);
    request$.subscribe({
      next: () => {
        this.guardando.set(false);
        this.mensaje.set('Categoría guardada correctamente.');
        if (esNueva) this.pagina.set(0);
        this.cargar();
      },
      error: (err) => {
        this.guardando.set(false);
        // El backend valida la duplicación del ID (la grilla ya no trae todo el catálogo).
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
        if (this.filas().length === 1 && this.pagina() > 0) this.pagina.set(this.pagina() - 1);
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
      etecHoras: false,
    };
  }

  private limpiarMensajes(): void {
    this.error.set('');
    this.mensaje.set('');
  }
}
