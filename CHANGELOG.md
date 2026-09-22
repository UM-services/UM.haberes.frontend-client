# Changelog

## [0.4.0] - 2026-09-22

### Added
- **feat(`feature-bonos`):** Nueva librería `@haberes/feature-bonos` para el bono individual del docente (migración de `prjBonos` VB6).
  - `BonoIndividualComponent`: validación de integridad del bono, preparación, descarga de PDF, registro de auditoría con legajo solicitante y envío por email con validación de casilla.
  - `BonoReportService` sobre `/api/haberes/core/bono` y `/api/haberes/report/bono` (endpoints de front `/ui/generatePdf` y `/ui/sendBono`; la IP de auditoría la resuelve el backend, nunca el browser).
  - Modelos tipados (`IntegridadBonoResponse`, `ActividadResponse`, `BonoImpresionResponse`, etc.) exportados desde el barrel.
- **feat(`liquidacion`):** Nueva ruta lazy `/consultas/bono-individual` que monta `BonoIndividualComponent`.
- **feat(`liquidacion`):** Catálogo de opciones del sistema migrado de VB6 (`menu-options.data.ts`) con panel `/inicio` de búsqueda y filtrado por grupos funcionales, y rutas placeholder autogeneradas para las opciones aún no migradas.
- **feat(`ui-layout`):** Sidebar con menús colapsables por grupos (`MenuGroup`, input `menuGroups`); navbar con badge de entorno (label, color y tooltip con versión) junto al usuario.
- **feat(`shared-api`):** Indicador de entorno en runtime: token `APP_ENV_INFO` + `provideAppEnvInfo` (prefija el `document.title`) y `getEnvDisplay()` que normaliza `ENV_NAME` a LOCAL/DESARROLLO/STAGING/PRODUCCIÓN, mostrando "SIN DEFINIR" en rojo si falta.
- **feat(`shared-api`):** Token `API_URL` consumido por `AuthService` y `errorInterceptor` que cierra sesión y redirige a `/login` ante 401/403; ambos registrados en `app.config.ts` de las dos apps.
- **feat(apps):** `environment.development.ts` con `fileReplacements` en el target `build:development` de cada app: en `ng serve` el badge muestra LOCAL sin Docker.
- **feat(apps):** `entrypoint.sh` sustituye además `ENV_NAME_PLACEHOLDER` y `APP_VERSION_PLACEHOLDER` en los `.js` servidos, con defaults evidenciables (`desconocido`/`sin-version`).
- **feat(`package.json`):** Script `serve:all` que levanta novedades (4208) y liquidacion (4209) con concurrently.
- **feat(ci):** Nuevos workflows `ci.yml` (validación de PR a `main`: chequeo de sincronización package/lock, `npm ci`, `nx affected` de lint/test/build), `deploy-develop.yml` y `deploy-staging.yml` (verify + build + deploy multi-entorno).
- **chore(workspace):** Etiquetas `type:*`/`scope:*` en todos los proyectos y reglas `depConstraints` de dirección de dependencias en ESLint; path mapping `@haberes/feature-bonos`; targets de test (Vitest vía `@angular/build:unit-test`) para `shared-api`, `ui-layout` y `feature-bonos`.

### Changed
- **perf(`novedades`):** Todas las rutas pasan a lazy loading con `loadComponent`, eliminando los imports eager de las feature libraries.
- **ci(docker):** Los `Dockerfile` consumen el artefacto `dist/` pre-construido por el pipeline en lugar de compilar multi-stage en la imagen.
- **ci(nginx):** `proxy_pass` del gateway con variable y `resolver 127.0.0.11` para resolución DNS dinámica en Docker.
- **refactor(`shared-api`):** `AuthService.logout()` navega con `Router` en lugar de `window.location.href`; URLs derivadas de `API_URL`.
- **ui:** Puertos de desarrollo porteados a 4208 (novedades) y 4209 (liquidacion) alineados con `docker-compose.yml`; escala tipográfica global 87.5%; marca "Haberes" en navbar/sidebar.
- **chore(nx):** Inputs de lint/test limpiados de `karma.conf.js` obsoleto; fix de `npm ci` y lint en `package-lock.json` (PRs #11 y #12).

### Fixed
- **fix(`ui-layout`):** Especificación de `NavbarComponent` para el badge de entorno (label/color/tooltip y ausencia de badge sin `APP_ENV_INFO`).

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
