# @haberes/feature-cargos

Librería de reportes de cargos por legajo para el módulo de Novedades.

## Componentes

- **`CargosLegajoComponent`**: Componente standalone que permite:
  - Búsqueda de personas por legajo o nombre (con debounce y autocomplete).
  - Selección de persona y período (mes/año).
  - Descarga de reporte PDF detallado de cargos.

## Servicios

- **`CargosReportService`**: Servicio que consume el endpoint `/api/haberes/report/bono/detalleCargos/{legajoId}/{anho}/{mes}/{facultadId}` con respuesta tipo `Blob` para descarga de PDF.

## Dependencias

- `@haberes/shared-api` (AuthService)
- `@haberes/feature-designaciones` (DesignacionesService - búsqueda de personas)
- `HttpClient` para comunicación con API REST
