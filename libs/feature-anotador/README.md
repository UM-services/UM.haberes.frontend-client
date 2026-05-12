# @haberes/feature-anotador

Librería de gestión de anotaciones docentes para el módulo de Novedades.

## Componentes

- **`AnotadorComponent`**: Componente standalone que permite:
  - Búsqueda de personas por legajo o nombre (con debounce y autocomplete).
  - Visualización de anotaciones pendientes y revisadas por facultad y período.
  - Alta de nuevas anotaciones con validación de acreditación (límite de novedades).
  - Historial completo de anotaciones por persona.
  - Navegación entre meses/períodos.
  - Integración con `DesignacionesService` para búsqueda de personas.

## Dependencias

- `@haberes/shared-api` (AuthService)
- `@haberes/feature-designaciones` (DesignacionesService - búsqueda de personas)
- `HttpClient` para comunicación con API REST (`/api/haberes/core/anotador`)
