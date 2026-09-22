# Um Haberes Frontend Client

Frontend corporativo para la gestión de haberes universitarios. Monorepo Nx con aplicaciones Angular 21 standalone.

## Estructura del Proyecto

```
um.haberes.frontend-client/
├── apps/
│   ├── liquidacion/          # App de Liquidación de Haberes
│   └── novedades/            # App de Gestión de Novedades, Designaciones, Anotaciones y Cargos
├── libs/
│   ├── ui-layout/            # @haberes/ui-layout — Navbar y Sidebar compartidos
│   ├── ui-auth/              # @haberes/ui-auth — Componente de login
│   ├── shared-api/           # @haberes/shared-api — AuthService, guards
│   ├── feature-designaciones/# @haberes/feature-designaciones — Designaciones y asignación de cursos
│   ├── feature-anotador/     # @haberes/feature-anotador — Anotaciones docentes
│   ├── feature-cargos/       # @haberes/feature-cargos — Reportes de cargos legajo y docentes sede
│   └── feature-bonos/        # @haberes/feature-bonos — Bono individual del docente
└── docs/
    └── architecture.mermaid  # Diagrama de arquitectura
```

## Aplicaciones

| App | Puerto Dev | Descripción |
|---|---|---|
| `novedades` | 4208 | Módulo de novedades, designaciones, anotaciones y reportes de cargos docentes |
| `liquidacion` | 4209 | Módulo de liquidación de haberes |

## Librerías

| Librería | Alias | Propósito |
|---|---|---|
| `ui-layout` | `@haberes/ui-layout` | Componentes de layout (navbar, sidebar) |
| `ui-auth` | `@haberes/ui-auth` | Formulario de login con validación |
| `shared-api` | `@haberes/shared-api` | Lógica de autenticación y guards de rutas |
| `feature-designaciones` | `@haberes/feature-designaciones` | Búsqueda y visualización de designaciones, asignación de cursos docentes (altas/bajas/cambios) |
| `feature-anotador` | `@haberes/feature-anotador` | Anotaciones docentes (pendientes/revisados, historial, alta) |
| `feature-cargos` | `@haberes/feature-cargos` | Reportes de cargos por legajo y docentes por sede (descarga PDF) |
| `feature-bonos` | `@haberes/feature-bonos` | Bono individual: integridad, PDF, auditoría y envío por email |

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

# Linting
nx lint liquidacion
nx lint novedades

# Graph de dependencias Nx
nx graph
```

## Arquitectura

Cada app es un SPA independiente servido por Nginx con SSL. Las peticiones `/api/` se redirigen al backend `haberes-gateway-service:8091`. La URL del backend se inyecta en runtime mediante variables de entorno.

Ver [docs/architecture.mermaid](docs/architecture.mermaid) para el diagrama de arquitectura.

## Docker

```bash
# Build imagen Docker
docker build -t liquidacion -f apps/liquidacion/Dockerfile .
docker build -t novedades -f apps/novedades/Dockerfile .

# Ejecutar con backend personalizado + entorno/version
docker run -e BACKEND_URL=http://backend:8091 -e ENV_NAME=develop -e APP_VERSION=abc123 -p 443:443 liquidacion
```

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

| Workflow | Trigger | Descripción |
|---|---|---|
| `docker-publish.yml` | Push a `main` | Build y push de imágenes Docker a Docker Hub (matriz: `liquidacion`, `novedades`). Tags: `latest` + `sha`. |
| `generate-docs.yml` | Push a `main` | Genera dashboard documental en GitHub Pages con grafo Nx, historial de commits/PRs y diagrama de arquitectura. |

## Tecnologías

- Angular 21.2 (standalone components)
- Nx 22.7.1
- Tailwind CSS 4
- TypeScript 5.9
- Vitest
- Docker + Nginx
