# Um Haberes Frontend Client

![Angular](https://img.shields.io/badge/Angular-22.1.8-DD0031?logo=angular&logoColor=white)
![Nx](https://img.shields.io/badge/Nx-23.3.0-143055?logo=nx&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0.3-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-4.1.11-6E9F18?logo=vitest&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-1.64.0-2EAD33?logo=playwright&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20%2B-5FA04E?logo=nodedotjs&logoColor=white)
![npm](https://img.shields.io/badge/npm-11.6.2-CB3837?logo=npm&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-multietapa-2496ED?logo=docker&logoColor=white)
![Nginx](https://img.shields.io/badge/Nginx-SSL-009639?logo=nginx&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-CI%2FCD-2088FF?logo=githubactions&logoColor=white)

Frontend corporativo para la gestión de haberes universitarios. Monorepo Nx con aplicaciones Angular 22 standalone.

## Estructura del Proyecto

```
um.haberes.frontend-client/
├── apps/
│   ├── administrador/        # App de Administración de parámetros de Haberes
│   ├── liquidacion/          # App de Liquidación de Haberes
│   ├── novedades/            # App de Gestión de Novedades, Designaciones, Anotaciones y Cargos
│   └── novedades-e2e/        # Tests E2E (Playwright) de novedades
├── libs/
│   ├── ui-layout/            # @haberes/ui-layout — Shell institucional J2 unificado (ui-shell, ui-opciones-panel)
│   ├── ui-auth/              # @haberes/ui-auth — Login y cambio de clave J2
│   ├── shared-api/           # @haberes/shared-api — AuthService, guards, env
│   ├── feature-designaciones/# @haberes/feature-designaciones — Designaciones y asignación de cursos
│   ├── feature-anotador/     # @haberes/feature-anotador — Anotaciones docentes
│   ├── feature-cargos/       # @haberes/feature-cargos — Cargos del legajo, docentes sede y asignación de cargos
│   ├── feature-bonos/        # @haberes/feature-bonos — Bono individual del docente
│   ├── feature-liquidacion/  # @haberes/feature-liquidacion — Liquidación individual por legajo
│   ├── feature-consultas/    # @haberes/feature-consultas — Consultas y reportes de liquidación
│   ├── feature-contabilidad/ # @haberes/feature-contabilidad — Imputación contable y asientos individuales
│   ├── feature-personas/     # @haberes/feature-personas — Datos personales y CBU
│   ├── feature-categorias/   # @haberes/feature-categorias — Categorías y básicos
│   ├── feature-codigos/      # @haberes/feature-codigos — Códigos de concepto y grupos
│   ├── feature-clases/       # @haberes/feature-clases — Clases y valor hora
│   ├── feature-cargos-clase/ # @haberes/feature-cargos-clase — Cargos con clase
│   ├── feature-adicionales/  # @haberes/feature-adicionales — Adicional carga horaria
│   ├── feature-sedes/       # @haberes/feature-sedes — Sedes y desarraigo
│   ├── feature-control-periodo/ # @haberes/feature-control-periodo — Control del período
│   └── feature-usuarios/     # @haberes/feature-usuarios — Usuarios y flag administrador
└── docs/
    └── architecture.mermaid  # Diagrama de arquitectura
```

## Aplicaciones

| App | Puerto Dev | Descripción |
|---|---|---|
| `novedades` | 4208 | Módulo de novedades, designaciones, anotaciones y reportes de cargos docentes |
| `liquidacion` | 4209 | Módulo de liquidación de haberes y catálogo central de operaciones |
| `administrador` | 4211 | Módulo de administración de parámetros, restringido a usuarios sin facultad asignada y con el flag `administrador` de Haberes habilitado |

## Librerías

| Librería | Alias | Propósito |
|---|---|---|
| `ui-layout` | `@haberes/ui-layout` | Layout compartido: shell institucional oscuro J2 (`ui-shell`), soporte polimórfico (menú lineal o acordeón), badge de entorno, usuario y cambio de clave; buscador estándar (`ui-persona-search`), panel de opciones (`ui-opciones-panel`), pantalla de acceso restringido (`ui-no-acceso`), aviso de inactividad (`ui-inactividad`), botón de solicitud de acceso (`ui-solicitar-acceso`), pipes `umImporte`/`umFecha`, input de fecha `ui-input-fecha` y directiva `[uiStickyFooter]` |
| `ui-auth` | `@haberes/ui-auth` | Formulario de login corporativo bajo diseño J2 (marca sólo texto) y modal de cambio de clave (`lib-cambio-clave-modal`) |
| `shared-api` | `@haberes/shared-api` | Lógica de autenticación, interceptores, indicador de entorno (`APP_ENV_INFO`) y guards de rutas |
| `feature-designaciones` | `@haberes/feature-designaciones` | Búsqueda y visualización de designaciones, asignación de cursos docentes (altas/bajas/cambios) |
| `feature-anotador` | `@haberes/feature-anotador` | Anotaciones docentes (pendientes/revisados, historial, alta) |
| `feature-cargos` | `@haberes/feature-cargos` | Reportes de cargos por legajo y docentes por sede (descarga PDF), más la asignación de cargos **no docentes** y facultades habilitadas del agente (`/liquidacion/asig-cargos`) |
| `feature-etec-asignaciones` | `@haberes/feature-etec-asignaciones` | Asignación de cargos ETEC (cargo por puntos): alta y baja con dependencia, fechas, observaciones, valor del punto del período e importe estimado (`/liquidacion/etec/asig-cargos`) |
| `feature-bonos` | `@haberes/feature-bonos` | Bono individual: integridad, PDF, auditoría y envío por email |
| `feature-liquidacion` | `@haberes/feature-liquidacion` | Liquidación individual por legajo y período: ficha, cargos, novedades, generación de cargos, liquidación y totales |
| `feature-consultas` | `@haberes/feature-consultas` | Consultas y reportes de liquidación: totales, comparaciones, planillas académicas y bonos por dependencia, con tabla y descargas PDF/XLSX del mismo contenido |
| `feature-contabilidad` | `@haberes/feature-contabilidad` | Imputación contable por legajo, balances Debe/Haber y asientos individuales |
| `feature-personas` | `@haberes/feature-personas` | Datos personales, contacto y CBU por período |
| `feature-categorias` | `@haberes/feature-categorias` | Categorías, básicos, puntos ETEC, flags y vigencia mensual |
| `feature-codigos` | `@haberes/feature-codigos` | Códigos de concepto, grupo contable y conceptos AFIP |
| `feature-clases` | `@haberes/feature-clases` | Clases de hora cátedra y valor hora |
| `feature-cargos-clase` | `@haberes/feature-cargos-clase` | Cargos con clase y asignaciones por período |
| `feature-adicionales` | `@haberes/feature-adicionales` | Rangos de adicional por carga horaria |
| `feature-sedes` | `@haberes/feature-sedes` | Sedes, desarraigo y sede de reemplazo |
| `feature-control-periodo` | `@haberes/feature-control-periodo` | Control del período: fechas, alícuotas, topes SIJP y modo de liquidación |
| `feature-usuarios` | `@haberes/feature-usuarios` | Usuarios de Haberes y habilitación del flag `administrador` (`/usuarios`) |

## Sistema de Diseño Institucional (J2)

Todas las aplicaciones comparten el tema visual **J2** institucional de 4 capas, definido en `libs/ui-layout/src/styles/tokens.css` e importado por cada `apps/<app>/src/styles.css`:

- **Tokens (`@theme static`)**: Paleta `um-*` (`bg-um-sidebar`, `text-um-ink`, `border-um-border`, `bg-um-surface`, `text-um-primary`), tipografía Inter institucional, espaciados y radios. Es la única fuente de colores corporativos.
- **Base y Densidad (`@layer base`)**: Escala global del `87.5%` (~14px base) para maximizar la densidad visual en escritorio, normalización de spinners numéricos y cifras tabulares (`tabular-nums`) para alineación contable precisa.
- **Shell Estructural (`<ui-shell>`)**: Shell J2 (`@haberes/ui-layout`) con sidebar oscuro institucional, badge de ambiente coloreado según entorno (`APP_ENV_INFO`), usuario, sede, cambio de clave, logout y menú polimórfico (lineal para `novedades` y agrupado para `liquidacion`).
- **Utilidades de Componentes (`@layer components`)**: Clases semánticas `.um-*`: `.um-page-header`, `.um-eyebrow`, `.um-page-title`, `.um-page-desc`, `.um-label`, `.um-input` (`.um-input-invalid`), `.um-btn-primary`, `.um-btn-secondary`, `.um-card`, `.um-badge`, `.um-alert` (`-error`, `-warn`, `-success`), `.um-table` y `.um-sticky-footer`.
- **Pipes y controles compartidos**: `umImporte` (importes en `1.234.567,89`, con modo `'simbolo'`), `umFecha` (`dd/MM/yyyy` con hora opcional), `ui-input-fecha` (fecha `dd/mm/aaaa` estable, valor ISO) y `[uiStickyFooter]` (barra de acciones fija al pie) viven en `@haberes/ui-layout`; no se reimplementan por pantalla.
- **Marca institucional**: La marca del shell y del login es siempre texto (`UM · Haberes` + nombre del módulo en el sidebar; `um-eyebrow`/`um-page-title` en login), espejo de tesoreria-frontend; no se usan logos ni imágenes de marca.
- **Nomenclatura limpia**: Prohibición de términos o referencias a Visual Basic 6 (`.frm`, `.vbp`, etc.) en cualquier título, badge o etiqueta visible al usuario. Ver detalle completo en [AGENTS.md](AGENTS.md).

## Comandos de Desarrollo

```bash
# Servir app en desarrollo
nx serve liquidacion
nx serve novedades
nx serve administrador

# Build producción
nx build liquidacion --configuration=production
nx build novedades --configuration=production
nx build administrador --configuration=production

# Tests
nx test liquidacion
nx test novedades
nx test administrador

# Tests E2E (levanta novedades en 4208; BASE_URL apunta a una app desplegada)
nx e2e novedades-e2e

# Linting
nx lint liquidacion
nx lint novedades

# Graph de dependencias Nx
nx graph
```

## Arquitectura

Cada app es un SPA independiente servido por Nginx con SSL. Las peticiones `/api/` se redirigen al backend `haberes-gateway-service:8091`. La URL del backend se inyecta en runtime mediante variables de entorno. La imagen se construye con el multinodo `docker/app.Dockerfile` (ver sección Docker).

Ver [docs/architecture.mermaid](docs/architecture.mermaid) para el diagrama de arquitectura.

## Docker

La imagen es **multietapa**: compila la app con Nx *dentro* del contenedor, por
lo que depende sólo del código fuente y nunca de un `dist/` local (reconstruir
la imagen siempre refleja el working tree).

```bash
# Build de una app (requiere exportar LOCAL_RESOURCE si usás compose)
docker build -f docker/app.Dockerfile --build-arg APP=novedades -t um-haberes-novedades-client .

# O vía compose, conservando nombre de imagen y red del stack:
npm run docker:app -- novedades        # build + up -d
npm run docker:app -- liquidacion --no-up
npm run docker:app -- administrador    # módulo administrador (4211)

# Ejecutar con backend personalizado + entorno/version
docker run -e BACKEND_URL=http://backend:8091 -e ENV_NAME=develop -e APP_VERSION=abc123 -p 443:443 um-haberes-novedades-client
```

La config propia de cada app (`nginx.conf`, `entrypoint.sh`) sigue viviendo en
`apps/<app>/`; `docker/app.Dockerfile` sólo parametriza el nombre con `APP=`.

## Indicador de entorno (runtime)

La SPA se compila **una sola vez** con placeholders y cada contenedor los
sustituye al arrancar (misma imagen en todos los entornos). El `entrypoint.sh`
del Nginx reemplaza en los `.js` servidos:

| Placeholder | Variable de entorno | Default si falta |
|---|---|---|
| `BACKEND_URL_PLACEHOLDER` | `BACKEND_URL` | se deja intacto (aviso en log) |
| `ENV_NAME_PLACEHOLDER` | `ENV_NAME` | `desconocido` → badge rojo |
| `APP_VERSION_PLACEHOLDER` | `APP_VERSION` | `sin-version` |

El valor de `ENV_NAME` se normaliza y muestra como badge junto al usuario y como
prefijo del `document.title`: `local`→LOCAL, `develop/dev`→DESARROLLO,
`staging`→STAGING, `production/prod`→PRODUCCIÓN; cualquier otro valor (incluido
el placeholder sin reemplazar) se muestra como **SIN DEFINIR** en rojo.

En el `.env` de cada server (donde ya vive `BACKEND_URL`) agregar:

```dotenv
# compose local   → ENV_NAME=local
# env-develop/.env    → ENV_NAME=develop
# env-staging/.env    → ENV_NAME=staging
# env-production/.env → ENV_NAME=production
```

Y propagar las variables en el bloque `environment` del servicio frontend del
`docker-compose.yml` (usar `${GITHUB_SHA}` del pipeline como `APP_VERSION`):

```yaml
services:
  novedades:
    environment:
      BACKEND_URL: ${BACKEND_URL}
      ENV_NAME: ${ENV_NAME}
      APP_VERSION: ${APP_VERSION}
```

> En `ng serve` / build `development` no interviene Docker: se usa
> `environment.development.ts` (`env: 'local'`) vía `fileReplacements` en el
> `project.json` de cada app, por lo que el badge muestra LOCAL en local.

## CI/CD

Los tres entornos comparten un único pipeline reutilizable (`deploy-pipeline.yml`)
que ejecuta `verify` (`npm ci` + lint + test, y build de producción sólo en PR),
`publish-docker` (Buildx + push a Docker Hub compilando dentro de la imagen
multietapa `docker/app.Dockerfile`, matriz desde el input `apps`) y `deploy`
(matriz de runners self-hosted vía `deployRunners`, sólo `develop`/`staging`;
`develop` despliega en un runner y `staging` en dos: `staging` y `staging-new`).

| Workflow | Trigger | Descripción |
|---|---|---|
| `ci.yml` | PR a `main` | Validación affected con `npm ci`: lint, test y build de los proyectos impactados. |
| `deploy-pipeline.yml` | `workflow_call` | Pipeline reutilizable de verify + publish (imagen multietapa) + deploy (fuente única para los tres entornos). |
| `docker-publish.yml` | Push a `main` | Llama al pipeline con environment `production`; publica imágenes Docker Hub con tags `<sha>` + `latest`. |
| `deploy-develop.yml` | PR/push a `develop` | Llama al pipeline con environment `develop`; publica `<sha>` y despliega vía runner self-hosted. |
| `deploy-staging.yml` | PR/push a `staging` | Llama al pipeline con environment `staging`; publica `<sha>` y despliega vía runner self-hosted. |
| `generate-docs.yml` | Push a `main` | Genera dashboard documental en GitHub Pages con grafo Nx, historial de commits/PRs y diagrama de arquitectura. |

## Tecnologías

- Angular 22.1.8 (standalone components)
- Nx 23.3.0
- Tailwind CSS 4
- TypeScript 6.0.3
- Vitest
- Playwright (E2E)
- Docker + Nginx
