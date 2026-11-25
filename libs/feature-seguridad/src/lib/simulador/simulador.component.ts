import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Persona } from '@haberes/shared-api';
import { PersonaSearchComponent } from '@haberes/ui-layout';
import { forkJoin, of } from 'rxjs';
import { GrupoPermisos, Permiso, PermisoEfectivo, Rol } from '../seguridad.models';
import { SeguridadService } from '../seguridad.service';

interface PermisoSimulado {
  permiso: Permiso;
  origen: string;
  efectivo: boolean;
}

@Component({
  selector: 'haberes-seguridad-simulador',
  standalone: true,
  imports: [CommonModule, FormsModule, PersonaSearchComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="um-page-header">
      <div>
        <p class="um-eyebrow">Seguridad</p>
        <h1 class="um-page-title">Simulador de permisos</h1>
        <p class="um-page-desc">Qué puede hacer un usuario y de dónde sale cada permiso.</p>
      </div>
    </div>

    @if (error()) {
      <div class="mb-4 rounded border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{{ error() }}</div>
    }

    <div class="um-card mb-4 overflow-visible p-4">
      <ui-persona-search
        label="Usuario a simular"
        placeholder="Apellido, nombre o legajo..."
        [persona]="persona()"
        (seleccionada)="seleccionar($event)"
      />
    </div>

    @if (persona(); as usuario) {
      <div class="um-card mb-4 flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <p class="text-base font-semibold text-um-ink">{{ usuario.apellidoNombre || usuario.apellido + ', ' + usuario.nombre }}</p>
          <p class="font-mono text-xs text-um-muted">Legajo {{ usuario.legajoId }}</p>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs text-um-muted">{{ efectivos()?.permisos?.length || 0 }} claves efectivas</span>
          @if (efectivos()?.administrador) {
            <span class="rounded bg-um-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-um-primary">Acceso total</span>
          }
        </div>
      </div>

      <div class="um-card overflow-hidden">
        <div class="border-b border-um-border px-4 py-3 text-sm font-semibold">Detalle por permiso</div>
        <div class="divide-y divide-um-border">
          @for (grupo of grupos(); track grupo.modulo) {
            <div class="px-4 py-3">
              <p class="mb-2 text-[11px] font-bold uppercase tracking-wider text-um-muted">{{ grupo.modulo }}</p>
              <div class="grid gap-1.5 md:grid-cols-2">
                @for (fila of filasDe(grupo.modulo); track fila.permiso.permisoId) {
                  <div class="flex items-center justify-between gap-2 rounded border border-um-border px-3 py-2">
                    <div class="min-w-0">
                      <p class="font-mono text-xs">{{ fila.permiso.clave }}</p>
                      <p class="text-[11px] text-um-muted">{{ fila.origen }}</p>
                    </div>
                    <span
                      class="shrink-0 rounded px-2 py-0.5 text-[10px] font-bold uppercase"
                      [class]="fila.efectivo ? 'bg-emerald-50 text-emerald-700' : 'bg-um-surface text-um-muted'"
                    >
                      {{ fila.efectivo ? 'Sí' : 'No' }}
                    </span>
                  </div>
                }
              </div>
            </div>
          } @empty {
            <p class="px-4 py-6 text-center text-sm text-um-muted">Sin permisos en el catálogo.</p>
          }
        </div>
      </div>
    }
  `,
})
export class SimuladorComponent implements OnInit {
  private readonly service = inject(SeguridadService);

  readonly persona = signal<Persona | null>(null);
  readonly roles = signal<Rol[]>([]);
  readonly catalogo = signal<Permiso[]>([]);
  readonly efectivos = signal<PermisoEfectivo | null>(null);
  readonly rolesAsignados = signal<ReadonlySet<number>>(new Set<number>());
  readonly heredados = signal<ReadonlyMap<number, string>>(new Map<number, string>());
  readonly overrides = signal<ReadonlyMap<number, number>>(new Map<number, number>());
  readonly error = signal('');

  readonly grupos = computed<GrupoPermisos[]>(() => {
    const mapa = new Map<string, Permiso[]>();
    for (const permiso of this.catalogo()) {
      if (permiso.activo !== 1) continue;
      const lista = mapa.get(permiso.modulo) ?? [];
      lista.push(permiso);
      mapa.set(permiso.modulo, lista);
    }
    return [...mapa.entries()].map(([modulo, permisos]) => ({ modulo, permisos }));
  });

  private readonly filas = computed<Map<string, PermisoSimulado[]>>(() => {
    const efectivas = new Set(this.efectivos()?.permisos ?? []);
    const admin = this.efectivos()?.administrador === true;
    const resultado = new Map<string, PermisoSimulado[]>();
    for (const grupo of this.grupos()) {
      resultado.set(grupo.modulo, grupo.permisos.map((permiso) => {
        const override = this.overrides().get(permiso.permisoId);
        const heredadoDe = this.heredados().get(permiso.permisoId);
        const origen = admin
          ? 'Administrador (ADMIN_HABERES)'
          : override === 1
            ? 'Excepción otorgada'
            : override === 0
              ? 'Excepción revocada'
              : heredadoDe
                ? `Rol ${heredadoDe}`
                : 'Sin asignación';
        return { permiso, origen, efectivo: efectivas.has(permiso.clave) };
      }));
    }
    return resultado;
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

  filasDe(modulo: string): PermisoSimulado[] {
    return this.filas().get(modulo) ?? [];
  }

  seleccionar(persona: Persona | null): void {
    this.persona.set(persona);
    this.efectivos.set(null);
    this.rolesAsignados.set(new Set<number>());
    this.heredados.set(new Map<number, string>());
    this.overrides.set(new Map<number, number>());
    this.error.set('');
    if (persona?.legajoId) {
      this.cargar(persona.legajoId);
    }
  }

  private cargar(legajoId: number): void {
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
            const mapa = new Map<number, string>();
            matrices.forEach((matriz, indice) => {
              const rol = this.roles().find((r) => r.rolId === roles[indice]?.rolId);
              for (const asignacion of matriz) {
                if (!mapa.has(asignacion.permisoId)) {
                  mapa.set(asignacion.permisoId, rol?.nombre ?? `#${roles[indice]?.rolId}`);
                }
              }
            });
            this.heredados.set(mapa);
          },
          error: (err) => this.error.set(this.mensajeError(err, 'No se pudieron cargar los permisos de los roles.')),
        });
      },
      error: (err) => this.error.set(this.mensajeError(err, 'No se pudieron cargar los permisos del usuario.')),
    });
  }

  private mensajeError(error: any, fallback: string): string {
    return error?.error?.detail || error?.error?.message || fallback;
  }
}
