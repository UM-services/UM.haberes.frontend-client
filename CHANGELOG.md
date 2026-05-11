# Changelog

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
