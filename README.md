# Um Haberes Frontend Client

Frontend corporativo para la gestión de haberes universitarios. Monorepo Nx con aplicaciones Angular 21 standalone.

## Estructura del Proyecto

```
um.haberes.frontend-client/
├── apps/
│   ├── liquidacion/          # App de Liquidación de Haberes
│   ├── novedades/            # App de Gestión de Novedades, Designaciones, Anotaciones y Cargos
│   └── novedades-e2e/        # Tests E2E (Playwright) de novedades
├── libs/
│   ├── ui-layout/            # @haberes/ui-layout — Shell institucional J2 unificado (ui-shell, ui-opciones-panel)
│   ├── ui-auth/              # @haberes/ui-auth — Login y cambio de clave J2
│   ├── shared-api/           # @haberes/shared-api — AuthService, guards, env
│   ├── feature-designaciones/# @haberes/feature-designaciones — Designaciones y asignación de cursos
│   ├── feature-anotador/     # @haberes/feature-anotador — Anotaciones docentes
│   ├── feature-cargos/       # @haberes/feature-cargos — Reportes de cargos legajo y docentes sede
│   ├── feature-bonos/        # @haberes/feature-bonos — Bono individual del docente
│   └── feature-contabilidad/ # @haberes/feature-contabilidad — Imputación contable y asientos individuales
└── docs/
    └── architecture.mermaid  # Diagrama de arquitectura
```

## Aplicaciones

| App | Puerto Dev | Descripción |
|---|---|---|
| `novedades` | 4208 | Módulo de novedades, designaciones, anotaciones y reportes de cargos docentes |
| `liquidacion` | 4209 | Módulo de liquidación de haberes y catálogo central de operaciones |

## Librerías

| Librería | Alias | Propósito |
|---|---|---|
| `ui-layout` | `@haberes/ui-layout` | Layout compartido: shell institucional oscuro J2 (`ui-shell`), soporte polimórfico (menú lineal o acordeón), badge de entorno, usuario y cambio de clave; buscador estándar (`ui-persona-search`) y panel de opciones (`ui-opciones-panel`) |
| `ui-auth` | `@haberes/ui-auth` | Formulario de login corporativo bajo diseño J2 (marca sólo texto) y modal de cambio de clave (`lib-cambio-clave-modal`) |
| `shared-api` | `@haberes/shared-api` | Lógica de autenticación, interceptores, indicador de entorno (`APP_ENV_INFO`) y guards de rutas |
| `feature-designaciones` | `@haberes/feature-designaciones` | Búsqueda y visualización de designaciones, asignación de cursos docentes (altas/bajas/cambios) |
| `feature-anotador` | `@haberes/feature-anotador` | Anotaciones docentes (pendientes/revisados, historial, alta) |
| `feature-cargos` | `@haberes/feature-cargos` | Reportes de cargos por legajo y docentes por sede (descarga PDF) |
| `feature-bonos` | `@haberes/feature-bonos` | Bono individual: integridad, PDF, auditoría y envío por email |
| `feature-contabilidad` | `@haberes/feature-contabilidad` | Imputación contable por legajo, balances Debe/Haber y asientos individuales |

## Sistema de Diseño Institucional (J2)

Todas las aplicaciones comparten el tema visual **J2** institucional de 4 capas, definido en `libs/ui-layout/src/styles/tokens.css` e importado por cada `apps/<app>/src/styles.css`:

- **Tokens (`@theme static`)**: Paleta `um-*` (`bg-um-sidebar`, `text-um-ink`, `border-um-border`, `bg-um-surface`, `text-um-primary`), tipografía Inter institucional, espaciados y radios. Es la única fuente de colores corporativos.
- **Base y Densidad (`@layer base`)**: Escala global del `87.5%` (~14px base) para maximizar la densidad visual en escritorio, normalización de spinners numéricos y cifras tabulares (`tabular-nums`) para alineación contable precisa.
- **Shell Estructural (`<ui-shell>`)**: Shell J2 (`@haberes/ui-layout`) con sidebar oscuro institucional, badge de ambiente coloreado según entorno (`APP_ENV_INFO`), usuario, sede, cambio de clave, logout y menú polimórfico (lineal para `novedades` y agrupado para `liquidacion`).
- **Utilidades de Componentes (`@layer components`)**: Clases semánticas `.um-*`: `.um-page-header`, `.um-eyebrow`, `.um-page-title`, `.um-page-desc`, `.um-label`, `.um-input` (`.um-input-invalid`), `.um-btn-primary`, `.um-btn-secondary`, `.um-card`, `.um-badge`, `.um-alert` (`-error`, `-warn`, `-success`) y `.um-table`.
- **Marca institucional**: La marca del shell y del login es siempre texto (`UM · Haberes` + nombre del módulo en el sidebar; `um-eyebrow`/`um-page-title` en login), espejo de tesoreria-frontend; no se usan logos ni imágenes de marca.
- **Nomenclatura limpia**: Prohibición de términos o referencias a Visual Basic 6 (`.frm`, `.vbp`, etc.) en cualquier título, badge o etiqueta visible al usuario. Ver detalle completo en [AGENTS.md](AGENTS.md).

## Comandos de Desarrollo

```bash
# Servir app en desarrollo
nx serve liquidacion
nx serve novedades

# Build producción
nx build liquidacion --configuration=production
nx build novedades --configuration=production

# Tests
nx test liquidacion
nx test novedades

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
(runner self-hosted, solo `develop`/`staging`).

| Workflow | Trigger | Descripción |
|---|---|---|
| `ci.yml` | PR a `main` | Validación affected con `npm ci`: lint, test y build de los proyectos impactados. |
| `deploy-pipeline.yml` | `workflow_call` | Pipeline reutilizable de verify + publish (imagen multietapa) + deploy (fuente única para los tres entornos). |
| `docker-publish.yml` | Push a `main` | Llama al pipeline con environment `production`; publica imágenes Docker Hub con tags `<sha>` + `latest`. |
| `deploy-develop.yml` | PR/push a `develop` | Llama al pipeline con environment `develop`; publica `<sha>` y despliega vía runner self-hosted. |
| `deploy-staging.yml` | PR/push a `staging` | Llama al pipeline con environment `staging`; publica `<sha>` y despliega vía runner self-hosted. |
| `generate-docs.yml` | Push a `main` | Genera dashboard documental en GitHub Pages con grafo Nx, historial de commits/PRs y diagrama de arquitectura. |

## Tecnologías

- Angular 21.2 (standalone components)
- Nx 22.7.1
- Tailwind CSS 4
- TypeScript 5.9
- Vitest
- Playwright (E2E)
- Docker + Nginx
