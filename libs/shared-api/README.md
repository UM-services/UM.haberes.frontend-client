# @haberes/shared-api

Capa de API compartida: AuthService para gestión de sesión y cambio de clave (`changePassword` sobre `PUT /api/haberes/core/usuario/cambiarclave`, con el payload tipado `ChangePasswordRequest`), authGuard y unauthGuard para protección de rutas, y PersonaSearchService como acceso único al buscador de personas de haberes-core (`/api/haberes/core/persona`: `POST /search` multi-término, `GET /{legajoId}` y `GET /documento/{documento}`), consumido por el componente estándar `ui-persona-search` de `@haberes/ui-layout`.
