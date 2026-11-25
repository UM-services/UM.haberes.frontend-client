import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Persona, PermisosService } from '@haberes/shared-api';
import { PersonaSearchComponent } from '@haberes/ui-layout';
import { forkJoin, Observable, of } from 'rxjs';
import { ModuloGrupo, Permiso, PermisoEfectivo, PermisoFila, Rol } from '../seguridad.models';
import { SeguridadService } from '../seguridad.service';

/**
 * Permisos por usuario, con la misma lectura que la pantalla de Tesorería:
 * checkbox por permiso (marcado = efectivo), badges Heredado / Otorgado /
 * Revocado, contador por módulo y chips con el bundle efectivo.
 */
@Component({
  selector: 'haberes-seguridad-permisos',
  standalone: true,
  imports: [CommonModule, FormsModule, PersonaSearchComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="space-y-6">
      <div class="um-page-header">
        <div>
          <p class="um-eyebrow">Seguridad</p>
          <h1 class="um-page-title">Permisos de usuario</h1>
          <p class="um-page-desc">
            Roles heredados y excepciones individuales. El checkbox marcado indica que el permiso
            está efectivamente habilitado.
          </p>
        </div>
      </div>

      @if (error()) {
        <div class="rounded border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{{ error() }}</div>
      }
      @if (mensaje()) {
        <div class="rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{{ mensaje() }}</div>
      }

      <div class="um-card overflow-visible p-6">
        <ui-persona-search
          label="Usuario"
          placeholder="Apellido, nombre o legajo..."
          [persona]="persona()"
          (seleccionada)="seleccionar($event)"
        />
      </div>

      @if (persona(); as usuario) {
        <div class="um-card flex flex-wrap items-center justify-between gap-3 p-6">
          <div>
            <p class="text-xs font-semibold uppercase tracking-wider text-um-muted">Usuario seleccionado</p>
            <p class="mt-1 text-lg font-semibold text-um-ink">
              {{ usuario.apellidoNombre || usuario.apellido + ', ' + usuario.nombre }}
              <span class="text-sm font-normal text-um-muted">(legajo {{ usuario.legajoId }})</span>
            </p>
            @if (efectivos()?.administrador) {
              <span class="mt-2 inline-block rounded bg-um-primary/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-um-primary">
                Acceso total (ADMIN_HABERES)
              </span>
            }
          </div>
          <button type="button" class="um-btn-secondary" (click)="limpiarSeleccion()">Cambiar usuario</button>
        </div>

        @if (efectivos()?.administrador) {
          <div class="rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Este usuario es administrador: el rol ADMIN_HABERES le da todas las claves y ninguna
            excepción puede revocárselas. Las acciones de permisos están deshabilitadas.
          </div>
        }

        @if (cargando()) {
          <div class="um-card p-12 text-center text-sm text-um-muted">Cargando permisos...</div>
        } @else {
          <div class="grid gap-6 lg:grid-cols-3">
            <div class="um-card overflow-hidden">
              <div class="flex items-center justify-between border-b border-um-border bg-um-surface px-6 py-4">
                <h2 class="text-sm font-semibold uppercase tracking-wider text-um-ink">Roles</h2>
                <span class="text-sm text-um-muted">{{ rolesAsignados().size }} de {{ roles().length }}</span>
              </div>
              <ul class="max-h-[560px] divide-y divide-um-border overflow-y-auto">
                @for (rol of roles(); track rol.rolId) {
                  <li class="flex items-center gap-3 px-6 py-3">
                    <input
                      type="checkbox"
                      [id]="'rol-' + rol.rolId"
                      [checked]="rolesAsignados().has(rol.rolId)"
                      [disabled]="rol.protegido || rolesPendientes().has(rol.rolId)"
                      (change)="toggleRol(rol, $any($event.target).checked)"
                      class="h-4 w-4"
                    />
                    <label [for]="'rol-' + rol.rolId" class="flex-1 cursor-pointer text-sm text-um-ink">
                      {{ rol.nombre }}
                      @if (rol.descripcion) {
                        <span class="block text-xs text-um-muted">{{ rol.descripcion }}</span>
                      }
                    </label>
                    @if (rol.protegido) {
                      <span class="rounded bg-um-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-um-primary">Protegido</span>
                    }
                  </li>
                } @empty {
                  <li class="px-6 py-8 text-center text-sm text-um-muted">No hay roles definidos.</li>
                }
              </ul>
            </div>

            <div class="space-y-6 lg:col-span-2">
              <div class="um-card overflow-hidden">
                <div class="flex items-center justify-between border-b border-um-border bg-um-surface px-6 py-4">
                  <h2 class="text-sm font-semibold uppercase tracking-wider text-um-ink">Permisos efectivos</h2>
                  <span class="text-sm text-um-muted">{{ efectivos()?.permisos?.length || 0 }} habilitado(s)</span>
                </div>
                <div class="flex flex-wrap gap-2 px-6 py-4">
                  @for (clave of efectivos()?.permisos ?? []; track clave) {
                    <span class="inline-block rounded-full bg-um-selected px-3 py-1 text-xs font-medium text-um-primary">{{ clave }}</span>
                  } @empty {
                    <p class="text-sm text-um-muted">El usuario no tiene permisos habilitados.</p>
                  }
                </div>
              </div>

              @for (grupo of grupos(); track grupo.modulo) {
                <div class="um-card overflow-hidden">
                  <div class="flex items-center justify-between border-b border-um-border bg-um-surface px-6 py-4">
                    <h2 class="text-sm font-semibold uppercase tracking-wider text-um-ink">{{ grupo.modulo }}</h2>
                    <span class="text-sm text-um-muted">{{ grupo.asignados }} de {{ grupo.filas.length }}</span>
                  </div>
                  <ul class="divide-y divide-um-border">
                    @for (fila of grupo.filas; track fila.permiso.permisoId) {
                      <li class="flex flex-wrap items-center gap-3 px-6 py-3">
                        <input
                          type="checkbox"
                          [id]="'permiso-' + fila.permiso.permisoId"
                          [checked]="fila.efectivo"
                          [disabled]="efectivos()?.administrador || pendientesPermiso().has(fila.permiso.permisoId)"
                          (change)="togglePermiso(fila)"
                          class="h-4 w-4"
                        />
                        <label [for]="'permiso-' + fila.permiso.permisoId" class="flex-1 cursor-pointer">
                          <span class="block text-sm text-um-ink">{{ fila.permiso.descripcion }}</span>
                          <span class="block font-mono text-[11px] text-um-muted">{{ fila.permiso.clave }}</span>
                        </label>

                        @if (fila.override === 1) {
                          <span class="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">Otorgado</span>
                        }
                        @if (fila.override === 0) {
                          <span class="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-800">Revocado</span>
                        }
                        @if (fila.override === null && fila.heredado) {
                          <span class="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-700">Heredado</span>
                        }
                        @if (fila.override === null && !fila.heredado && fila.efectivo) {
                          <span class="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-700">Efectivo</span>
                        }

                        @if (fila.override !== null) {
                          <button
                            type="button"
                            class="um-btn-secondary"
                            [disabled]="efectivos()?.administrador || pendientesPermiso().has(fila.permiso.permisoId)"
                            (click)="limpiarExcepcion(fila)"
                          >
                            Quitar excepción
                          </button>
                        }
                      </li>
                    }
                  </ul>
                </div>
              } @empty {
                <div class="um-card p-8 text-center text-sm text-um-muted">
                  No hay permisos en el catálogo. Verificá la carga inicial de la tabla <code>permiso</code>.
                </div>
              }

              @if (otrosEfectivos().length > 0) {
                <div class="um-card overflow-hidden">
                  <div class="flex items-center justify-between border-b border-um-border bg-um-surface px-6 py-4">
                    <h2 class="text-sm font-semibold uppercase tracking-wider text-um-ink">Otras claves efectivas</h2>
                    <span class="text-sm text-um-muted">{{ otrosEfectivos().length }}</span>
                  </div>
                  <div class="flex flex-wrap gap-2 px-6 py-4">
                    @for (clave of otrosEfectivos(); track clave) {
                      <span class="inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">{{ clave }}</span>
                    }
                  </div>
                  <p class="px-6 pb-4 text-xs text-um-muted">Claves habilitadas que no están en el catálogo de esta aplicación.</p>
                </div>
              }
            </div>
          </div>
        }
      }
    </div>
  `,
})
export class PermisosComponent implements OnInit {
  private readonly service = inject(SeguridadService);
  private readonly permisosService = inject(PermisosService);

  @ViewChild(PersonaSearchComponent) private personaSearch?: PersonaSearchComponent;

  readonly persona = signal<Persona | null>(null);
  readonly roles = signal<Rol[]>([]);
  readonly catalogo = signal<Permiso[]>([]);
  readonly rolesAsignados = signal<ReadonlySet<number>>(new Set<number>());
  readonly overrides = signal<ReadonlyMap<number, number>>(new Map<number, number>());
  readonly heredados = signal<ReadonlySet<number>>(new Set<number>());
  readonly efectivos = signal<PermisoEfectivo | null>(null);
  readonly cargando = signal(false);
  readonly error = signal('');
  readonly mensaje = signal('');
  readonly rolesPendientes = signal<ReadonlySet<number>>(new Set<number>());
  readonly pendientesPermiso = signal<ReadonlySet<number>>(new Set<number>());

  readonly grupos = computed<ModuloGrupo[]>(() => {
    const efectivos = new Set(this.efectivos()?.permisos ?? []);
    const porModulo = new Map<string, PermisoFila[]>();
    for (const permiso of this.catalogo()) {
      if (permiso.activo !== 1) continue;
      const override = this.overrides().has(permiso.permisoId)
        ? (this.overrides().get(permiso.permisoId) as number)
        : null;
      const fila: PermisoFila = {
        permiso,
        heredado: this.heredados().has(permiso.permisoId),
        override,
        efectivo: efectivos.has(permiso.clave),
      };
      const lista = porModulo.get(permiso.modulo) ?? [];
      lista.push(fila);
      porModulo.set(permiso.modulo, lista);
    }
    return [...porModulo.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([modulo, filas]) => ({
        modulo,
        filas: filas.sort((a, b) => a.permiso.clave.localeCompare(b.permiso.clave)),
        asignados: filas.filter((fila) => fila.efectivo).length,
      }));
  });

  readonly otrosEfectivos = computed<string[]>(() => {
    const claves = new Set(this.catalogo().map((permiso) => permiso.clave));
    return (this.efectivos()?.permisos ?? []).filter((clave) => !claves.has(clave));
  });

  ngOnInit(): void {
    this.service.roles().subscribe({
      next: (roles) => this.roles.set(roles),
      error: (err) => this.error.set(this.mensajeError(err, 'No se pudieron cargar los roles.')),
    });
    this.service.catalogo().subscribe({
      next: (permisos) => this.catalogo.set(permisos),
      error: (err) => this.error.set(this.mensajeError(err, 'No se pudo cargar el catálogo.')),
    });
  }

  seleccionar(persona: Persona | null): void {
    this.persona.set(persona);
    this.rolesAsignados.set(new Set<number>());
    this.overrides.set(new Map<number, number>());
    this.heredados.set(new Set<number>());
    this.efectivos.set(null);
    this.error.set('');
    this.mensaje.set('');
    if (persona?.legajoId) {
      this.recargar(persona.legajoId, true);
    }
  }

  limpiarSeleccion(): void {
    this.persona.set(null);
    this.rolesAsignados.set(new Set<number>());
    this.overrides.set(new Map<number, number>());
    this.heredados.set(new Set<number>());
    this.efectivos.set(null);
    this.error.set('');
    this.mensaje.set('');
    this.rolesPendientes.set(new Set<number>());
    this.pendientesPermiso.set(new Set<number>());
    this.personaSearch?.limpiar();
  }

  toggleRol(rol: Rol, marcado: boolean): void {
    const persona = this.persona();
    if (!persona || rol.protegido || this.rolesPendientes().has(rol.rolId)) return;
    this.marcarRolPendiente(rol.rolId, true);
    const peticion$: Observable<unknown> = marcado
      ? this.service.asignarRol(persona.legajoId, rol.rolId)
      : this.service.quitarRol(persona.legajoId, rol.rolId);
    peticion$.subscribe({
      next: () => {
        this.marcarRolPendiente(rol.rolId, false);
        this.mensaje.set(marcado ? `Rol ${rol.nombre} asignado.` : `Rol ${rol.nombre} desasignado.`);
        this.error.set('');
        this.recargar(persona.legajoId, false);
        this.permisosService.recargar();
      },
      error: (err: any) => {
        this.marcarRolPendiente(rol.rolId, false);
        this.error.set(this.mensajeError(err, 'No se pudo actualizar el rol del usuario.'));
      },
    });
  }

  togglePermiso(fila: PermisoFila): void {
    const persona = this.persona();
    if (!persona || this.efectivos()?.administrador || this.pendientesPermiso().has(fila.permiso.permisoId)) {
      return;
    }
    const otorgar = !fila.efectivo;
    this.marcarPermisoPendiente(fila.permiso.permisoId, true);
    this.service.setOverride(persona.legajoId, fila.permiso.permisoId, otorgar ? 1 : 0).subscribe({
      next: () => {
        this.marcarPermisoPendiente(fila.permiso.permisoId, false);
        this.mensaje.set(`${otorgar ? 'Permiso otorgado' : 'Permiso revocado'}: ${fila.permiso.descripcion}.`);
        this.error.set('');
        this.recargar(persona.legajoId, false);
        this.permisosService.recargar();
      },
      error: (err: any) => {
        this.marcarPermisoPendiente(fila.permiso.permisoId, false);
        this.error.set(this.mensajeError(err, 'No se pudo cambiar el permiso.'));
      },
    });
  }

  limpiarExcepcion(fila: PermisoFila): void {
    const persona = this.persona();
    if (!persona || this.efectivos()?.administrador || this.pendientesPermiso().has(fila.permiso.permisoId)) {
      return;
    }
    this.marcarPermisoPendiente(fila.permiso.permisoId, true);
    this.service.setOverride(persona.legajoId, fila.permiso.permisoId, null).subscribe({
      next: () => {
        this.marcarPermisoPendiente(fila.permiso.permisoId, false);
        this.mensaje.set(`Excepción eliminada: ${fila.permiso.descripcion}.`);
        this.error.set('');
        this.recargar(persona.legajoId, false);
        this.permisosService.recargar();
      },
      error: (err: any) => {
        this.marcarPermisoPendiente(fila.permiso.permisoId, false);
        this.error.set(this.mensajeError(err, 'No se pudo eliminar la excepción.'));
      },
    });
  }

  private recargar(legajoId: number, mostrarSpinner: boolean): void {
    if (mostrarSpinner) {
      this.cargando.set(true);
    }
    forkJoin({
      roles: this.service.rolesDeUsuario(legajoId),
      overrides: this.service.overridesDeUsuario(legajoId),
      efectivos: this.service.permisosEfectivos(legajoId),
    }).subscribe({
      next: ({ roles, overrides, efectivos }) => {
        this.rolesAsignados.set(new Set(roles.map((rol) => rol.rolId)));
        this.overrides.set(new Map(overrides.map((o) => [o.permisoId, o.otorgado])));
        this.efectivos.set(efectivos);

        const consultas = roles.length > 0
          ? roles.map((rol) => this.service.permisosDeRol(rol.rolId))
          : [of([])];
        forkJoin(consultas).subscribe({
          next: (matrices) => {
            const ids = new Set<number>();
            for (const matriz of matrices) {
              for (const asignacion of matriz) ids.add(asignacion.permisoId);
            }
            this.heredados.set(ids);
            this.cargando.set(false);
          },
          error: (err) => {
            this.error.set(this.mensajeError(err, 'No se pudieron cargar los permisos de los roles.'));
            this.cargando.set(false);
          },
        });
      },
      error: (err) => {
        this.error.set(this.mensajeError(err, 'No se pudieron cargar los permisos del usuario.'));
        this.cargando.set(false);
      },
    });
  }

  private marcarRolPendiente(rolId: number, pendiente: boolean): void {
    const siguiente = new Set(this.rolesPendientes());
    if (pendiente) siguiente.add(rolId);
    else siguiente.delete(rolId);
    this.rolesPendientes.set(siguiente);
  }

  private marcarPermisoPendiente(permisoId: number, pendiente: boolean): void {
    const siguiente = new Set(this.pendientesPermiso());
    if (pendiente) siguiente.add(permisoId);
    else siguiente.delete(permisoId);
    this.pendientesPermiso.set(siguiente);
  }

  private mensajeError(error: any, fallback: string): string {
    return error?.error?.detail || error?.error?.message || fallback;
  }
}
