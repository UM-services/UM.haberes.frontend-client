# @haberes/novedades-menu

Datos de navegación compartidos por `apps/novedades` y `apps/simulador-novedades`.

- **`NOVEDADES_MENU_ITEMS`**: opciones del menú lateral (`ShellMenuItem[]`), en el mismo orden
  que el módulo real.
- **`NOVEDADES_GRUPOS`**: agrupaciones del panel principal (`GrupoPanel[]`).

Mantener ambas listas en esta librería evita que el simulador derive del módulo que replica:
agregar o renombrar una pantalla de Novedades se hace una sola vez.
