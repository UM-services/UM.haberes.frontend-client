# @haberes/feature-designaciones

Feature module para gestión de designaciones docentes y asignación de cursos.

## Componentes

- **`DesignacionesComponent`**: Componente standalone que permite:
  - Búsqueda de personas con el buscador estándar `ui-persona-search` (multi-término, selección por teclado).
  - Visualización de cursos asignados (cargos) y designaciones fusionadas por facultad y período.

- **`AsigCursosComponent`**: Componente standalone que permite:
  - Búsqueda y filtro de cursos por sede geográfica y texto.
  - Visualización del plantel docente actual (titulares y contratados) por curso.
  - Propuesta de altas, bajas y cambios de cargos docentes con validación de acreditación.
  - Auto-detección de cambios (horas, desarraigo) y baja automática del cargo anterior.
  - Gestión de novedades pendientes (alta, baja, y eliminación).
  - Descarga de reporte PDF de novedades docentes por facultad y período.

## Servicios

- **`DesignacionesService`**: consulta de cursos cargo y cursos fusión para una persona. La búsqueda de personas ya no vive acá: las pantallas usan el buscador estándar `ui-persona-search` (ver `@haberes/ui-layout`).
- **`AsignacionCursosService`**: API REST para gestión de cursos, cargos tipos, geográficas, acreditación y novedades de curso-cargo.

## Dependencias

- `@haberes/shared-api` (AuthService)
- `HttpClient` para comunicación con API REST
