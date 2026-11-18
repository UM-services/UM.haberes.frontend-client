import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '@haberes/shared-api';

/** Fila del listado de usuarios (`GET /usuario/`, sin hash de clave). */
export interface UsuarioResumen {
  legajoId: number;
  usuarioId: number | null;
  facultadId: number | null;
  administrador: number;
}

/** Datos mínimos de persona que usa la pantalla para identificar al usuario. */
export interface PersonaNombre {
  legajoId: number;
  apellido: string;
  nombre: string;
}

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = inject(API_URL, { optional: true }) || '/api/haberes';

  private get usuarioUrl(): string {
    return `${this.apiBase}/core/usuario`;
  }

  private get personaUrl(): string {
    return `${this.apiBase}/core/persona`;
  }

  getUsuarios(): Observable<UsuarioResumen[]> {
    return this.http.get<UsuarioResumen[]>(`${this.usuarioUrl}/`);
  }

  getPersonas(legajos: number[]): Observable<PersonaNombre[]> {
    return this.http.post<PersonaNombre[]>(`${this.personaUrl}/legajos`, legajos);
  }

  /** El legajo y el valor viajan en la ruta; no se usan query params. */
  setAdministrador(legajoId: number, administrador: number): Observable<UsuarioResumen> {
    return this.http.put<UsuarioResumen>(
      `${this.usuarioUrl}/${legajoId}/administrador/${administrador}`,
      null,
    );
  }
}
