import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map, catchError, of, switchMap, forkJoin } from 'rxjs';

export interface Persona {
  legajoId: number;
  apellido: string;
  nombre: string;
  apellidoNombre?: string;
  id?: number;
  facultadId?: number;
  facultadNombre?: string;
  sede?: string;
}

export interface Usuario {
  legajoId: number;
  password?: string;
  usuarioId?: number;
  facultadId?: number;
  facultadNombre?: string;
  build?: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly personaUrl = '/api/haberes/core/persona';
  private readonly usuarioUrl = '/api/haberes/core/usuario';

  private currentUserSubject = new BehaviorSubject<Persona | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    const savedUser = localStorage.getItem('haberes_user');
    if (savedUser) {
      try {
        this.currentUserSubject.next(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('haberes_user');
      }
    }
  }

  getPersona(legajoId: number): Observable<Persona> {
    return this.http.get<Persona>(`${this.personaUrl}/${legajoId}`);
  }

  getUsuario(legajoId: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.usuarioUrl}/${legajoId}`);
  }

  getFacultad(facultadId: number): Observable<any> {
    return this.http.get<any>(`/api/haberes/core/facultad/${facultadId}`);
  }

  login(legajoId: number, password: string): Observable<{ success: boolean, usuario?: Usuario, error?: string }> {
    const url_isvalid = this.usuarioUrl + "/isuservalid";
    const url_lastlog = this.usuarioUrl + "/lastlog/" + legajoId + "/1";
    
    return this.http.put<boolean>(url_isvalid, { legajoId, password }).pipe(
      switchMap(isValid => {
        if (!isValid) return of({ success: false, error: 'ERROR: Password INCORRECTO' });
        
        return this.getUsuario(legajoId).pipe(
          switchMap(usuario => {
            const persona$ = this.getPersona(legajoId);
            const lastLog$ = this.http.get(url_lastlog);
            const facultad$ = usuario.facultadId ? this.getFacultad(usuario.facultadId) : of(null);
            
            return forkJoin({
              persona: persona$,
              lastLog: lastLog$,
              facultad: facultad$
            }).pipe(
              map(({ persona, facultad }) => {
                persona.id = persona.legajoId;
                persona.facultadId = usuario.facultadId;
                persona.facultadNombre = facultad ? facultad.nombre : null;
                persona.sede = "Sede Central";
                this.currentUserSubject.next(persona);
                localStorage.setItem('haberes_user', JSON.stringify(persona));
                return { success: true, usuario };
              })
            );
          })
        );
      }),
      catchError(() => of({ success: false, error: 'Error en el servidor de autenticación' }))
    );
  }

  setPassword(legajoId: number, password: string): Observable<void> {
    return this.http.put<void>(`${this.usuarioUrl}/setpassword`, { legajoId, password, build: 1 });
  }

  clearSession() {
    this.currentUserSubject.next(null);
    localStorage.removeItem('haberes_user');
  }

  logout() {
    this.clearSession();
    window.location.href = '/login';
  }
}
