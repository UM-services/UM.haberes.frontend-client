import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Permiso, SyncResultado } from '../seguridad.models';
import { SeguridadService } from '../seguridad.service';

@Component({
  selector: 'haberes-seguridad-catalogo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="um-page-header">
      <div>
        <p class="um-eyebrow">Seguridad</p>
        <h1 class="um-page-title">Catálogo de permisos</h1>
        <p class="um-page-desc">Inventario de claves y sincronización con el manifiesto del backend.</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button type="button" class="um-btn-secondary" (click)="sincronizar(true)" [disabled]="cargando()">
          Previsualizar sync
        </button>
        <button type="button" class="um-btn-primary" (click)="sincronizar(false)" [disabled]="cargando()">
          Aplicar sync
        </button>
      </div>
    </div>

    @if (error()) {
      <div class="mb-4 rounded border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{{ error() }}</div>
    }
    @if (mensaje()) {
      <div class="mb-4 rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{{ mensaje() }}</div>
    }

    @if (syncResultado(); as sync) {
      <div class="um-card mb-4 p-4 text-sm">
        <p class="mb-2 font-semibold text-um-ink">Resultado de la sincronización</p>
        <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <span>Creados: <strong>{{ sync.creados.length }}</strong></span>
          <span>Actualizados: <strong>{{ sync.actualizados.length }}</strong></span>
          <span>Retirados: <strong>{{ sync.retirados.length }}</strong></span>
          <span>Asignaciones agregadas: <strong>{{ sync.asignacionesAgregadas.length }}</strong></span>
          <span>Asignaciones quitadas: <strong>{{ sync.asignacionesQuitadas.length }}</strong></span>
          <span>Total de cambios: <strong>{{ sync.totalCambios }}</strong></span>
        </div>
        @if (sync.warnings.length > 0) {
          <ul class="mt-3 list-disc pl-5 text-amber-700">
            @for (warning of sync.warnings; track warning) { <li>{{ warning }}</li> }
          </ul>
        }
      </div>
    }

    <div class="um-card mb-4 p-4">
      <p class="mb-3 text-sm font-semibold text-um-ink">{{ editandoId() ? 'Editar permiso' : 'Nuevo permiso' }}</p>
      <div class="grid gap-3 md:grid-cols-4">
        <label class="block">
          <span class="um-label">Clave</span>
          <input class="um-input" [(ngModel)]="form.clave" [disabled]="editandoId() !== null" placeholder="modulo.pantalla.accion" />
        </label>
        <label class="block">
          <span class="um-label">Módulo</span>
          <input class="um-input" [(ngModel)]="form.modulo" placeholder="liquidacion" />
        </label>
        <label class="block md:col-span-2">
          <span class="um-label">Descripción</span>
          <input class="um-input" [(ngModel)]="form.descripcion" placeholder="Qué habilita" />
        </label>
      </div>
      <div class="mt-3 flex items-center gap-4">
        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" [(ngModel)]="form.activo" />
          Activo
        </label>
        <button type="button" class="um-btn-primary" (click)="guardar()" [disabled]="cargando()">
          {{ editandoId() ? 'Guardar cambios' : 'Crear permiso' }}
        </button>
        @if (editandoId()) {
          <button type="button" class="um-btn-secondary" (click)="cancelar()">Cancelar</button>
        }
      </div>
    </div>

    <div class="um-card overflow-hidden">
      <table class="um-table w-full">
        <thead>
          <tr>
            <th class="text-left">Clave</th>
            <th class="text-left">Módulo</th>
            <th class="text-left">Descripción</th>
            <th class="text-center">Estado</th>
            <th class="text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          @for (permiso of permisos(); track permiso.permisoId) {
            <tr>
              <td class="font-mono text-xs">{{ permiso.clave }}</td>
              <td>{{ permiso.modulo }}</td>
              <td class="text-um-text">{{ permiso.descripcion }}</td>
              <td class="text-center">
                <span [class]="permiso.activo === 1 ? 'text-emerald-700' : 'text-um-muted'">
                  {{ permiso.activo === 1 ? 'Activo' : 'Retirado' }}
                </span>
              </td>
              <td class="text-right">
                <button type="button" class="um-btn-secondary mr-2" (click)="editar(permiso)">Editar</button>
                @if (permiso.activo === 1) {
                  <button type="button" class="um-btn-secondary" (click)="retirar(permiso)">Retirar</button>
                }
              </td>
            </tr>
          } @empty {
            <tr><td colspan="5" class="py-6 text-center text-um-muted">Sin permisos cargados.</td></tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class CatalogoComponent implements OnInit {
  private readonly service = inject(SeguridadService);

  readonly permisos = signal<Permiso[]>([]);
  readonly cargando = signal(false);
  readonly error = signal('');
  readonly mensaje = signal('');
  readonly editandoId = signal<number | null>(null);
  readonly syncResultado = signal<SyncResultado | null>(null);

  form = { clave: '', modulo: '', descripcion: '', activo: true };

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.service.catalogo().subscribe({
      next: (permisos) => {
        this.permisos.set(permisos);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(this.mensajeError(err, 'No se pudo cargar el catálogo.'));
        this.cargando.set(false);
      },
    });
  }

  editar(permiso: Permiso): void {
    this.editandoId.set(permiso.permisoId);
    this.form = {
      clave: permiso.clave,
      modulo: permiso.modulo,
      descripcion: permiso.descripcion,
      activo: permiso.activo === 1,
    };
  }

  cancelar(): void {
    this.editandoId.set(null);
    this.form = { clave: '', modulo: '', descripcion: '', activo: true };
  }

  guardar(): void {
    const payload = {
      clave: this.form.clave.trim(),
      modulo: this.form.modulo.trim(),
      descripcion: this.form.descripcion.trim(),
      activo: this.form.activo ? 1 : 0,
    };
    this.cargando.set(true);
    const peticion$ = this.editandoId()
      ? this.service.actualizarPermiso(this.editandoId()!, payload)
      : this.service.crearPermiso(payload);
    peticion$.subscribe({
      next: () => {
        this.mensaje.set('Permiso guardado.');
        this.error.set('');
        this.cancelar();
        this.cargando.set(false);
        this.cargar();
      },
      error: (err) => {
        this.error.set(this.mensajeError(err, 'No se pudo guardar el permiso.'));
        this.cargando.set(false);
      },
    });
  }

  retirar(permiso: Permiso): void {
    if (!confirm(`¿Retirar el permiso ${permiso.clave}? Queda inactivo y conserva asignaciones.`)) return;
    this.service.retirarPermiso(permiso.permisoId).subscribe({
      next: () => {
        this.mensaje.set('Permiso retirado.');
        this.cargar();
      },
      error: (err) => this.error.set(this.mensajeError(err, 'No se pudo retirar el permiso.')),
    });
  }

  sincronizar(dryRun: boolean): void {
    if (!dryRun && !confirm('¿Aplicar el manifiesto? Se reconcilian permisos y roles.')) return;
    this.cargando.set(true);
    this.service.sync(dryRun).subscribe({
      next: (resultado) => {
        this.syncResultado.set(resultado);
        this.mensaje.set(dryRun ? 'Previsualización calculada.' : 'Manifiesto aplicado.');
        this.error.set('');
        this.cargando.set(false);
        if (!dryRun) this.cargar();
      },
      error: (err) => {
        this.error.set(this.mensajeError(err, 'No se pudo sincronizar el manifiesto.'));
        this.cargando.set(false);
      },
    });
  }

  private mensajeError(error: any, fallback: string): string {
    return error?.error?.detail || error?.error?.message || fallback;
  }
}
