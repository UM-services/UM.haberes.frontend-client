# Usuarios

Listado de usuarios de Haberes y habilitación del flag `administrador`. Consumida por la app
`administrador`.

- Alias: `@haberes/feature-usuarios`.
- Ruta: `/usuarios` (ver `apps/administrador/src/app/app.routes.ts`).
- Regla (plan `PLANIFICACION_CAMPO_ADMINISTRADOR_USUARIO_HABERES.md`): el módulo Administrador
  exige `facultadId == null` y `administrador == 1`; sólo se habilitan usuarios sin facultad,
  no se permite la auto-revocación y el backend exige que quede al menos un administrador.
- Pruebas: `npx nx test feature-usuarios` (usa el build de desarrollo de `administrador`).
