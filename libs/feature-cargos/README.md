# @haberes/feature-cargos

Librería de reportes de cargos docentes para el módulo de Novedades.

## Componentes

- **`CargosLegajoComponent`**: Componente standalone que permite:
  - Búsqueda de personas por legajo o nombre (con debounce y autocomplete).
  - Selección de persona y período (mes/año).
  - Descarga de reporte PDF detallado de cargos por legajo.

- **`DocentesSedeComponent`**: Componente standalone que permite:
  - Selección de sede geográfica (cargada desde API) y período (mes/año).
  - Descarga de reporte PDF de docentes asignados a la facultad filtrado por sede y período.

## Servicios

- **`CargosReportService`**: Servicio que consume:
  - `GET /api/haberes/report/bono/detalleCargos/{legajoId}/{anho}/{mes}/{facultadId}` — Reporte PDF de cargos por legajo.
  - `GET /api/haberes/report/docentes/docentesSede/{facultadId}/{geograficaId}/{anho}/{mes}` — Reporte PDF de docentes por sede.
  - `GET /api/haberes/core/geografica/` — Listado de sedes geográficas.

## Dependencias

- `@haberes/shared-api` (AuthService)
- `@haberes/feature-designaciones` (DesignacionesService - búsqueda de personas)
- `HttpClient` para comunicación con API REST
