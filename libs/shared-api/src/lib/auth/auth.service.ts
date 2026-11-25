import { computed, Injectable, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
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
  /** Flag administrador de Haberes (viene de `usuario`, no de la persona). */
  administrador?: number | null;
}

export interface Usuario {
  legajoId: number;
  password?: string;
  usuarioId?: number;
  facultadId?: number;
  facultadNombre?: string;
  build?: number;
  administrador?: number;
}

/** Datos mínimos que devuelve el pre-login (sin documento, CUIL ni permisos). */
export interface PreLogin {
  legajoId: number;
  apellidoNombre: string;
  habilitado: boolean;
  primerIngreso: boolean;
}

interface FacultadResumen {
  nombre?: string;
}

/**
 * Facultad que un administrador elige en el módulo Simulador Novedades para
 * reemplazar la facultad de la sesión (que en un administrador global es null).
 */
export interface FacultadSimulada {
  facultadId: number;
  nombre: string;
}

/**
 * Sesión persistida. Guardamos el `legajoId` y el token firmado emitido por
 * haberes-core. El token no contiene permisos ni flags: sólo identifica al
 * usuario, y el backend resuelve roles/permisos contra la base en cada request.
 * La facultad y el flag administrador se siguen revalidando en cada arranque
 * (ver `ensureSession`); nunca se persisten como datos derivados.
 */
interface StoredSession {
  version: 3;
  legajoId: number;
  token?: string | null;
}

interface LoginTokenResponse {
  token: string;
  expiresAt: string;
  legajoId: number;
  administrador: boolean;
}

const SESSION_KEY = 'haberes_user';
const SESSION_VERSION = 3;

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
   * Facultad simulada por un administrador en el módulo Simulador Novedades.
   * No se persiste: vive en memoria y se descarta con `clearSession()`.
   */
  private readonly facultadSimulada = signal<FacultadSimulada | null>(null);

  /**
   * Facultad efectiva de la sesión. Es el filtro que usan todas las pantallas de
   * Haberes; null cuando el usuario no tiene facultad asignada (módulos
   * globales, como Administrador).
   *
   * En el módulo Simulador Novedades un administrador puede reemplazarla por la
   * facultad que quiere inspeccionar. Los guards de acceso NO usan este computed:
   * leen `user.facultadId` de `ensureSession()`, para que la simulación nunca
   * otorgue acceso a otro módulo.
   */
  readonly facultadId = computed<number | null>(
    () => this.facultadSimulada()?.facultadId ?? this.currentUser()?.facultadId ?? null,
  );

  /** Nombre de la facultad simulada, para el aviso persistente del simulador. */
  readonly facultadSimuladaNombre = computed<string | null>(
    () => this.facultadSimulada()?.nombre ?? null,
  );

  /**
   * Flag `usuario.administrador` de la sesión validada. Con la regla vigente
   * (D1: aditivo estricto) el módulo Administrador exige además `facultadId == null`.
   */
  readonly esAdministrador = computed<boolean>(() => this.currentUser()?.administrador === 1);

  /** true cuando `facultadId` proviene de la simulación y no de la sesión. */
  readonly simulandoFacultad = computed<boolean>(
    () => this.esAdministrador() && this.facultadSimulada() !== null,
  );

  /** legajoId persistido, sin datos derivados que puedan quedar desactualizados. */
  private storedLegajoId: number | null;
  /** Token firmado de la sesión (se envía como Bearer a haberes-core). */
  private storedToken: string | null;
  /** true cuando la sesión ya se contrastó contra el backend en este arranque. */
  private sessionValidated = false;
  /** Validación en curso, compartida entre guards que se ejecuten en paralelo. */
  private validation$: Observable<Persona | null> | null = null;

  constructor() {
    const stored = this.readStoredSession();
    this.storedLegajoId = stored.legajoId;
    this.storedToken = stored.token;
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

  /** Token vigente para el interceptor HTTP. */
  get token(): string | null {
    return this.storedToken;
  }

  getPersona(legajoId: number): Observable<Persona> {
    return this.http.get<Persona>(`${this.personaUrl}/${legajoId}`);
  }

  /**
   * Datos mínimos para la pantalla de login (nombre y flags). Endpoint público:
   * no requiere token y no expone documento, CUIL, facultad ni permisos.
   */
  getDatosLegajo(legajoId: number): Observable<PreLogin> {
    return this.http.get<PreLogin>(`${this.apiBase}/core/auth/legajo/${legajoId}`);
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
    return this.http
      .post<LoginTokenResponse>(`${this.apiBase}/core/auth/login`, { legajoId, password, build: 1 })
      .pipe(
        switchMap((respuesta) => {
          if (!respuesta?.token) {
            return of({ success: false, error: 'Error en el servidor de autenticación' });
          }
          // El token se guarda antes de pedir el perfil: el interceptor lo envía
          // en las llamadas siguientes.
          this.storedToken = respuesta.token;
          this.storedLegajoId = legajoId;
          this.persistSession(legajoId, respuesta.token);

          return forkJoin({
            usuario: this.getUsuario(legajoId),
            persona: this.getPersona(legajoId),
          }).pipe(
            switchMap(({ usuario, persona }) => {
              if (!usuario?.usuarioId) {
                this.clearSession();
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
        catchError((error: HttpErrorResponse) => {
          this.storedToken = null;
          localStorage.removeItem(SESSION_KEY);
          return of({
            success: false,
            error: error?.status === 401
              ? 'ERROR: Password INCORRECTO'
              : 'Error en el servidor de autenticación',
          });
        }),
      );
  }

  setPassword(legajoId: number, password: string): Observable<void> {
    return this.http.put<void>(`${this.usuarioUrl}/setpassword`, { legajoId, password, build: 1 });
  }

  /**
   * Elige la facultad a simular en el módulo Simulador Novedades.
   *
   * Sólo un administrador global (sin facultad y con el flag) puede fijarla;
   * en cualquier otra sesión es un no-op. La elección no se persiste: se
   * descarta al cerrar sesión para no arrastrar un contexto viejo.
   */
  simularFacultad(facultad: FacultadSimulada | null): void {
    if (!this.esAdministrador()) return;
    this.facultadSimulada.set(facultad);
  }

  clearSession() {
    this.storedLegajoId = null;
    this.storedToken = null;
    this.sessionValidated = false;
    this.validation$ = null;
    this.facultadSimulada.set(null);
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
      administrador: usuario.administrador ?? 0,
      sede: persona.sede ?? 'Sede Central',
    };
    this.currentUserSubject.next(session);
    this.storedLegajoId = session.legajoId;
    this.persistSession(session.legajoId, this.storedToken);
    return session;
  }

  private persistSession(legajoId: number, token: string | null) {
    const payload: StoredSession = { version: SESSION_VERSION, legajoId, token };
    localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
  }

  /**
   * Lee la sesión persistida. Acepta el formato anterior (v2, sólo legajoId) y
   * cualquier Persona completa de versiones viejas: en esos casos el token
   * queda nulo y el usuario deberá volver a loguearse cuando el backend exija
   * token. Nunca se leen datos derivados (facultadId/administrador).
   */
  private readStoredSession(): { legajoId: number | null; token: string | null } {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return { legajoId: null, token: null };

    try {
      const parsed = JSON.parse(raw) as Partial<StoredSession> & { legajoId?: number };
      const legajoId = Number(parsed?.legajoId);
      if (!Number.isFinite(legajoId) || legajoId <= 0) {
        localStorage.removeItem(SESSION_KEY);
        return { legajoId: null, token: null };
      }
      const token = typeof parsed.token === 'string' && parsed.token.trim()
        ? parsed.token
        : null;
      if (parsed.version !== SESSION_VERSION) {
        this.persistSession(legajoId, token);
      }
      return { legajoId, token };
    } catch {
      localStorage.removeItem(SESSION_KEY);
      return { legajoId: null, token: null };
    }
  }
}
