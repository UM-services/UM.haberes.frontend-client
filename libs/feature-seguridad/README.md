# feature-seguridad

Pantallas de administración del esquema RBAC de Haberes: permisos por usuario,
roles y matriz rol × permiso, catálogo de claves y simulador de permisos
efectivos. Se monta en `apps/administrador` y depende de los endpoints
`/api/haberes/core/{permiso,rol,rolPermiso,usuarioRol,usuarioPermiso,permisoEfectivo}`.
