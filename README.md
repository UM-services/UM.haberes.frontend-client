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
│   ├── feature-designaciones/# @haberes/feature-designaciones — Gestión de designaciones
│   ├── feature-anotador/     # @haberes/feature-anotador — Anotaciones docentes
│   └── feature-cargos/       # @haberes/feature-cargos — Reportes de cargos por legajo
└── docs/
    └── architecture.mermaid  # Diagrama de arquitectura
```

## Aplicaciones

| App | Puerto Dev | Descripción |
|---|---|---|
| `liquidacion` | 4200 | Módulo de liquidación de haberes |
| `novedades` | 4201 | Módulo de novedades, designaciones, anotaciones y reportes de cargos docentes |

## Librerías

| Librería | Alias | Propósito |
|---|---|---|
| `ui-layout` | `@haberes/ui-layout` | Componentes de layout (navbar, sidebar) |
| `ui-auth` | `@haberes/ui-auth` | Formulario de login con validación |
| `shared-api` | `@haberes/shared-api` | Lógica de autenticación y guards de rutas |
| `feature-designaciones` | `@haberes/feature-designaciones` | Búsqueda y visualización de designaciones |
| `feature-anotador` | `@haberes/feature-anotador` | Anotaciones docentes (pendientes/revisados, historial, alta) |
| `feature-cargos` | `@haberes/feature-cargos` | Reporte de cargos por legajo (descarga PDF) |

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

# Ejecutar con backend personalizado
docker run -e BACKEND_URL=http://backend:8091 -p 443:443 liquidacion
```

## Tecnologías

- Angular 21.2 (standalone components)
- Nx 22.7.1
- Tailwind CSS 4
- TypeScript 5.9
- Vitest
- Docker + Nginx
