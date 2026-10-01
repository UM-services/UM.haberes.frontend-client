# @haberes/feature-anotador

Librería de gestión de anotaciones docentes para el módulo de Novedades.

## Componentes

- **`AnotadorComponent`**: Componente standalone que permite:
  - Búsqueda de personas con el buscador estándar `ui-persona-search`.
  - Visualización de anotaciones pendientes y revisadas por facultad y período.
  - Alta de nuevas anotaciones con validación de acreditación (límite de novedades).
  - Historial completo de anotaciones por persona.
  - Navegación entre meses/períodos.
  - Integración con el buscador estándar de personas (`ui-persona-search`).

## Dependencias

- `@haberes/shared-api` (AuthService)
- `@haberes/ui-layout` (buscador estándar `ui-persona-search`)
- `HttpClient` para comunicación con API REST (`/api/haberes/core/anotador`)
