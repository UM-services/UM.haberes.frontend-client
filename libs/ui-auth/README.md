# @haberes/ui-auth

Componente de autenticación: login con validación de legajo y contraseña, más el modal de cambio de clave `<lib-cambio-clave-modal>` (`CambioClaveModalComponent`), que precarga la sesión, valida la coincidencia de la nueva clave y llama a `AuthService.changePassword` (`PUT /api/haberes/core/usuario/cambiarclave`, con la verificación de la clave anterior server-side). El botón "Cambiar clave" del `<ui-shell>` lo abre en cualquier momento.
