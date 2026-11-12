# @haberes/ui-layout

Shell institucional compartido `<ui-shell>` (tema J2) para todas las apps: sidebar oscuro con marca de texto UM y módulo, menú polimórfico (lineal o agrupado), badge de entorno, perfil con sede y facultad, botón "Cambiar clave" (modal de `@haberes/ui-auth`), logout y header móvil accesible. Incluye además el tema compartido `src/styles/tokens.css` (tokens y clases de componente `um-*`) que importan las apps.

## Componentes compartidos

- **`<ui-opciones-panel>`** (`UiOpcionesPanelComponent`): panel principal de opciones con la presentación del hub de tesorería —
  cabecera con contador de disponibles, búsqueda en vivo y grilla de tarjetas `um-card` con estado estático
  (`disponible` en verde, "En desarrollo" en ámbar). Tipos `OpcionPanel` y `GrupoPanel`; cada app define sus grupos
  en datos (`apps/<app>/src/app/menu-options.data.ts`).
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

## Pipes

### `umImporte` — importes con formato argentino

Formatea números o textos numéricos con separador de miles `.`, decimal `,` y siempre dos
decimales (`1.234.567,89`), sin depender de `LOCALE_ID`. Los valores nulos o no numéricos se
muestran como `—`.

- Modo `numero` (default): sólo el número, para tablas cuyo encabezado ya indica el concepto.
- Modo `simbolo`: antepone `$` (`$ 16,50`), para vistas previas de campos editables.

```html
{{ categoria.basico | umImporte }}            <!-- 1.234.567,89 -->
{{ form.importes.doctorado | umImporte: 'simbolo' }} <!-- $ 120.000,00 -->
```

### `umFecha` — fechas `dd/MM/yyyy`

Formatea valores ISO-8601, epoch en ms o `Date` como `dd/MM/yyyy`, agregando `HH:mm` cuando el
dato trae una hora real. Los valores inválidos o vacíos se muestran como `—`.

- `auto` (default): muestra la hora sólo si es distinta de `00:00`.
- `siempre` / `nunca`: fuerza u oculta la hora.

Para fechas ISO **sin** zona se usan los componentes literales (no se corre el día); con zona se
interpreta el instante en la hora local del navegador.

## Componentes de formulario

### `<ui-input-fecha>` — fecha `dd/mm/aaaa` estable

`ControlValueAccessor` que muestra siempre `dd/mm/aaaa`, sin depender del locale del navegador ni
del sistema operativo (el `<input type="date">` nativo no se puede forzar). El valor del
formulario sigue siendo ISO `yyyy-MM-dd` o `''`, y se mantiene el calendario nativo opcional.

```html
<ui-input-fecha inputId="desde" formControlName="desde"></ui-input-fecha>
<ui-input-fecha inputId="nacimiento" [(valor)]="form.nacimiento" />
```

Inputs: `inputId` (para el `<label for="...">`), `placeholder` (`dd/mm/aaaa`) y `conCalendario`
(default `true`). Valida el formato (`fechaInvalida`) sin marcar como error un campo vacío.

## Directivas

### `[uiStickyFooter]` — barra de acciones fija al pie

Mantiene visibles los botones de acción (Guardar/Cancelar, copiar período, totales) mientras
se recorre una pantalla larga, sin quedar `fixed` encima del contenido: al llegar al final, la
barra se apoya en su lugar del flujo y no tapa la última fila.

- Selector: `uiStickyFooter` (`StickyFooterDirective`, standalone).
- Clase de tema: `.um-sticky-footer` en `src/styles/tokens.css`.
- No requiere inputs.

```html
<div uiStickyFooter>
  <p class="text-xs text-um-muted">Período {{ periodoTexto }}</p>
  <div class="flex flex-wrap gap-2">
    <button type="button" class="um-btn-secondary">Copiar período anterior</button>
    <button type="button" class="um-btn-primary">Guardar</button>
  </div>
</div>
```

Requisitos:

- Debe ser el **último elemento** del contenido que scrollea.
- Entre la barra y el contenedor con scroll no puede haber un ancestro con
  `overflow: hidden`/`auto`: `position: sticky` se ancla a ese ancestro.
- La barra trae borde superior, fondo `bg-white/95`, `backdrop-blur`, `flex-wrap` y
  `justify-between`. Se puede ajustar por pantalla con utilidades (`justify-end`, `mt-2`,
  `bottom-14` si hay una barra inferior); las utilidades pisan la capa de componentes.

Se usa en **Control del Período** (`feature-control-periodo`). El mismo criterio sirve para
cualquier listado con acciones al final; por ejemplo, los comprobantes del módulo de pagos de
tesorería (ese repo tiene su copia equivalente de la directiva).
