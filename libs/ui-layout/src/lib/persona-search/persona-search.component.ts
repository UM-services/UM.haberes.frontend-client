import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, catchError, debounceTime, distinctUntilChanged, of, switchMap, tap } from 'rxjs';

import { Persona, PersonaSearchService, textoPersona } from '@haberes/shared-api';

let personaSearchSecuencial = 0;

/**
 * Buscador estándar de personas de todos los formularios del portal.
 *
 * Respeta la forma de buscar del sistema legacy (clsREPPersona.formSearch +
 * frmSearchREST):
 *  - la cadena se parte por espacios y cada palabra es una condición AND
 *    contra la columna `search` del core (POST /persona/search);
 *  - se busca desde el primer carácter, sin umbral mínimo (el `debounceTime`
 *    sólo protege el servidor, equivalente al HTTP síncrono por tecla del VB6);
 *  - el resultado se muestra como "Apellido, Nombre (legajo)" (textFound),
 *    ordenado por apellido/nombre y limitado a 50 por el core;
 *  - la elección es por teclado: flechas resaltan, ENTER confirma, ESC descarta
 *    (el ListBox + ENTER del modal legacy), sin cerrar la aplicación como el
 *    ESC+End del cliente de escritorio;
 *  - al elegir, la coincidencia se recarga por legajo (GET /persona/{legajoId},
 *    equivalente a findSearch → findByLegajoId) para entregar la persona
 *    completa al formulario.
 */
@Component({
  selector: 'ui-persona-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="relative">
      <label [attr.for]="inputId" class="um-label">{{ label }}</label>
      <div class="relative">
        <input
          [id]="inputId"
          type="text"
          class="um-input pl-9"
          autocomplete="off"
          role="combobox"
          aria-autocomplete="list"
          [attr.aria-expanded]="panelAbierto()"
          [attr.aria-controls]="listId"
          [attr.aria-activedescendant]="indiceActivo() >= 0 ? opcionId(indiceActivo()) : null"
          [placeholder]="placeholder"
          [ngModel]="termino()"
          (ngModelChange)="onTermino($event)"
          (keydown)="onTecla($event)"
        />
        <div class="absolute left-3 top-2.5 text-um-muted" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      @if (panelAbierto()) {
        <div
          class="absolute w-full mt-1.5 bg-white rounded shadow-lg border border-um-border overflow-y-auto"
          [ngClass]="panelClases"
        >
          <ul [id]="listId" role="listbox" [attr.aria-label]="label" class="p-1">
            @if (buscando()) {
              <li class="px-3.5 py-2 text-xs text-um-muted italic">{{ buscandoLabel }}</li>
            }
            @for (res of resultados(); track res.legajoId; let i = $index) {
              <li
                [id]="opcionId(i)"
                role="option"
                tabindex="0"
                [attr.aria-selected]="indiceActivo() === i"
                (click)="elegir(res)"
                (keyup.enter)="elegir(res)"
                (mousemove)="indiceActivo.set(i)"
                class="px-3.5 py-2 hover:bg-um-surface cursor-pointer rounded flex items-center justify-between gap-2 transition-colors"
                [class.bg-um-selected]="indiceActivo() === i"
                [class.text-um-primary]="indiceActivo() === i"
              >
                <span class="text-xs font-semibold truncate text-um-ink">{{ texto(res) }}</span>
                <span class="text-[11px] font-mono text-um-muted">({{ res.legajoId }})</span>
              </li>
            }
          </ul>
        </div>
      }
    </div>
  `,
})
export class PersonaSearchComponent {
  private readonly personas = inject(PersonaSearchService);

  /** Texto del rótulo del campo. */
  @Input() label = 'Personal';

  /** Placeholder del campo de búsqueda. */
  @Input() placeholder = 'Escriba apellido, nombre o legajo...';

  /** Texto que se muestra mientras el core responde. */
  @Input() buscandoLabel = 'Buscando...';

  /** Posición y altura del panel de resultados (los paneles anidados usan z-50/max-h-40). */
  @Input() panelClases = 'z-20 max-h-60';

  /**
   * Persona en pantalla. El setter sólo actúa cuando llega un valor distinto
   * del último que este componente entregó, para que el eco del binding
   * paterno no borre el texto que el usuario está tipeando.
   */
  @Input() set persona(valor: Persona | null | undefined) {
    const nueva = valor ?? null;
    if (nueva === this.entregaActual) {
      return;
    }
    this.entregaActual = nueva;
    this.mostrar(nueva);
  }

  /** Emite la persona elegida (recargada por legajo) o null cuando se deselecciona. */
  @Output() seleccionada = new EventEmitter<Persona | null>();

  readonly inputId = `ui-persona-search-${++personaSearchSecuencial}`;
  readonly listId = `${this.inputId}-lista`;

  termino = signal('');
  resultados = signal<Persona[]>([]);
  buscando = signal(false);
  panelAbierto = signal(false);
  indiceActivo = signal(-1);

  /** Última persona entregada al padre (o aplicada desde el padre); evita loops de binding. */
  private entregaActual: Persona | null = null;

  private readonly peticiones = new Subject<string>();

  constructor() {
    this.peticiones
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => {
          this.buscando.set(true);
          this.panelAbierto.set(true);
        }),
        switchMap((termino) => this.personas.buscar(termino).pipe(catchError(() => of<Persona[]>([]))))
      )
      .subscribe((resultados) => {
        this.buscando.set(false);
        this.resultados.set(resultados);
        this.indiceActivo.set(-1);
        if (resultados.length === 0) {
          this.panelAbierto.set(false);
        }
      });
  }

  texto(persona: Persona): string {
    return textoPersona(persona);
  }

  opcionId(indice: number): string {
    return `${this.listId}-opcion-${indice}`;
  }

  onTermino(valor: string): void {
    this.termino.set(valor);
    if (this.entregaActual !== null) {
      // Editar el campo invalida la selección, como el KeyPress del txtApeNom legacy.
      this.entregaActual = null;
      this.seleccionada.emit(null);
    }
    this.peticiones.next(valor);
  }

  onTecla(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.cerrarPanel();
      return;
    }
    const total = this.resultados().length;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (total === 0) {
        return;
      }
      this.panelAbierto.set(true);
      this.indiceActivo.set(Math.min(this.indiceActivo() + 1, total - 1));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (total === 0) {
        return;
      }
      this.indiceActivo.set(Math.max(this.indiceActivo() - 1, 0));
      return;
    }
    if (event.key === 'Enter') {
      const indice = this.indiceActivo();
      if (this.panelAbierto() && indice >= 0 && indice < total) {
        event.preventDefault();
        this.elegir(this.resultados()[indice]);
      }
    }
  }

  elegir(persona: Persona): void {
    this.cerrarPanel();
    // findSearch → findByLegajoId del legacy: se entrega la persona completa;
    // si la recarga falla, no se bloquea al usuario y se usa la coincidencia.
    this.personas
      .getPersonaByLegajo(persona.legajoId)
      .pipe(catchError(() => of(persona)))
      .subscribe((completa) => {
        this.entregaActual = completa;
        this.termino.set(textoPersona(completa));
        this.resultados.set([]);
        this.seleccionada.emit(completa);
      });
  }

  /** Resetea campo y resultados sin emitir selección (el padre al limpiar su formulario). */
  limpiar(): void {
    this.entregaActual = null;
    this.termino.set('');
    this.resultados.set([]);
    this.cerrarPanel();
  }

  private mostrar(persona: Persona | null): void {
    this.termino.set(persona ? textoPersona(persona) : '');
    this.resultados.set([]);
    this.cerrarPanel();
  }

  private cerrarPanel(): void {
    this.panelAbierto.set(false);
    this.indiceActivo.set(-1);
  }
}
