# @haberes/shared-api

Capa de API compartida: AuthService para gestión de sesión, authGuard y unauthGuard para protección de rutas, y PersonaSearchService como acceso único al buscador de personas de haberes-core (`/api/haberes/core/persona`: `POST /search` multi-término, `GET /{legajoId}` y `GET /documento/{documento}`), consumido por el componente estándar `ui-persona-search` de `@haberes/ui-layout`.
