# @haberes/ui-layout

Shell institucional compartido `<ui-shell>` (tema J2) para todas las apps: sidebar oscuro con marca UM y módulo, menú polimórfico (lineal o agrupado), badge de entorno, perfil con sede y facultad, logout y header móvil accesible. Incluye además el tema compartido `src/styles/tokens.css` (tokens y clases de componente `um-*`) que importan las apps.

## Componentes compartidos

- **`<ui-persona-search>`**: buscador estándar de personas de todos los formularios
  (equivale al modal `frmSearchREST` + `clsREPPersona.formSearch` del sistema legacy):
  la cadena se parte por espacios y cada palabra viaja como condición AND a
  `POST /api/haberes/core/persona/search`; se busca desde el primer carácter; las
  coincidencias se muestran como `Apellido, Nombre (legajo)`; la elección es por
  teclado (flechas + ENTER, ESC descarta) y recarga la persona completa vía
  `GET /api/haberes/core/persona/{legajoId}` antes de entregarla al formulario
  (`(seleccionada)`). El binding `[persona]` permite preselecciones desde el padre,
  y `limpiar()` resetea el campo sin emitir.

Usa `PersonaSearchService` de `@haberes/shared-api`. Ejemplo:

```html
<ui-persona-search
  label="Docente"
  [persona]="personaSeleccionada()"
  (seleccionada)="onPersonaSeleccionada($event)"
/>
```
