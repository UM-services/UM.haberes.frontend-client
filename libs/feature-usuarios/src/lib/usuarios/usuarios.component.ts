import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService, mensajeDeError } from '@haberes/shared-api';
import { PersonaNombre, UsuarioResumen, UsuariosService } from './usuarios.service';

interface FilaUsuario extends UsuarioResumen {
  apellido: string;
  nombre: string;
  facultadNombre: string;
  esActual: boolean;
  puedeEditar: boolean;
}

@Component({
  selector: 'lib-usuarios',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.component.html',
})
export class UsuariosComponent implements OnInit {
  private readonly service = inject(UsuariosService);
  private readonly auth = inject(AuthService);

  readonly usuarios = signal<UsuarioResumen[]>([]);
  readonly personas = signal<Record<number, PersonaNombre>>({});
  readonly facultades = signal<Record<number, string>>({});
  readonly cargando = signal(false);
  readonly guardando = signal<number | null>(null);
  readonly error = signal('');
  readonly mensaje = signal('');
  readonly filtro = signal('');

  readonly legajoActual = computed(() => this.auth.currentUserValue?.legajoId ?? null);

  readonly filas = computed<FilaUsuario[]>(() => {
    const texto = this.filtro().trim().toLowerCase();
    return this.usuarios()
      .map((usuario) => {
        const persona = this.personas()[usuario.legajoId];
        return {
          ...usuario,
          apellido: persona?.apellido ?? '',
          nombre: persona?.nombre ?? '',
          facultadNombre: usuario.facultadId
            ? (this.facultades()[usuario.facultadId] ?? `Facultad ${usuario.facultadId}`)
            : 'Global',
          esActual: usuario.legajoId === this.legajoActual(),
          // D6: no se puede revocar el flag a la propia sesión.
          puedeEditar:
            usuario.facultadId == null && usuario.legajoId !== this.legajoActual(),
        };
      })
      .filter((fila) => {
        if (!texto) return true;
        return `${fila.legajoId} ${fila.apellido} ${fila.nombre}`.toLowerCase().includes(texto);
      });
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.limpiarMensajes();
    this.cargando.set(true);
    this.service
      .getUsuarios()
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (usuarios) => {
          this.usuarios.set(usuarios);
          this.cargarPersonas(usuarios);
          this.cargarFacultades(usuarios);
        },
        error: (err) => this.error.set(mensajeDeError(err, 'No se pudieron cargar los usuarios')),
      });
  }

  cambiarAdministrador(fila: FilaUsuario, habilitar: boolean): void {
    if (!fila.puedeEditar) return;

    this.limpiarMensajes();
    this.guardando.set(fila.legajoId);
    this.service
      .setAdministrador(fila.legajoId, habilitar ? 1 : 0)
      .pipe(finalize(() => this.guardando.set(null)))
      .subscribe({
        next: (usuario) => {
          this.usuarios.update((lista) =>
            lista.map((item) => (item.legajoId === usuario.legajoId ? { ...item, ...usuario } : item)),
          );
          this.mensaje.set(
            habilitar
              ? `El legajo ${usuario.legajoId} ahora es administrador.`
              : `Se revocó el flag de administrador al legajo ${usuario.legajoId}.`,
          );
        },
        error: (err) =>
          this.error.set(mensajeDeError(err, 'No se pudo actualizar el flag de administrador')),
      });
  }

  private cargarPersonas(usuarios: UsuarioResumen[]): void {
    const legajos = usuarios.map((usuario) => usuario.legajoId);
    if (legajos.length === 0) return;

    this.service.getPersonas(legajos).subscribe({
      next: (personas) => {
        const mapa: Record<number, PersonaNombre> = {};
        for (const persona of personas) mapa[persona.legajoId] = persona;
        this.personas.set(mapa);
      },
      // Los nombres son sólo contexto: si fallan, la pantalla sigue operativa.
      error: () => this.personas.set({}),
    });
  }

  private cargarFacultades(usuarios: UsuarioResumen[]): void {
    const ids = [...new Set(usuarios.map((usuario) => usuario.facultadId).filter((id): id is number => id != null))];
    for (const id of ids) {
      this.auth.getFacultad(id).subscribe({
        next: (facultad) =>
          this.facultades.update((mapa) => ({ ...mapa, [id]: facultad.nombre ?? `Facultad ${id}` })),
        error: () => this.facultades.update((mapa) => ({ ...mapa, [id]: `Facultad ${id}` })),
      });
    }
  }

  private limpiarMensajes(): void {
    this.error.set('');
    this.mensaje.set('');
  }
}
