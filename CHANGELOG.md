# Changelog

## [0.3.1] - 2026-07-10

### Added
- **chore(ci):** Nuevo workflow `docker-publish.yml` para build y push automático de imágenes Docker a Docker Hub.
  - Pipeline matricial que construye imágenes para `liquidacion` y `novedades` en paralelo.
  - Trigger en push a `main`, con cache de capas via GitHub Actions Cache (GHA).
  - Tags automáticos: `latest` y `sha` del commit.
  - Autenticación via secrets `DOCKER_USERNAME` y `DOCKER_PASSWORD`.

### Changed
- **chore(docs):** Actualizado `actions/checkout` de `v4` a `v6` en `generate-docs.yml` para consistencia con `docker-publish.yml`.

## [0.3.0] - 2026-05-13

### Added
- **feat(`feature-designaciones`):** Nueva librería `AsigCursosComponent` para asignación de cursos docentes.
  - Componente `AsigCursosComponent` con gestión completa de altas, bajas y cambios de cargos docentes por curso.
  - Búsqueda de cursos por sede y filtro textual, con grilla de plantel docente actual (titulares y contratados).
  - Formularios de propuesta de novedades (alta/baja/cambio) con validación de acreditación y límite de novedades.
  - Auto-detección de cambios (horas, desarraigo, cambio de cargo) con baja automática del cargo anterior.
  - Servicio `AsignacionCursosService` para API REST de cursos, cargos tipos, geográficas, acreditación y novedades.
  - Reporte PDF de novedades docentes por facultad y período (`/api/haberes/report/novedades/novedadesDocentes`).
- **feat(`feature-cargos`):** Nuevo componente `DocentesSedeComponent` para reporte de docentes por sede.
  - Selector de sede geográfica con carga desde API (`/api/haberes/core/geografica`) y período (mes/año).
  - Descarga de reporte PDF de docentes por sede (`/api/haberes/report/docentes/docentesSede`).
  - Métodos `downloadDocentesSedeReport()` y `getGeograficas()` en `CargosReportService`.
- **feat(`novedades`):** Nuevas rutas `/docentes-sede` y `/asig-cursos` con ítems en el menú lateral.
  - Orden del menú: Asignación Cursos, Docentes por Sede, Cargos x Legajo, Anotador, Designaciones.

### Fixed
- **fix(`feature-cargos`):** Renombrada propiedad `reportUrl` a `cargosReportUrl` en `CargosReportService` para claridad semántica.

### Changed
- **chore(`feature-designaciones`):** Exportado `AsigCursosComponent` desde el barrel `index.ts`.
- **chore(`feature-cargos`):** Exportado `DocentesSedeComponent` desde el barrel `index.ts`.

## [0.2.0] - 2026-05-12

### Added
- **feat(`feature-anotador`):** Nueva librería para gestión de anotaciones docentes.
  - Componente `AnotadorComponent` con búsqueda de personas (por legajo o nombre), historial de anotaciones, lista de pendientes/revisados por facultad/período, y alta de nuevas anotaciones.
  - Integración con acreditación (validación de límite de novedades antes de permitir agregar).
- **feat(`feature-cargos`):** Nueva librería para reportes de cargos por legajo.
  - Componente `CargosLegajoComponent` con búsqueda de personas y descarga de reporte PDF detallado de cargos (`/api/haberes/report/bono/detalleCargos`).
- **feat(`novedades`):** Nuevas rutas `/anotador` y `/cargos` con ítems en el menú lateral de navegación.

### Fixed
- **fix(`feature-designaciones`):** Exportado `DesignacionesService` desde el barrel `index.ts` para permitir su reutilización por otras librerías.

### Changed
- **chore(`tsconfig.base.json`):** Agregados path mappings para `@haberes/feature-anotador` y `@haberes/feature-cargos`.

## [0.1.0] - 2026-05-11

### Added
- Initial release del proyecto `um.haberes.frontend-client`
- **Apps:**
  - `liquidacion`: Módulo de liquidación de haberes con autenticación y layout compartido
  - `novedades`: Módulo de gestión de designaciones con búsqueda de personas, visualización de cursos y designaciones fusionadas
- **Libraries:**
  - `@haberes/ui-layout`: Componentes compartidos de layout (navbar, sidebar)
  - `@haberes/ui-auth`: Componente de login con validación y cambio de contraseña
  - `@haberes/shared-api`: Servicios y guards de autenticación (AuthService, authGuard, unauthGuard)
  - `@haberes/feature-designaciones`: Feature module con DesignacionesComponent y DesignacionesService
- **Infraestructura:**
  - Monorepo Nx 22.7.1 con Angular 21.2 standalone
  - Dockerización multi-stage para cada app con Nginx + SSL + proxy reverso
  - Sustitución runtime de URL de backend via entrypoint script
  - Pipeline CI/CD con GitHub Actions para generación de documentación y deploy a GitHub Pages
  - Tailwind CSS 4 para estilos
  - Vitest para tests unitarios
  - ESLint con configuración flat para linting
