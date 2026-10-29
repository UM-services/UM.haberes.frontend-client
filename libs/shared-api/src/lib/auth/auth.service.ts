import { computed, Injectable, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import {
  BehaviorSubject,
  Observable,
  catchError,
  finalize,
  forkJoin,
  map,
  of,
  switchMap,
} from 'rxjs';
import { API_URL } from '../tokens';
import { ChangePasswordRequest } from './auth.models';

/**
 * Modelo compartido de persona (DTO PersonaResponse/PersonaSearchResponse de
 * haberes-core). Es el tipo que mueve el buscador estándar ui-persona-search
 * y las pantallas que buscan a alguien.
 */
export interface Persona {
  legajoId: number;
  apellido: string;
  nombre: string;
  apellidoNombre?: string;
  documento?: number | string | null;
  estado?: number | null;
  dependenciaId?: number | null;
  dependencia?: { dependenciaId: number; nombre?: string; acronimo?: string } | null;
  id?: number;
  facultadId?: number | null;
  facultadNombre?: string | null;
  sede?: string;
  nacimiento?: string | null;
  altaDocente?: string | null;
  ajusteDocente?: number | null;
  altaAdministrativa?: string | null;
  ajusteAdministrativo?: number | null;
  estadoCivil?: string | null;
  situacionId?: number | null;
  reemplazoDesarraigo?: number | null;
  mitadDesarraigo?: number | null;
  cuil?: string | null;
  posgrado?: number | null;
  liquida?: string | null;
  estadoAfip?: number | null;
  salida?: string | null;
  obraSocial?: number | null;
  actividadAfip?: number | null;
  localidadAfip?: number | null;
  situacionAfip?: number | null;
  modeloContratacionAfip?: number | null;
  directivoEtec?: number | null;
}

export interface Usuario {
  legajoId: number;
  password?: string;
  usuarioId?: number;
  facultadId?: number;
  facultadNombre?: string;
  build?: number;
}

interface FacultadResumen {
  nombre?: string;
}

/**
 * Sesion persistida. Solo guardamos el legajoId: la facultad se revalida
 * contra haberes-core en cada arranque (ver `ensureSession`). Antes se
 * guardaba la Persona completa, incluido `facultadId`, y el navegador quedaba
 * con una asignacion vieja (o manipulada) hasta limpiar el almacenamiento.
 */
interface StoredSession {
  version: 2;
  legajoId: number;
}

const SESSION_KEY = 'haberes_user';
const SESSION_VERSION = 2;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiBase = inject(API_URL, { optional: true }) || '/api/haberes';

  private get personaUrl(): string {
    return `${this.apiBase}/core/persona`;
  }

  private get usuarioUrl(): string {
    return `${this.apiBase}/core/usuario`;
  }

  private currentUserSubject = new BehaviorSubject<Persona | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  /** Sesión actual como señal (para computed/templates sin suscripciones manuales). */
  private readonly currentUser = toSignal(this.currentUserSubject.asObservable(), {
    initialValue: null,
  });

  /**
   * Facultad asignada a la sesión. Es el filtro que usan todas las pantallas de
   * Haberes; null cuando el usuario no tiene facultad asignada (módulos
   * globales, como Administrador).
   */
  readonly facultadId = computed<number | null>(() => this.currentUser()?.facultadId ?? null);

  /** legajoId persistido, sin datos derivados que puedan quedar desactualizados. */
  private storedLegajoId: number | null;
  /** true cuando la sesión ya se contrastó contra el backend en este arranque. */
  private sessionValidated = false;
  /** Validación en curso, compartida entre guards que se ejecuten en paralelo. */
  private validation$: Observable<Persona | null> | null = null;

  constructor() {
    this.storedLegajoId = this.readStoredLegajoId();
    if (this.storedLegajoId) {
      // Sesión mínima mientras se revalida: el shell ya puede renderizar su
      // estructura sin mostrar el login, pero sin ningún dato derivado
      // (facultadId incluido) que todavía no esté confirmado por el backend.
      this.currentUserSubject.next({
        legajoId: this.storedLegajoId,
        apellido: '',
        nombre: '',
        apellidoNombre: '',
      });
    }
  }

  getPersona(legajoId: number): Observable<Persona> {
    return this.http.get<Persona>(`${this.personaUrl}/${legajoId}`);
  }

  /** Lectura sincronica de la sesion (espejo del AuthService de tesoreria-frontend). */
  get currentUserValue(): Persona | null {
    return this.currentUserSubject.value;
  }

  /**
   * Devuelve la sesión validada contra haberes-core.
   *
   * - Sin `legajoId` persistido: no hay sesión.
   * - Con `legajoId`: relee usuario (fuente de verdad de `facultadId`) y persona,
   *   y recién entonces publica la sesión. Así, cambiar la facultad de un usuario
   *   en la base impacta en el próximo arranque y editar `localStorage` no alcanza
   *   para entrar a un módulo restringido.
   * - El resultado se cachea hasta `clearSession()`; `force` permite repetir la
   *   consulta (por ejemplo tras un cambio administrativo).
   */
  ensureSession(force = false): Observable<Persona | null> {
    if (this.sessionValidated && !force) return of(this.currentUserSubject.value);
    if (this.validation$) return this.validation$;

    if (!this.storedLegajoId) {
      this.clearSession();
      return of(null);
    }

    const legajoId = this.storedLegajoId;
    this.validation$ = forkJoin({
      persona: this.getPersona(legajoId),
      usuario: this.getUsuario(legajoId),
    }).pipe(
      switchMap(({ persona, usuario }) => {
        if (!usuario?.usuarioId) return of(null);

        const facultad$ = usuario.facultadId
          ? this.getFacultad(usuario.facultadId).pipe(catchError(() => of(null)))
          : of(null);

        return facultad$.pipe(
          map((facultad) => {
            const session = this.applySession(persona, usuario, facultad);
            this.sessionValidated = true;
            return session;
          }),
        );
      }),
      catchError(() => of(null)),
      map((session) => {
        if (!session) this.clearSession();
        return session;
      }),
      finalize(() => {
        this.validation$ = null;
      }),
    );

    return this.validation$;
  }

  /**
   * Cambio de clave contra `PUT /usuario/cambiarclave` (haberes-core). La
   * verificacion de la clave anterior es server-side; en exito devuelve 204 y
   * la sesion local no cambia, por lo que no hay que revalidar.
   * Los errores de negocio llegan como ProblemDetail con el mensaje en `detail`.
   */
  changePassword(data: ChangePasswordRequest): Observable<void> {
    return this.http.put<void>(`${this.usuarioUrl}/cambiarclave`, data);
  }

  getUsuario(legajoId: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.usuarioUrl}/${legajoId}`);
  }

  getFacultad(facultadId: number): Observable<FacultadResumen> {
    return this.http.get<FacultadResumen>(`${this.apiBase}/core/facultad/${facultadId}`);
  }

  login(
    legajoId: number,
    password: string,
  ): Observable<{ success: boolean; usuario?: Usuario; error?: string }> {
    const url_isvalid = this.usuarioUrl + '/isuservalid';
    const url_lastlog = this.usuarioUrl + '/lastlog/' + legajoId + '/1';

    return this.http.put<boolean>(url_isvalid, { legajoId, password }).pipe(
      switchMap((isValid) => {
        if (!isValid) return of({ success: false, error: 'ERROR: Password INCORRECTO' });

        return forkJoin({
          usuario: this.getUsuario(legajoId),
          persona: this.getPersona(legajoId),
          lastLog: this.http.get(url_lastlog),
        }).pipe(
          switchMap(({ usuario, persona }) => {
            if (!usuario?.usuarioId) {
              return of({ success: false, error: 'ERROR: Usuario NO HABILITADO' });
            }

            const facultad$ = usuario.facultadId
              ? this.getFacultad(usuario.facultadId).pipe(catchError(() => of(null)))
              : of(null);

            return facultad$.pipe(
              map((facultad) => {
                this.storedLegajoId = legajoId;
                this.sessionValidated = true;
                this.applySession(persona, usuario, facultad);
                return { success: true, usuario };
              }),
            );
          }),
        );
      }),
      catchError(() => of({ success: false, error: 'Error en el servidor de autenticación' })),
    );
  }

  setPassword(legajoId: number, password: string): Observable<void> {
    return this.http.put<void>(`${this.usuarioUrl}/setpassword`, { legajoId, password, build: 1 });
  }

  clearSession() {
    this.storedLegajoId = null;
    this.sessionValidated = false;
    this.validation$ = null;
    this.currentUserSubject.next(null);
    localStorage.removeItem(SESSION_KEY);
  }

  logout() {
    this.clearSession();
    this.router.navigate(['/login']);
  }

  private applySession(
    persona: Persona,
    usuario: Usuario,
    facultad: FacultadResumen | null,
  ): Persona {
    const session: Persona = {
      ...persona,
      id: persona.legajoId,
      facultadId: usuario.facultadId ?? null,
      facultadNombre: facultad?.nombre ?? null,
      sede: persona.sede ?? 'Sede Central',
    };
    this.currentUserSubject.next(session);
    this.storedLegajoId = session.legajoId;
    this.persistSession(session.legajoId);
    return session;
  }

  private persistSession(legajoId: number) {
    const payload: StoredSession = { version: SESSION_VERSION, legajoId };
    localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
  }

  /**
   * Lee la sesión persistida. Acepta el formato anterior (Persona completa) para
   * migrarlo descartando `facultadId` y cualquier otro dato derivado.
   */
  private readStoredLegajoId(): number | null {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw) as Partial<StoredSession> & { legajoId?: number };
      const legajoId = Number(parsed?.legajoId);
      if (!Number.isFinite(legajoId) || legajoId <= 0) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }
      if (parsed.version !== SESSION_VERSION) this.persistSession(legajoId);
      return legajoId;
    } catch {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
  }
}
