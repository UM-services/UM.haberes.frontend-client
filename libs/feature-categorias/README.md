# Categorías

ABM de categorías, básicos, flags y vigencia mensual. Consumida por la app `administrador`.

- Alias: `@haberes/feature-categorias`.
- Ruta: consulte `apps/administrador/src/app/app.routes.ts`.
- Buscador: filtro paginado server-side (`POST /core/categoria/search`, 50 filas por página).
- Pruebas: `npx nx test feature-categorias` (usa el build de desarrollo de `administrador`).
