import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GrupoPermisos, Permiso, Rol } from '../seguridad.models';
import { SeguridadService } from '../seguridad.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'haberes-seguridad-roles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="um-page-header">
      <div>
        <p class="um-eyebrow">Seguridad</p>
        <h1 class="um-page-title">Roles y matriz de permisos</h1>
        <p class="um-page-desc">Alta de roles y composición rol × permiso. ADMIN_HABERES es protegido.</p>
      </div>
      <button type="button" class="um-btn-primary" (click)="nuevo()" [disabled]="guardando()">Nuevo rol</button>
    </div>

    @if (error()) {
      <div class="mb-4 rounded border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{{ error() }}</div>
    }
    @if (mensaje()) {
      <div class="mb-4 rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{{ mensaje() }}</div>
    }

    <div class="grid gap-4 lg:grid-cols-[320px_1fr]">
      <div class="um-card overflow-hidden">
        <div class="border-b border-um-border px-4 py-3 text-sm font-semibold">Roles</div>
        <ul class="divide-y divide-um-border">
          @for (rol of roles(); track rol.rolId) {
            <li>
              <button
                type="button"
                class="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-um-surface"
                [class.bg-um-selected]="seleccionado()?.rolId === rol.rolId"
                (click)="seleccionar(rol)"
              >
                <span>
                  <span class="block font-mono text-xs font-semibold">{{ rol.nombre }}</span>
                  <span class="block text-xs text-um-muted">{{ rol.descripcion || 'Sin descripción' }}</span>
                </span>
                @if (rol.protegido) {
                  <span class="rounded bg-um-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-um-primary">Protegido</span>
                }
              </button>
            </li>
          } @empty {
            <li class="px-4 py-6 text-center text-sm text-um-muted">Sin roles.</li>
          }
        </ul>
      </div>

      <div class="space-y-4">
        <div class="um-card p-4">
          <p class="mb-3 text-sm font-semibold">{{ editando() ? 'Editar rol' : 'Nuevo rol' }}</p>
          <div class="grid gap-3 md:grid-cols-2">
            <label class="block">
              <span class="um-label">Nombre</span>
              <input class="um-input font-mono" [(ngModel)]="form.nombre" [disabled]="editando()" placeholder="OPERADOR_X" />
            </label>
            <label class="block">
              <span class="um-label">Descripción</span>
              <input class="um-input" [(ngModel)]="form.descripcion" placeholder="Qué puede hacer" />
            </label>
          </div>
          <div class="mt-3 flex flex-wrap items-center gap-2">
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" [(ngModel)]="form.activo" [disabled]="seleccionado()?.protegido === true" />
              Activo
            </label>
            <button type="button" class="um-btn-primary" (click)="guardarRol()" [disabled]="guardando() || seleccionado()?.protegido">
              {{ editando() ? 'Guardar' : 'Crear rol' }}
            </button>
            @if (editando()) {
              <button type="button" class="um-btn-secondary" (click)="nuevo()">Cancelar</button>
            }
            @if (seleccionado() && !seleccionado()!.protegido) {
              <button type="button" class="um-btn-secondary text-rose-700" (click)="eliminarRol()" [disabled]="guardando()">
                Eliminar rol
              </button>
            }
          </div>
        </div>

        @if (seleccionado(); as rol) {
          <div class="um-card overflow-hidden">
            <div class="flex flex-wrap items-center justify-between gap-2 border-b border-um-border px-4 py-3">
              <p class="text-sm font-semibold">Permisos de {{ rol.nombre }}</p>
              @if (rol.protegido) {
                <p class="text-xs text-um-muted">Se reconcilia desde roles.yaml; no se edita desde la UI.</p>
              }
            </div>
            <div class="divide-y divide-um-border">
              @for (grupo of grupos(); track grupo.modulo) {
                <div class="px-4 py-3">
                  <p class="mb-2 text-[11px] font-bold uppercase tracking-wider text-um-muted">{{ grupo.modulo }}</p>
                  <div class="grid gap-1.5 md:grid-cols-2">
                    @for (permiso of grupo.permisos; track permiso.permisoId) {
                      <label class="flex items-start gap-2 text-sm">
                        <input
                          type="checkbox"
                          class="mt-1"
                          [checked]="matriz().has(permiso.permisoId)"
                          [disabled]="rol.protegido || guardando()"
                          (change)="togglePermiso(permiso, $any($event.target).checked)"
                        />
                        <span>
                          <span class="block font-mono text-xs">{{ permiso.clave }}</span>
                          <span class="block text-xs text-um-muted">{{ permiso.descripcion }}</span>
                        </span>
                      </label>
                    }
                  </div>
                </div>
              } @empty {
                <p class="px-4 py-6 text-center text-sm text-um-muted">Sin permisos en el catálogo.</p>
              }
            </div>
          </div>
        } @else {
          <div class="um-card p-6 text-center text-sm text-um-muted">Elegí un rol para editar su matriz.</div>
        }
      </div>
    </div>
  `,
})
export class RolesComponent implements OnInit {
  private readonly service = inject(SeguridadService);

  readonly roles = signal<Rol[]>([]);
  readonly permisos = signal<Permiso[]>([]);
  readonly seleccionado = signal<Rol | null>(null);
  readonly matriz = signal<ReadonlySet<number>>(new Set<number>());
  readonly guardando = signal(false);
  readonly error = signal('');
  readonly mensaje = signal('');
  readonly editando = signal(false);

  form = { nombre: '', descripcion: '', activo: true };

  readonly grupos = computed<GrupoPermisos[]>(() => {
    const mapa = new Map<string, Permiso[]>();
    for (const permiso of this.permisos()) {
      const lista = mapa.get(permiso.modulo) ?? [];
      lista.push(permiso);
      mapa.set(permiso.modulo, lista);
    }
    return [...mapa.entries()].map(([modulo, permisos]) => ({ modulo, permisos }));
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.guardando.set(true);
    this.service.roles().subscribe({
      next: (roles) => {
        this.roles.set(roles);
        this.guardando.set(false);
        const actual = this.seleccionado();
        if (actual) {
          const refrescado = roles.find((rol) => rol.rolId === actual.rolId) ?? null;
          this.seleccionado.set(refrescado);
        }
      },
      error: (err) => {
        this.error.set(this.mensajeError(err, 'No se pudieron cargar los roles.'));
        this.guardando.set(false);
      },
    });
    this.service.catalogo().subscribe({
      next: (permisos) => this.permisos.set(permisos),
      error: (err) => this.error.set(this.mensajeError(err, 'No se pudo cargar el catálogo.')),
    });
  }

  seleccionar(rol: Rol): void {
    this.seleccionado.set(rol);
    this.editando.set(true);
    this.form = {
      nombre: rol.nombre,
      descripcion: rol.descripcion ?? '',
      activo: rol.activo === 1,
    };
    this.service.permisosDeRol(rol.rolId).subscribe({
      next: (asignaciones) => this.matriz.set(new Set(asignaciones.map((a) => a.permisoId))),
      error: (err) => this.error.set(this.mensajeError(err, 'No se pudo cargar la matriz del rol.')),
    });
  }

  nuevo(): void {
    this.seleccionado.set(null);
    this.editando.set(false);
    this.form = { nombre: '', descripcion: '', activo: true };
    this.matriz.set(new Set<number>());
  }

  guardarRol(): void {
    const payload = {
      nombre: this.form.nombre.trim(),
      descripcion: this.form.descripcion.trim(),
      activo: this.form.activo ? 1 : 0,
    };
    this.guardando.set(true);
    const peticion$ = this.editando() && this.seleccionado()
      ? this.service.actualizarRol(this.seleccionado()!.rolId, payload)
      : this.service.crearRol(payload);
    peticion$.subscribe({
      next: (rol) => {
        this.mensaje.set('Rol guardado.');
        this.error.set('');
        this.guardando.set(false);
        this.editando.set(true);
        this.seleccionado.set(rol);
        this.cargar();
      },
      error: (err) => {
        this.error.set(this.mensajeError(err, 'No se pudo guardar el rol.'));
        this.guardando.set(false);
      },
    });
  }

  eliminarRol(): void {
    const rol = this.seleccionado();
    if (!rol) return;
    if (!confirm(`¿Eliminar el rol ${rol.nombre}? Se quitan sus asignaciones a usuarios.`)) return;
    this.guardando.set(true);
    this.service.eliminarRol(rol.rolId).subscribe({
      next: () => {
        this.mensaje.set('Rol eliminado.');
        this.nuevo();
        this.guardando.set(false);
        this.cargar();
      },
      error: (err) => {
        this.error.set(this.mensajeError(err, 'No se pudo eliminar el rol.'));
        this.guardando.set(false);
      },
    });
  }

  togglePermiso(permiso: Permiso, marcado: boolean): void {
    const rol = this.seleccionado();
    if (!rol) return;
    this.guardando.set(true);
    const peticion$: Observable<unknown> = marcado
      ? this.service.asignarPermisoARol(rol.rolId, permiso.permisoId)
      : this.service.quitarPermisoDeRol(rol.rolId, permiso.permisoId);
    peticion$.subscribe({
      next: () => {
        const siguiente = new Set(this.matriz());
        if (marcado) siguiente.add(permiso.permisoId);
        else siguiente.delete(permiso.permisoId);
        this.matriz.set(siguiente);
        this.guardando.set(false);
      },
      error: (err: any) => {
        this.error.set(this.mensajeError(err, 'No se pudo actualizar la matriz.'));
        this.guardando.set(false);
      },
    });
  }

  private mensajeError(error: any, fallback: string): string {
    return error?.error?.detail || error?.error?.message || fallback;
  }
}
