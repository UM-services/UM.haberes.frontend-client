# Changelog

## [0.18.0] - 2026-11-13

### Added

- **feat(`simulador-novedades`):** Nueva app (`:4212`) que replica las pantallas del módulo Novedades para administradores globales. Su login declara `requireFacultadId: false` + `requireAdministrador: true`; todas las rutas usan `[authGuard, moduloGuard, administradorGuard]`, las pantallas suman `facultadSimuladaGuard` y `/inicio` queda fuera de esa guard porque es donde se elige la facultad.
- **feat(`simulador-novedades`):** Barra `app-facultad-bar` proyectada dentro de `<ui-shell>`, visible en todas las pantallas: selector con el catálogo de haberes-core (`GET /api/haberes/core/facultad/`, cacheado con `shareReplay(1)` por `FacultadesSimuladorService`), aviso ámbar «Simulando como *facultad*» con la advertencia de que los cambios impactan datos reales, y estado de error con `mensajeDeError` si el catálogo no carga. Al cambiar de facultad se re-monta la pantalla activa (`onSameUrlNavigation: 'reload'`) y se limpia el aviso de acceso denegado.
- **feat(`simulador-novedades`):** Panel `/inicio` explica el paso pendiente mientras no hay facultad elegida y habilita el directorio de operaciones en cuanto se selecciona una.
- **feat(`shared-api`):** `AuthService.simularFacultad()`, `facultadSimuladaNombre` y `simulandoFacultad`; `facultadId` devuelve la facultad simulada mientras la simulación está activa. Sólo un usuario con `administrador === 1` puede fijarla (en otra sesión es no-op), vive en memoria, nunca se persiste en `localStorage` y `clearSession()` la descarta. Los guards siguen leyendo `user.facultadId` de `ensureSession()`, así que la simulación no otorga acceso a otro módulo.
- **feat(`shared-api`):** `facultadSimuladaGuard`: exige una facultad simulada activa y, si falta, vuelve a `/inicio` sin cerrar la sesión; sin sesión redirige a `/login`.
- **feat(`novedades-menu`):** Nueva librería `@haberes/novedades-menu` (`type:ui`, `scope:shared`) con `NOVEDADES_MENU_ITEMS` y `NOVEDADES_GRUPOS`, el menú lateral y el directorio del panel principal de Novedades.
- **feat(`ui-layout`):** `<ui-shell>` proyecta el contenido de la app (`<ng-content>`) al inicio del área principal; las apps que no proyectan nada no cambian.
- **feat(`simulador-novedades-e2e`):** Proyecto Playwright (chromium) con `BASE_URL` sobre `http://localhost:4212`: rechazo de usuarios con facultad y de usuarios sin el flag, ingreso del administrador con el pedido de facultad, habilitación del directorio y del aviso al seleccionar, y retorno al directorio cuando falta la selección.
- **feat(CI):** `simulador-novedades` se suma a las matrices `apps` de `deploy-develop.yml`, `deploy-staging.yml` y `docker-publish.yml`; `npm run serve:all` lo levanta en `4212`.

### Changed

- **feat(`novedades`):** El menú lateral y el directorio del panel dejan de vivir en la app (`menu-options.data.ts` se elimina) y pasan a `@haberes/novedades-menu`, para que `novedades` y `simulador-novedades` muestren exactamente las mismas opciones y en el mismo orden.
- **chore(build):** Nuevo alias `@haberes/novedades-menu` en `tsconfig.base.json`.
- **docs:** `README.md` documenta la app, la librería compartida, el puerto `4212` y los comandos de desarrollo; `libs/ui-layout/README.md` documenta la proyección de contenido de `<ui-shell>` y el uso de una librería compartida para los grupos del panel; `docs/architecture.mermaid` suma `simulador-novedades` y `novedades-menu`.

### Tests

- `facultad-simulada.guard.spec.ts`: acceso con facultad activa, retorno a `/inicio` sin cerrar la sesión y redirección a `/login` sin sesión.
- `auth.service.spec.ts`: un administrador simula otra facultad sin alterar la sesión ni `localStorage`, un usuario con facultad no puede simular, y `logout()` descarta la simulación.
- `ui-shell.spec.ts`: el contenido proyectado por la app aparece en la vista autenticada.
- `novedades-menu.data.spec.ts`: el menú cubre todas las pantallas, cada opción tiene label e ícono, el directorio replica el menú sin el panel y todas sus opciones están disponibles.
- `app.routes.spec.ts` (simulador): login con `requireFacultadId: false` + `requireAdministrador: true`, ruta pública de acceso restringido, guards en todas las rutas, `facultadSimuladaGuard` en cada pantalla, `/inicio` sin esa guard y pantallas idénticas a `NOVEDADES_MENU_ITEMS`.
- `app.spec.ts` (simulador): la app se crea y reutiliza el menú del módulo Novedades.
- `simulador.spec.ts` (E2E): usuario con facultad y usuario sin flag terminan en `/sin-acceso` conservando la sesión, el administrador entra y ve el pedido de facultad, la selección habilita el directorio y una pantalla sin facultad vuelve a `/inicio`.

## [0.17.0] - 2026-11-12

### Added

- **feat(`feature-control-periodo`):** Nueva librería y pantalla **Control del período** (`/control-periodo`): registro único por mes con los parámetros que consume la liquidación (fechas de liquidación, pago y depósito, alícuotas, topes SIJP, adicionales, estados docentes y modo de liquidación). Navegación `<`/`>` con rollover de año, recarga al cambiar año/mes, aviso de «período nuevo», badge de estado, `controlId` visible y confirmación cuando se descartan cambios sin guardar.
- **feat(`feature-control-periodo`):** **Copiar período anterior** con confirmación previa, aviso ámbar cuando las fechas copiadas no pertenecen al período destino y mensajes de negocio ante `409` (el período ya tiene datos) y `404` (el mes anterior está vacío).
- **feat(`feature-control-periodo`):** Validaciones de guardado: modo de liquidación y las cuatro fechas obligatorias, `desde ≤ hasta` e importes no negativos. El formulario envía siempre el registro completo y recarga desde el backend después de guardar.
- **feat(`feature-usuarios`):** Nueva librería y pantalla **Usuarios** (`/usuarios`, grupo **Seguridad** del módulo Administrador): listado de usuarios de Haberes (`GET /api/haberes/core/usuario/`) con legajo, apellido y nombre (resueltos con `POST /api/haberes/core/persona/legajos`), alcance (facultad o **Global**) y filtro en vivo por legajo, apellido o nombre. Cada fila habilita o revoca el flag `administrador` con `PUT /api/haberes/core/usuario/{legajoId}/administrador/{valor}`; la sesión actual queda marcada y no puede revocarse el flag a sí misma.
- **feat(`feature-usuarios`):** Sólo los usuarios sin facultad asignada pueden recibir el flag: el botón queda deshabilitado para el resto, el backend rechaza la habilitación y el sistema conserva siempre al menos un administrador. `UsuariosService` es el único cliente de los endpoints de usuarios y de personas por legajo.
- **feat(`shared-api`):** `Persona.administrador` (flag que viene de `usuario`, no de la persona) y `AuthService.esAdministrador`; la sesión revalida el flag contra haberes-core en cada arranque y **no** lo persiste en `localStorage`, igual que `facultadId`.
- **feat(`ui-layout`):** Pipes del design system `umImporte` (formato argentino fijo `1.234.567,89`, modo `'simbolo'` para anteponer `$` y `—` para valores vacíos) y `umFecha` (`dd/MM/yyyy`, con `HH:mm` cuando el dato trae hora real y modos `auto`/`siempre`/`nunca`), independientes de `LOCALE_ID`.
- **feat(`ui-layout`):** Componente `ui-input-fecha`, `ControlValueAccessor` que muestra siempre `dd/mm/aaaa` sin depender del locale del navegador, conserva el valor ISO `yyyy-MM-dd` y mantiene el calendario nativo opcional.
- **feat(`ui-layout`):** Directiva `[uiStickyFooter]` (clase de tema `.um-sticky-footer`) para barras de acciones fijas al pie con `position: sticky`: quedan visibles durante el scroll y no tapan el final del contenido.
- **feat(`feature-categorias`):** Soporte de **puntos ETEC** en el catálogo: columna en la grilla y campo en el formulario. Una categoría con `puntos > 0` se marca como docente, sin básico y sin liquidación por hora, porque se liquida como `puntos × valor del punto`.
- **feat(`feature-etec-asignaciones`):** Nueva pantalla **Asignación de Cargos ETEC** (`/liquidacion/etec/asig-cargos`): búsqueda estándar de persona (`<ui-persona-search>` + legajo/DNI exactos), alta, actualización y baja de asignaciones en `etec_asignacion_cargo` a través de `haberes-etec`. El select de cargos usa `GET /api/haberes/etec/cargo/` filtrado a `puntos > 0 && docente = 1`, la dependencia es obligatoria, y la lista muestra cargo, puntos, dependencia, alta, baja, estado, observaciones e importe del período.
- **feat(`feature-etec-asignaciones`):** Selector de período (año/mes con `<`/`>`) que consulta `GET /api/haberes/core/control/periodo/{anho}/{mes}/opcional` y calcula el importe de referencia como `puntos × valorPuntoEtec`, con aviso cuando el período no tiene valor de punto cargado.
- **feat(`liquidacion`):** Ruta lazy `liquidacion/etec/asig-cargos` con `authGuard` + `moduloGuard` y `DATOS_MODULO`; nueva opción **Asignación de Cargos ETEC** en el menú y en `RUTAS_MIGRADAS`.
- **feat(`administrador`):** Ruta lazy `control-periodo` con `canActivate: [authGuard, administradorGuard]`, ítem **Control del Período** al frente del grupo **Parámetros de cálculo**, y ruta lazy `usuarios` (`feature-usuarios`) con el grupo **Seguridad**; ambas con tarjeta en el panel de inicio.
- **feat(`shared-api`):** `lib/util/fecha.ts` expone `fechaInput` y `fechaPayload` para reconstruir el horario y el offset que devuelve el backend (`yyyy-MM-dd'T'HH:mm:ssXX`) sin correr el día; `fechaPayload` devuelve cadena vacía sin fecha.
- **feat(`haberes-core`):** `GET /api/haberes/core/control/periodo/{anho}/{mes}/opcional` devuelve `200` con el registro o con cuerpo vacío cuando el período es nuevo, sin el `400` del endpoint existente.
- **feat(`haberes-core`):** `POST /api/haberes/core/control/copiar/{anho}/{mes}` crea el período copiando literalmente el mes anterior (incluidas sus fechas); responde `409` si el período destino ya tiene datos y `404` si el anterior no existe. Nuevas excepciones `ControlYaExisteException` y `ControlOrigenException`.
- **feat(`haberes-etec`):** `FeignAuditActorConfig` propaga `X-Usuario-Legajo` / `X-Legajo-Solicitante` de la request entrante a las llamadas Feign hacia `haberes-core`, para que las escrituras ETEC queden auditadas con actor.

### Changed

- **feat(`administrador`):** El acceso al módulo deja de depender sólo de `facultadId == null`: `administradorGuard` exige `facultadId == null` **y** `usuario.administrador === 1`, y el login declara `requireAdministrador: true` para rechazar el ingreso de usuarios sin el flag. La regla es aditiva e implementa `PLANIFICACION_CAMPO_ADMINISTRADOR_USUARIO_HABERES.md` (D1); quienes ya usaban el módulo sin el flag necesitan habilitarlo desde **Usuarios**.
- **feat(`feature-categorias`):** El alta sugiere el siguiente `categoriaId` (máximo de la grilla y `getLast`) en un campo editable, con control de ID duplicado; en edición el ID queda fijo. El período deja de elegirse en pantalla y usa el año/mes del sistema, igual que el cliente anterior. Básico y estado docente muestran vista previa con `umImporte` y el panel de edición queda `sticky` en pantallas anchas.
- **feat(`feature-personas`, `feature-clases`, `feature-sedes`, `feature-cargos-clase`):** Los importes de grilla y formularios pasan a `umImporte` y las fechas de **Personas** a `ui-input-fecha`, en lugar de `number: '1.2-2'` y `<input type="date">`.
- **feat(`liquidacion`):** La opción y la pantalla existentes pasan a llamarse **Asignación de Cargos No Docentes** (`/liquidacion/asig-cargos`); la ruta, el circuito de `cargo` y la grilla (todos los cargos con badge Docente/No docente) no cambian.
- **feat(`liquidacion`):** `OpcionSistema.origenVb6` pasa a ser opcional: la opción ETEC no tiene formulario legacy de origen.
- **feat(`liquidacion`):** se elimina la opción placeholder **Control de Liquidación** (`/liquidacion/control`), que apuntaba al mismo formulario ya migrado al módulo Administrador y no tenía ruta implementada.
- **fix(`feature-control-periodo`):** el campo **Jubilación patronal** se guarda en `jubilpat`; el cliente anterior lo escribía en `osocipat` y lo pisaba, por lo que nunca se persistía.
- **docs:** `README.md` y `AGENTS.md` suman `feature-control-periodo`, `feature-usuarios` y `feature-etec-asignaciones`, y documentan la regla del flag `administrador`; `libs/ui-layout/README.md` documenta las pipes, `ui-input-fecha` y `[uiStickyFooter]`; `docs/architecture.mermaid` agrega las dependencias `administrador → feature-control-periodo`, `administrador → feature-usuarios` y `liquidacion → feature-etec-asignaciones`.

### Tests

- `ControlControllerTest`: período opcional con y sin datos, copia exitosa, `409` cuando el destino existe y `404` cuando falta el mes anterior.
- `ControlServiceTest`: copia campo por campo de los 40 importes, las fechas, los textos y el modo; período destino ocupado sin `save`; origen ausente sin `save`; rollover enero → diciembre.
- `control-periodo.service.spec.ts`: endpoint opcional y `null` para cuerpo vacío, catálogo de modos, `POST`/`PUT` con payload completo, copia sin body y propagación del `409`.
- `control-periodo.component.spec.ts`: período nuevo y existente, aviso de fechas fuera del período, navegación `<`/`>`, descarte cancelado, copia exitosa y bloqueada, mensaje de `409`, validaciones, guarda bloqueada cuando el año escrito no coincide con el período cargado y `POST` vs `PUT` conservando el offset de las fechas.
- `usuarios.component.spec.ts`: listado con nombres y alcance, filtro por legajo, apellido y nombre, y bloqueo de edición de la sesión actual y de los usuarios con facultad.
- `usuarios.service.spec.ts`: listado de usuarios, personas por legajo y `PUT` del flag con el valor en la ruta.
- `administrador.guard.spec.ts`: acceso con `facultadId == null` y `administrador == 1`, denegación sin el flag, denegación con facultad y sin sesión, siempre sin `clearSession()`.
- `auth.service.spec.ts`: el flag se expone desde la sesión revalidada, queda en `false` sin el flag y no se persiste en `localStorage`.
- `fecha.spec.ts`: recorte a `yyyy-MM-dd`, conservación de horario/offset (incluido `Z`), medianoche UTC en altas y cadena vacía.
- `importe.pipe.spec.ts`, `fecha.pipe.spec.ts`, `fecha-input.util.spec.ts`, `input-fecha.spec.ts` y `sticky-footer.directive.spec.ts`: formato argentino de importes y fechas, parseo/emisión ISO del input y clase de tema de la barra fija.
- `categorias.component.spec.ts`: sugerencia del siguiente `categoriaId` al crear.
- `asignaciones-etec.service.spec.ts`: catálogos en paralelo con filtro de cargos ETEC, listado por legajo, `POST` con barra final y `X-Legajo-Solicitante`, `PUT`/`DELETE` por id y valor del punto opcional (con y sin control).
- `asignaciones-etec.component.spec.ts`: catálogos y valor inicial, carga de asignaciones por persona, selector de período con recálculo de importe, aviso sin valor de punto, edición, dependencia obligatoria, `POST`/`PUT` con offset de fechas, baja cancelada y `409` de solape.
- `acceso-facultad.spec.ts` (E2E): el usuario simulado declara `administrador: 0`, acorde a la sesión que valida el `administradorGuard`.
- `FeignAuditActorConfigTest`: copia de headers con request asociada, sin request y respetando un header ya presente.

## [0.16.0] - 2026-11-10

### Added

- **feat(`feature-cargos`):** Nueva pantalla **Asignación de Cargos y Facultades** (`/liquidacion/asig-cargos`): búsqueda estándar con `<ui-persona-search>` más accesos exactos por legajo y DNI (`getPersonaByLegajo` / `getPersonaByDocumento`, disparados con ENTER y blur), grilla de cargos del agente con categoría, dependencia, básico, horas, jornada, presentismo y tipo (docente/no docente). El formulario permite **alta**, **actualización** y **baja** (con confirmación explícita); las fechas se envían con el horario y offset que devolvió el backend para no correr el día.
- **feat(`feature-cargos`):** Panel de **facultades habilitadas**: alta y baja de `personaFacultad` con confirmación, select limitado a las facultades que el agente todavía no tiene y mensaje específico ante `409` (facultad ya habilitada).
- **feat(`feature-cargos`):** Reglas de jornada y horas según la categoría: con `liquidaPorHora` la jornada queda en **Media** y las horas son editables; sin liquidación por hora las horas se envían en cero y la jornada se elige entre Media y Completa.
- **feat(`feature-cargos`):** `AsignacionCargosService` es el único cliente de `/api/haberes/core/cargo`, `/personaFacultad`, `/categoria/asignables`, `/dependencia` y `/facultad`; los catálogos se piden en paralelo con `forkJoin` y cada escritura envía `X-Legajo-Solicitante` para que haberes-core resuelva el actor de auditoría. `asignacion-cargos.models.ts` define el contrato tipado (`Cargo`, `CargoRequest`, `PersonaFacultad`, catálogos) y los helpers `fechaInput`, `fechaPayload`, `textoFecha`, `textoJornada` y `fechaHoy`.
- **feat(`liquidacion`):** Ruta lazy `liquidacion/asig-cargos` con `canActivate: [authGuard, moduloGuard]` y `data: DATOS_MODULO`, más su alta en `RUTAS_MIGRADAS`; la opción del menú deja de ser placeholder y su descripción pasa a "Alta, baja y actualización de cargos del agente y sus facultades habilitadas".
- **feat(`nx`):** `feature-cargos` pasa de `scope:novedades` a `scope:shared` (la consumen `novedades` y `liquidacion`) y `@haberes/feature-cargos` exporta la nueva pantalla, sus modelos y su servicio.

### Tests

- `asignacion-cargos.service.spec.ts`: catálogos en paralelo, listado por legajo, `POST`/`PUT`/`DELETE` de cargos con cabecera de auditoría, facultades habilitadas del legajo y alta/baja por `unique`.
- `asignacion-cargos.component.spec.ts`: estado inicial con catálogos, carga de cargos y facultades al elegir agente, jornada forzada y horas editables con categoría por hora, precarga del formulario al seleccionar un cargo, alta con recarga de grilla, edición conservando el offset de la fecha original, baja cancelada sin llamada al backend y mensaje de duplicado al habilitar una facultad existente.

### Changed

- **docs:** `README.md` describe `feature-cargos` como reportes de cargos y docentes por sede **más** la asignación de cargos y facultades, y el bloque de badges suma `npm` y GitHub Actions; `docs/architecture.mermaid` agrega la dependencia `liquidacion → feature-cargos (AsignacionCargos)`.

## [0.15.0] - 2026-11-09

### Added

- **feat(`feature-liquidacion`):** Nueva librería (`type:feature`, `scope:liquidacion`) para la pantalla **Liquidación Individual** (`/liquidacion/individual`). `LiquidacionIndividualService` es el único cliente del slice `/api/haberes/core/liquidacion-individual` (ficha del período, generar cargos, liquidar, eliminar liquidación, registrar y eliminar novedades) y de `/api/haberes/core/codigo/search`; las escrituras envían `X-Legajo-Solicitante` para que el backend resuelva actor e IP de auditoría. `liquidacion-individual.models.ts` define el contrato tipado de la ficha, sus cargos, novedades, ítems, acciones y respuestas de proceso.
- **feat(`feature-liquidacion`):** Pantalla **Liquidación Individual** (migración de `frmLiqIndividual.frm`): búsqueda estándar con `<ui-persona-search>` y accesos exactos por legajo y DNI, período con navegación `<` `>` y ajuste de año, y ficha con persona, control, antigüedad, liquidación, cargos no docentes, docentes y con clase, novedades e ítems calculados con totales remunerativo, no remunerativo, deducciones y neto. Las acciones (**Generar Cargos**, **Liquidar**, **Eliminar liquidación**, alta y baja de novedades) se habilitan según `acciones` del backend, respetan el bloqueo informado y permiten **Forzar** con confirmación explícita; cada operación muestra el mensaje de resultado o de negocio devuelto por el backend.
- **feat(`liquidacion`):** Ruta lazy `liquidacion/individual` con `canActivate: [authGuard, moduloGuard]` y `data: DATOS_MODULO`, y alta en `RUTAS_MIGRADAS`; el menú deja de abrir el placeholder y su descripción pasa a "Cálculo y recálculo de la liquidación de un legajo".
- **feat(`nx`):** Alias `@haberes/feature-liquidacion` en `tsconfig.base.json` y target `test` con `@angular/build:unit-test` atado a `liquidacion:build:development`.

### Changed

- **docs:** `README.md` incorpora `feature-liquidacion` al árbol del monorepo y a la tabla de librerías, `AGENTS.md` la suma al mapa del workspace y `docs/architecture.mermaid` agrega la dependencia `liquidacion → feature-liquidacion`.

### Fixed

- **fix(`feature-designaciones`):** **Fusionar Todos** separa la duplicación de la fusión: primero procesa los lotes de duplicación del mes anterior y luego relee los docentes del período, igual que el formulario legado (G1). Antes ambas lecturas salían en paralelo, por lo que un período vacío (el único caso donde se permite duplicar) terminaba con una fase de fusión sin legajos.
- **fix(`feature-designaciones`):** La verificación de cargos del período distingue `cargando`, `ok` y `error`: el botón **Fusionar Todos** y la casilla **Duplicar mes anterior** quedan deshabilitados mientras se verifica o si la consulta falla (fail closed), con badge *Verificando cargos del período...* / *Período sin verificar* (G2).
- **fix(`feature-designaciones`):** La cancelación se evalúa entre lotes: el lote ya encolado no se envía y el proceso no depura fusiones cuando se canceló.
- **fix(`feature-designaciones`):** Si falla la depuración de fusiones huérfanas, la pantalla informa **depuración pendiente** y pide reintentar el proceso (G3); el error de lectura de legajos con desarraigo usa ahora el mensaje específico en lugar del genérico del recálculo.

### Tests

- Especificaciones nuevas de `feature-liquidacion`: `LiquidacionIndividualService` (URLs de la ficha, cabecera `X-Legajo-Solicitante` en escrituras, `forzar` en el path y codificación de la búsqueda de códigos) y `LiquidacionIndividualComponent` (estado inicial, carga de ficha al seleccionar legajo, navegación de período con cambio de año, formato de antigüedad, alta de novedad S/N, mensaje de bloqueo y de éxito al liquidar).
- `fusion-todos.component.spec.ts` cubre la duplicación seguida de la relectura del período (G1), la no ejecución ante fallo de lectura y la verificación fallida del período (G2), la cancelación entre lotes, la acumulación de fallos, la depuración pendiente (G3) y el recálculo de desarraigo.

## [0.14.0] - 2026-11-08

### Added

- **feat(`shared-api`):** `AccesoDenegadoService` publica el último acceso denegado como señal (`tipo`: `permiso` | `modulo`, `mensaje`, `clave`, `modulo`, `origen` y `timestamp`) y descarta reportes idénticos repetidos dentro de 5 s. Es la vía no destructiva para explicar un 403 o una denegación de guard sin cerrar la sesión.
- **feat(`shared-api`):** `SIN_ACCESO_RUTA` (`sin-acceso`) es la ruta pública que cada app registra antes del wildcard; `moduloGuard` y `administradorGuard` redirigen allí con `router.parseUrl` en lugar de limpiar la sesión.
- **feat(`shared-api`):** `INACTIVIDAD_CONFIG` (`enabled`, `avisoMs`, `graciaMs`; por defecto 25 minutos de aviso y 2 minutos de gracia) y `SOPORTE_EMAIL` (vacío por defecto) permiten configurar el aviso de inactividad y el correo de la mesa de ayuda sin tocar los componentes.
- **feat(`ui-layout`):** `NoAccesoComponent` (`ui-no-acceso`) explica la denegación, ofrece **Volver**, **Ir al inicio** y el cierre de sesión explícito; `SolicitarAccesoComponent` (`ui-solicitar-acceso`) arma un `mailto:` con módulo, legajo y fecha cuando `SOPORTE_EMAIL` está configurado, y si no lo está indica pedir la habilitación a la mesa de ayuda.
- **feat(`ui-layout`):** `InactividadComponent` (`ui-inactividad`) escucha actividad del documento y, tras `avisoMs` sin interacción, muestra un modal con cuenta regresiva y las acciones **Seguir conectado** y **Cerrar sesión**. Al agotarse la gracia no expulsa al usuario: la sesión de Haberes no tiene token con `exp`, así que el cierre sólo ocurre por decisión explícita.
- **feat(`ui-layout`):** `<ui-shell>` monta `<ui-inactividad>` y muestra un banner `.um-alert-warn` con el mensaje del 403 (`avisoBanner`), su botón **Solicitar acceso** y **Cerrar**.
- **feat(`feature-consultas`):** **Bonos por Dependencia** genera el PDF consolidado en segundo plano. Tras `printPrepareDependencia` en el core, `ConsultasReportService.iniciarPdfBonoDependencia` (`POST /ui/bonoDependencia/pdf/{anho}/{mes}/{dependenciaId}/{salida}`) devuelve un `jobId`; la pantalla consulta `estadoPdfBonoDependencia` cada 1,5 s, muestra el avance (`X de Y`), lista los legajos que quedaron fuera del PDF y descarga el archivo con `descargarPdfBonoDependencia` al quedar `LISTO`. Si el job termina en `ERROR` muestra el mensaje del backend.

### Changed

- **feat(`shared-api`):** `errorInterceptor` separa **401** de **403**: un 401 de datos cierra la sesión y navega a `/login?motivo=sesion-expirada&returnUrl=…` (sin navegar si ya está en el login), mientras que un 403 no toca la sesión y publica su mensaje en `AccesoDenegadoService`. Las rutas `/login` e `/isuservalid` quedan excluidas para no destruir una sesión existente por credenciales inválidas.
- **fix(`ui-auth`):** el login muestra un aviso informativo (`um-alert-warn`) cuando vuelve con `motivo=sesion-expirada`.
- **fix(`liquidacion`):** el `nginx` del módulo amplía `proxy_read_timeout`/`proxy_send_timeout` a 180 s, porque la preparación del lote de bonos sigue siendo sincrónica aunque el PDF se genere en segundo plano.
- **docs:** `AGENTS.md` documenta la separación 401/403, la ruta pública `sin-acceso` y la regla de que las guards deniegan sin `clearSession()`; el README de `feature-consultas` actualiza los endpoints de Bonos por Dependencia al flujo por job.

### Fixed

- **fix(`shared-api`):** `moduloGuard` y `administradorGuard` ya no llaman a `clearSession()` al rechazar por facultad: redirigen a `sin-acceso`, de modo que un usuario autenticado no pierde la sesión por visitar un módulo que no le corresponde.

### Tests

- `error.interceptor.spec.ts` (401 con `returnUrl`, 403 que no navega y excluye login/`isuservalid`), `modulo.guard.spec.ts` actualizado a `UrlTree` hacia `sin-acceso` sin `clearSession`, `no-acceso.spec.ts` (mensaje y ausencia de `mailto:` sin soporte), `inactividad.spec.ts` (aviso, reinicio y cierre sólo explícito) y la especificación de **Bonos por Dependencia** cubriendo prepare → job → progreso → fallidos → descarga y el estado `ERROR`.

## [0.13.1] - 2026-11-03

### Fixed

- **fix(`docker`):** El cache mount de `npm` en la etapa de compilación de `docker/app.Dockerfile` pasa a `id=haberes-frontend-npm,sharing=locked`. El compose compila varias apps en paralelo y todas escribían el mismo cache sin serializar; con escritores simultáneos `npm ci` podía dejar incompleta una dependencia opcional (`npm/cli#4828`) y el build moría al final con "Chunk optimization failed - Cannot find native binding".
- **fix(`docker`):** Después de `npm ci`, la etapa de compilación verifica los binarios nativos con `node -e "require('rolldown'); require('oxc-parser')"`. Esos binarios se cargan recién en la fase "Chunk optimization", así que un `npm ci` incompleto ahora falla en segundos y con un mensaje claro en lugar de abortar al final de la compilación de Nx.

### Removed

- **chore(`liquidacion`):** El menú de Liquidación deja de ofrecer **Mailing de Recibos** (`/movimientos/mailing`). La opción nunca tuvo componente migrado (no figuraba en `RUTAS_MIGRADAS`) y abría el placeholder genérico, de modo que su ruta autogenerada en `app.routes.ts` también desaparece; no queda código de mailing en el repositorio.

## [0.13.0] - 2026-11-02

### Added

- **feat(`shared-api`):** `moduloGuard` restringe una ruta según la asignación de facultad de la sesión validada con `ensureSession()`. Lee `data.requireFacultadId`: `true` exige `facultadId != null`, `false` lo exige nulo y ausente sólo exige sesión. Reutiliza la validación cacheada, por lo que no agrega llamadas HTTP ni toca los servicios de las pantallas.

### Fixed

- **fix(`novedades` / `liquidacion`):** la regla de facultad sólo se evaluaba en el login y podía saltearse con una sesión revalidada (por ejemplo, una facultad asignada o quitada después del login), permitiendo entrar a Novedades sin facultad o a Liquidación con facultad. Todas las rutas de ambas apps aplican `moduloGuard` con `data: DATOS_MODULO` (`requireFacultadId: true` en Novedades, `false` en Liquidación), incluidos los placeholders. Tests nuevos: `modulo.guard.spec.ts`, `app.routes.spec.ts` por app y `acceso-facultad.spec.ts` en `novedades-e2e` (con respuestas de haberes-core simuladas).

### Changed

- **docs:** `libs/shared-api/README.md`, `AGENTS.md` y `docs/architecture.mermaid` documentan `moduloGuard` y la regla `data.requireFacultadId` aplicada al login y a cada ruta protegida de Novedades y Liquidación.

## [0.12.0] - 2026-10-25

### Added

- **feat(`feature-consultas`):** Nueva librería (`type:feature`, `scope:liquidacion`) para el grupo **Consultas y Reportes** del módulo Liquidación. Incluye `ConsultasReportService` (único acceso a `/api/haberes/report/ui/{reporte}/{data|pdf|xlsx}/{params}`, con mensaje de negocio para 401), `ConsultaPeriodoComponent` (mes/año con navegación `<` `>`) y `ReporteTablaComponent` (tabla presentacional: recibe columnas tipadas y secciones con subtotal, sin conocer ningún reporte).
- **feat(`feature-consultas`):** Pantalla **Totales Generales** (`/consultas/totales-generales`, migración de `frmRpTotGeneral.frm`): consulta los grupos y subtotales del período, los muestra en tabla con importes alineados y descarga el PDF y el XLSX del mismo contenido. `totales-generales.models.ts` define el DTO tipado del backend.
- **feat(`feature-consultas`):** Pantalla **Totales Generales por Código** (`/consultas/totales-codigo`, migración de `frmRpTotCodigo.frm`) con las dos salidas del formulario como vistas: **Totales** (códigos con novedad) y **Comparación** (todos los códigos con diferencia). La tabla y las descargas PDF/XLSX siguen la vista elegida.
- **feat(`feature-consultas`):** Pantalla **Comparación entre Meses Consecutivos** (`/consultas/comparacion-meses`, migración de `frmCompEntreMesesConsec.frm`): compara brutos y netos contra el mes anterior (enero usa diciembre del año previo), agrupa por dependencia y descarga PDF/XLSX. Avisa que la comparación de designaciones del sistema anterior no está disponible.
- **feat(`feature-consultas`):** Cuatro pantallas académicas con tabla agrupada y descargas PDF/XLSX del mismo contenido: **Docentes por Sede** (`/consultas/docentes-sede`, facultad + sede), **Designación de Docentes** (`/consultas/designacion-docentes`), **Cursos por Docente** (`/consultas/cursos-docente`) y **Fusión por Docente** (`/consultas/fusion-docente`).
- **feat(`feature-consultas`):** Pantalla **Cargos con Clase por Facultad** (`/consultas/cargos-clase-facultad`) con filtro de facultad, agrupación por sede y períodos desde/hasta en formato MM/AAAA.
- **feat(`feature-consultas`):** `ConsultasCatalogosService` (facultades y sedes) para los filtros de Docentes por Sede y Cargos con Clase.
- **feat(`feature-consultas`):** `ReporteTablaComponent` agrega scroll horizontal para tablas anchas.
- **feat(`liquidacion`):** Rutas lazy `consultas/totales-generales`, `consultas/totales-codigo`, `consultas/comparacion-meses`, `consultas/docentes-sede`, `consultas/designacion-docentes`, `consultas/cursos-docente`, `consultas/fusion-docente` y `consultas/cargos-clase-facultad`, y sus altas en `RUTAS_MIGRADAS`, por lo que el menú y el panel de inicio dejan de mostrar el placeholder.
- **feat(`feature-consultas`):** Ocho **planillas** con tabla y descargas PDF/XLSX del mismo contenido: **Planilla de Liquidables** (`/consultas/planilla-liquidables`, sin filtros: sale del estado vigente y se consulta al abrir), **Cantidad de Cargos** (`/consultas/cantidad-cargos`), **Detalle por Código** (`/consultas/detalle-codigo`, con selector de código), **Cargos por Período** (`/consultas/cargos-periodo`), **Cursos por Período** (`/consultas/cursos-periodo`), **Libro de Sueldos** (`/consultas/libro-sueldos`), **Básicos por Período** (`/consultas/basicos-periodo`) y **Cursos por Contratado** (`/consultas/cursos-contratado`).
- **feat(`feature-consultas`):** **Libro de Sueldos** agrega el botón **LSD (ZIP)** que descarga el Libro de Sueldos Digital de AFIP de los legajos que se están viendo (`ConsultasReportService.descargarLibroSueldosDigital`, `POST` con la lista en el cuerpo y `responseType: 'blob'`).
- **feat(`feature-consultas`):** Pantalla **Bonos por Dependencia** (`/consultas/bonos-dependencia`, migración de `frmImprimir.frm`): filtros Dependencia + Filtro A/D + período, grilla propia con legajo, apellido y nombre, mail institucional y marca de **enviado** (el botón envía los legajos sin marca que tengan mail, como el formulario original), **Imprimir** (prepara y audita el lote en el core y descarga el PDF consolidado, avisando los legajos que fallaron) y **Enviar seleccionados** con progreso X/Y y resultado por legajo.
- **feat(`feature-consultas`):** Pantalla **Histórico de Asignación de Cargos** (`/consultas/historico-cargos`, migración de `frmCargoHist.frm`): selector de categoría, aviso explícito de que el reporte no tiene cuerpo implementado y descarga del PDF del encabezado. No ofrece tabla ni XLSX.
- **feat(`feature-consultas`):** `ConsultasCatalogosService` suma los catálogos de **dependencias**; `ConsultasReportService` suma `enviarBonoDependencia` (envío de un bono del lote).
- **feat(`feature-bonos`):** `BonoReportService.printPrepareDependencia` llama al nuevo `POST /api/haberes/core/bono/dependencia/{dependenciaId}/{anho}/{mes}/{salida}/print-prepare`, que prepara la actividad y audita cada legajo con la IP resuelta en el servidor.
- **feat(`feature-consultas`):** `ConsultasCatalogosService` suma el catálogo de **códigos** para el filtro de Detalle por Código.
- **feat(`liquidacion`):** Rutas lazy y altas en `RUTAS_MIGRADAS` de las ocho planillas, de modo que el menú y el panel de inicio ya no muestran el placeholder en esas opciones.
- **feat(`liquidacion`):** Rutas lazy `consultas/bonos-dependencia` y `consultas/historico-cargos` con sus altas en `RUTAS_MIGRADAS`: el grupo Consultas queda completo (19 de 19 sin placeholder).

### Changed

- **refactor(`feature-bonos`):** El bono individual consume el namespace `/api/haberes/report/ui/bono/**` (antes `/api/haberes/report/bono/ui/**`), que queda detrás de la API key del gateway. Las rutas legacy con IP no cambian.
- **docs:** `README.md` incorpora `feature-consultas` al árbol del monorepo y a la tabla de librerías, `AGENTS.md` la suma al mapa del workspace y `docs/architecture.mermaid` agrega la dependencia `liquidacion → feature-consultas`.

### Fixed

- **fix(`feature-consultas`):** `ConsultasReportService` no agrega la barra final al path cuando un reporte no lleva parámetros (Liquidables), que con el mapeo por defecto de Spring daba 404.

### Tests

- Especificaciones de `ConsultasReportService` (URLs de data/descarga y error 401), de `TotalesGeneralesComponent`, `TotalesCodigoComponent` (vistas Totales/Comparación y descarga de la vista activa) y `ComparacionMesesComponent` (mes anterior, enero → diciembre, descarga y cambio de período), de las cinco pantallas académicas (consulta, agrupación por docente/sede, catálogos, guardas de filtros y descargas) y de `ReporteTablaComponent` (secciones, subtotal, vacío y carga).
- Especificaciones de las ocho planillas: consulta del período, estado vacío, descarga PDF/XLSX y casos propios (guarda sin código en Detalle por Código, consulta sin parámetros en Liquidables, LSD con los legajos visibles y sin datos en Libro de Sueldos), más el caso de URL sin barra final en `ConsultasReportService`.
- Especificaciones de **Bonos por Dependencia** (catálogo de dependencias, guarda sin dependencia, marca de enviados, cálculo de los legajos a enviar, prepare del lote con solicitante, fallidos sin descarga, descarga forzada, envío con progreso y error por legajo) y de **Histórico de Asignación de Cargos** (categorías, guarda, aviso y PDF).

## [0.11.0] - 2026-10-24

### Added

- **feat(`administrador`):** Nueva aplicación `apps/administrador` (puerto 4211) como cuarto proyecto del monorepo, con `project.json` propio (`@angular/build:application`, configuraciones production/development con los mismos budgets de 500 kB/1 MB y 4 kB/8 kB, `serve`, `serve-static`, `lint` y `test` con `@angular/build:unit-test`), entornos con `BACKEND_URL_PLACEHOLDER`/`ENV_NAME_PLACEHOLDER`/`APP_VERSION_PLACEHOLDER`, `nginx.conf` y `entrypoint.sh`. Shell delgado sobre `<ui-shell>` con tres bloques de menú (Personas, Catálogos de liquidación, Parámetros de cálculo), panel de inicio con `<ui-opciones-panel>` y rutas lazy a las siete pantallas del módulo, todas con `canActivate: [authGuard, administradorGuard]`. `npm run serve:all` levanta también la app en 4211.
- **feat(`shared-api`):** `administradorGuard`: revalida la sesión con `AuthService.ensureSession()` y sólo habilita el módulo cuando el usuario validado no tiene facultad asignada, limpiando la sesión y redirigiendo a `/login` en caso contrario. El login de la app `administrador` declara `data: { requireFacultadId: false }`, de modo que un usuario con facultad es rechazado desde el formulario.
- **feat(`shared-api`):** `AuthService` cambia el modelo de sesión: `localStorage` guarda sólo `{ version: 2, legajoId }` bajo `haberes_user` (antes se persistía la `Persona` completa, incluida `facultadId`) y `ensureSession()` revalida persona, usuario y facultad contra haberes-core una vez por arranque, cacheando el resultado y compartiendo la validación en curso entre guards concurrentes. El formato anterior se migra descartando todo lo que no sea el legajo. Se agrega la señal `computed` `facultadId` (null para usuarios sin facultad) y el campo opcional `dependencia` más los campos filiatorios/AFIP (`nacimiento`, `cuil`, `altaDocente`, `ajusteDocente`, `altaAdministrativa`, `ajusteAdministrativo`, `estadoCivil`, `situacionId`, `reemplazoDesarraigo`, `mitadDesarraigo`, `posgrado`, `liquida`, `estadoAfip`, `salida`, `obraSocial`, `actividadAfip`, `localidadAfip`, `situacionAfip`, `modeloContratacionAfip`, `directivoEtec`) en la interfaz compartida `Persona`.
- **feat(`shared-api`):** Helpers exportados desde el barrel: `mensajeDeError(error, porDefecto)` (`lib/util/api-error.ts`) extrae el mensaje de negocio de un `HttpErrorResponse` (status 0 → sin conexión, cuerpo plano o ProblemDetail con `detail`/`message`) y `periodoTexto(periodo)` (`lib/util/periodo.ts`) convierte un período `yyyymm` a `MM/AAAA` (guion para null/0). Ambas con especificación unitaria.
- **feat(`administrador`):** Siete librerías nuevas bajo el tag `scope:administrador`, cada una con componente standalone, servicio, especificación de componente y de servicio, README y target `test` atado a `administrador:build:development`:
  - `feature-personas` — Datos Personales: ficha filiatoria por legajo con búsqueda estándar `<ui-persona-search>`, edición parcial por `PATCH /persona/{legajoId}` (`PersonasService.patchPersona`, sólo los campos modificados), contacto (`/contacto`), validación de mail (`/tool/mailvalidate`), dependencias, CBU por período (`/legajobanco`) y antigüedad (`/antiguedad/last` y `/antiguedad/calculate`), con helpers `fechaInput`/`fechaPayload` que preservan el horario y offset del backend.
  - `feature-categorias` — Categorías: básicos versionados por año/mes (`POST`/`PUT /categoria/{anho}/{mes}`), borrado, y planilla xlsx del sistema (descarga desde `/sheet/generateCategorias` y carga desde archivo).
  - `feature-codigos` — Códigos: ABM de códigos de concepto, grupo contable (`codigo_grupo`: remunerativo, no remunerativo, deducción, total) y vínculo con conceptos AFIP por semestre (`POST /afipConceptoSueldo/search`).
  - `feature-clases` — Clases: ABM de clases de hora cátedra con valor hora y `last` para proponer la PK.
  - `feature-cargos-clase` — Cargos con Clase: ABM del catálogo y consulta de legajos asignados en el período (`/cargoclasedetalle/cargoclase/{id}/{anho}/{mes}`).
  - `feature-adicionales` — Adicional Carga Horaria: tablas (maestro de sólo lectura) con sus rangos de horas y porcentaje, alta y baja de rangos por tabla.
  - `feature-sedes` — Sedes: edición de `geografica` (`PUT /geografica/{id}`) con desarraigo y sede de reemplazo.
- **feat(`feature-designaciones`):** La pantalla `Designaciones` pasa a operar en dos modos sobre el mismo componente: **global** (sesión sin facultad, módulo Liquidación) con liquidadas del período anterior, cursos, fusionadas, totales y acciones Redesignar / Fusionar / Imprimir; y **facultad** (módulo Novedades) limitada a la facultad del usuario en modo consulta. `DesignacionesService` suma `getCargoLiquidacionDocente`, `getDiferenciaDesignaciones` (novedad 27 sin dependencia), `redesignar`, `fusionar(forzar)`, `descargarDetalle` (PDF) y la carga de catálogos (facultades, geográficas, dependencias, categorías, tipos de cargo y de designación); los cursos y fusionadas eligen endpoint por legajo o por facultad según el modo. Nuevo `designaciones.models.ts` exportado desde el barrel.
- **feat(`feature-designaciones`):** Cuatro procesos nuevos consumidos por Liquidación: `CargosClaseAsignacionComponent` (alta, baja y cambio de período hasta de cargos con clase de un docente, con historial de períodos y control de períodos acreditados por el servidor), `CargosClaseDuplicarComponent` (duplicación de los cargos del período origen al rango destino por filas marcadas), `CargosClaseActualizarComponent` (recálculo masivo de valores hora del período vía `cargoclasetool/update/periodo`) y `FusionTodosComponent` (proceso masivo en lotes de 50 legajos con duplicación opcional del mes anterior, fusión y recálculo de desarraigo, progreso, resumen de fallos y cancelación entre lotes).
- **feat(`feature-designaciones`):** `AutorizarNovedadesComponent` sobre `cursocargonovedad`: padrones de pendientes, autorizadas y rechazadas de alta y baja en una sola carga, autorización, rechazo y anulación con respuesta obligatoria, y reportes PDF del período y de pendientes. `CursosConsultaComponent` lista los cursos por facultad y sede con filtro por nombre con debounce, sin asignar nada (alcance real del formulario legado de asignación de materias).
- **feat(`feature-anotador`):** `AnotadorComponent` acepta un `input facultadId` opcional y resuelve la facultad efectiva contra la sesión: sin facultad opera en **modo global** (pendientes y revisados de todo el período vía endpoints `periodo`), permite visar la anotación seleccionada (autorizar/rechazar con respuesta obligatoria) y descarga los reportes PDF de pendientes y de autorizadas/rechazadas del período (por facultad o del período completo). En modo facultad el historial se sigue filtrando por la facultad de la sesión.
- **feat(`feature-designaciones`):** `AsigCursosComponent` gana el modo global (módulo Liquidación): selector de facultad, ABM de cursos (nombre, nivel, anual, semestres y adicional carga horaria), aviso de que actualizar un curso obliga a re-fusionar los legajos asignados, y resolución de nombres de facultad y sede con fallback para respuestas sin relación embebida.
- **feat(tests):** Especificaciones nuevas para las siete librerías del módulo Administrador (componente y servicio), para `AutorizarNovedadesService`, `FusionTodosService`, `CargosClaseActualizarService`, `CargosClaseService` y `DesignacionesService`, para `mensajeDeError`/`periodoTexto`, y ampliación de `auth.service.spec.ts` con los casos de sesión v2 (persistencia sólo del legajo, migración del formato viejo, facultad manipulada ignorada, sin legajo, usuario inexistente, cache de la validación, usuario sin facultad y logout).

### Changed

- **refactor(`shared-api`):** `authGuard` y `unauthGuard` dejan de leer `currentUser$` para pasar por `AuthService.ensureSession()`, de modo que una sesión vieja o manipulada en `localStorage` no alcanza para entrar. `CargosLegajoComponent`, `DocentesSedeComponent` y `AnotadorComponent` toman la facultad de la señal `AuthService.facultadId` en lugar de suscribirse a mano a `currentUser$`.
- **refactor(`liquidacion`):** El menú pierde el grupo "Parámetros y Tablas" (personas, contactos, adicional carga horaria, categorías, cargos con clase, clases, códigos y sedes), que pasa a la app `administrador`; "Asignación de Materias" se reemplaza por "Consulta de Cursos por Facultad y Sede" (`/designaciones/cursos`). `RUTAS_MIGRADAS` incorpora las nueve rutas de designaciones (`general`, `actualizar-cargos-clase`, `anotador`, `autorizar-novedades`, `asig-cursos`, `cargos-clase`, `duplicar-cargos-clase`, `fusionar-todos`, `cursos`) y el panel de inicio describe el alcance ampliado (designaciones y contabilidad).
- **chore(nx):** `feature-designaciones` y `feature-anotador` pasan de `scope:novedades` a `scope:shared` para poder ser consumidas por `liquidacion`, y `tsconfig.base.json` declara los alias `@haberes/feature-personas`, `-adicionales`, `-categorias`, `-cargos-clase`, `-clases`, `-codigos` y `-sedes` (paths reformateados a una línea por alias).
- **ci(deploy):** `docker-publish.yml`, `deploy-develop.yml` y `deploy-staging.yml` agregan `administrador` a la lista `apps` del pipeline reutilizable, por lo que la imagen de la nueva app se publica y despliega junto con `liquidacion` y `novedades`.
- **docs:** `README.md` documenta la app `administrador` (estructura, puerto 4211, comandos de serve/build/test y `docker:app`) y las siete librerías nuevas; `AGENTS.md` agrega la app y las libs al mapa del workspace, el criterio de `test` por app de origen, la sección de sesión v2 con `ensureSession` y la regla de `PATCH /persona/{legajoId}` para ediciones parciales; nuevos READMEs por librería y `libs/shared-api/README.md` describe la señal `facultadId`. `docs/architecture.mermaid` incorpora la app `administrador` con sus siete librerías y `administradorGuard`, y refleja que `liquidacion` también consume `feature-designaciones` y `feature-anotador`.

## [0.10.0] - 2026-10-11

### Changed

- **chore(deps):** **Actualización mayor del frontend a Angular 22.1.8 + Nx 23.3 + TypeScript 6.0.** Paquetes: `@angular/*` 21 → 22.1.8, `@angular/build`, `@angular/cli`, `@angular-devkit/*` y `@schematics/angular` 21 → 22.1.9; `nx` y `@nx/*` 22.7 → 23.3.0; `typescript` 5.9 → 6.0.3; `angular-eslint` 21 → 22.5.0; `typescript-eslint` y `@typescript-eslint/utils` 8.40 → 8.71. La migración: (a) agregó `ChangeDetectionStrategy.Eager` a los componentes (Angular 22 cambió el default a **OnPush**; `Eager` preserva el comportamiento previo, equivalente al `Default` anterior), (b) agregó `withXhr()` a `provideHttpClient` (Angular 22) y (c) dejó la regla nueva `@angular-eslint/prefer-on-push-component-change-detection` en **`warn`** (migrar los componentes a OnPush es una tarea aparte). No aplica el reemplazo de `vitest.workspace.ts` por `vitest.config.ts` de tesorería-frontend: haberes usa el executor `@angular/build:unit-test`. Verificado con `nx run-many -t lint test build` (2 apps + 8 libs) en verde.
- **ci(deploy):** `deploy-pipeline.yml` reemplaza el input `deployRunner` por `deployRunners` (lista JSON de labels): el job `deploy` usa una matriz con `fail-fast: false` y un leg por label, y el `environment` de GitHub toma el nombre del runner. `deploy-develop.yml` declara `["develop"]` y `deploy-staging.yml` declara `["staging", "staging-new"]`, habilitando el despliegue dual de staging.
- **docs:** `README.md`, `AGENTS.md` y las copias de la skill `frontend-guidelines` (`.agents/` y `.opencode/`) actualizan el stack (Angular 22.1.8, Nx 23.3.0, TypeScript 6.0.3), el pipeline de documentación (`generate-docs.yml`) cita Angular 22 y el README describe la matriz de runners del deploy.
- **chore(workspace):** `.gitignore` ignora `.nx/migrate-runs` y `.vitest`, artefactos de la migración a Nx 23 y de las corridas de Vitest.

## [0.9.0] - 2026-10-03

### Added
- **feat(`shared-api`):** Cambio de clave sobre haberes-core: `AuthService.changePassword(data)` (`PUT /api/haberes/core/usuario/cambiarclave`; la verificación de la clave anterior es server-side, responde 204 y la sesión local no se modifica) con el payload tipado `ChangePasswordRequest` en el nuevo `auth.models.ts` (exportados ambos desde el barrel), más el getter sincrónico `currentUserValue` (espejo del AuthService de tesoreria-frontend). Nueva `auth.service.spec.ts` con 3 casos (`HttpTestingController`: payload exacto del PUT, propagación del `detail` del ProblemDetail 400 e hidratación/inalterabilidad de la sesión).
- **feat(`ui-auth`):** `CambioClaveModalComponent` (`<lib-cambio-clave-modal>`, standalone y exportado desde el barrel), espejo del modal de tesoreria-frontend adaptado a Haberes: legajo y nombre precargados de la sesión en sólo lectura, validación de campos completos y de coincidencia de la nueva clave, éxito con "Cambio REALIZADO" y autocierre, y mapeo del error de negocio desde ProblemDetail `detail`, cuerpo en texto plano o `message`. Al abrirse (`isOpen`) resetea el formulario. Nueva especificación con 8 casos y target `test` de librería (`@angular/build:unit-test` atado a `novedades:build:development` + `tsconfig.spec.json`).
- **feat(`ui-layout`):** `UiOpcionesPanelComponent` (`<ui-opciones-panel>`, exportado desde el barrel): panel principal de opciones con la presentación del hub estático de tesorería — cabecera `um-page-header` con contador "disponibles de totales", búsqueda en vivo por nombre/descripción/grupo, secciones por grupo y grilla auto-fill de `um-card` con punto de estado (esmeralda "Disponible" / ámbar "En desarrollo") y badge monoespaciado con el código de la ruta. Tipos `OpcionPanel` y `GrupoPanel`; el estado es estático (lo definen los datos de cada app) porque las rutas internas no se pueden verificar con un ping.
- **feat(`novedades`):** Panel principal `/inicio` con el nuevo `InicioComponent` sobre `<ui-opciones-panel>` y su catálogo `menu-options.data.ts` (`NOVEDADES_GRUPOS`: Designaciones y Consultas, con las cinco opciones migradas marcadas `disponible`); nuevo ítem "Panel Principal" en el sidebar.
- **feat(`liquidacion`):** `RUTAS_MIGRADAS` como fuente única en `menu-options.data.ts`: alimenta a la vez la generación de placeholders de `app.routes.ts` y el estado "Disponible" del panel de `/inicio`.

### Changed
- **feat(`ui-layout`):** El `<ui-shell>` integra el modal de cambio de clave: botón "Cambiar clave" en el bloque de usuario del sidebar y en el header móvil, que abre `<lib-cambio-clave-modal>` (`@haberes/ui-auth`) vía la señal `isCambioClaveOpen` (la dependencia `ui-layout` → `ui-auth` está permitida por las etiquetas `type:ui`). La especificación del shell cubre apertura/cierre del modal.
- **refactor(`ui-layout`):** La marca del `<ui-shell>` pasa a ser siempre texto, espejo del shell de tesoreria-frontend: el sidebar muestra `UM · Haberes` (`text-lg font-bold`) sobre el nombre del módulo (eliminados el bloque horizontal logo + divisor + leyenda "Haberes UM" y el enlace "Ir al inicio") y el header móvil muestra la marca junto al badge de entorno, sin logo ni módulo. Se elimina el input `logoUrl`, cuyo default `/logo.png` renderizaba una imagen rota en `novedades` (el asset sólo existía en `liquidacion`). Actualizada la especificación del shell.
- **refactor(`ui-auth`):** El login prescinde de la imagen `logo.png` (rota en `novedades`) y conserva sólo la cabecera de texto (`um-eyebrow` "Haberes" + `um-page-title` "UM Haberes").
- **refactor(`novedades`):** `Designaciones` se reubicó de `/inicio` a la ruta propia `/designaciones` (menú incluido); `/inicio` pasa a ser el panel de opciones y sigue siendo el destino de la redirección por defecto.
- **refactor(`liquidacion`):** `InicioComponent` pasó de ~170 líneas de diseño propio (paleta slate/blue ad-hoc) a un envoltorio de ~35 líneas sobre `<ui-opciones-panel>` con clases `um-*`; la búsqueda y el filtrado por grupo viven ahora en el componente compartido.
- **docs:** `AGENTS.md` (sección "Brand Display Standards"), `README.md` y la skill `frontend-guidelines` reemplazan las reglas de escala del logotipo institucional por el estándar de marca de texto.

### Removed
- **chore(assets):** Eliminado `apps/liquidacion/public/logo.png`, sin consumidores tras quitar el logo del shell y del login; el favicon se conserva.

## [0.8.0] - 2026-10-03

### Added
- **feat(e2e):** Nuevo proyecto `apps/novedades-e2e` con Playwright (chromium) basado en `nxE2EPreset`: smoke de acceso (sin sesión el guard redirige a `/login` y el formulario renderiza usuario y contraseña sin backend), `webServer` que levanta `novedades:serve` en 4208 con `reuseExistingServer` y variable `BASE_URL` para probar una aplicación ya desplegada. Ejecución vía `npx nx e2e novedades-e2e`. Nuevas devDependencies `@nx/playwright`, `@playwright/test` y `eslint-plugin-playwright` con configuración ESLint flat propia del proyecto.
- **feat(docker):** Dockerfile multinodo compartido `docker/app.Dockerfile` para todas las apps (`--build-arg APP=<app>`): la etapa Node (`npm ci` con cache mount + `npx nx build <app> --configuration=production --skip-nx-cache`) compila dentro de la imagen y la etapa Nginx copia el bundle junto con la config propia de cada app (`nginx.conf`, `entrypoint.sh`), generando el certificado SSL auto-firmado al vuelo; la imagen pasa a ser función exclusiva del código fuente y nunca de un `dist/` local. Nuevo `.dockerignore` que excluye `node_modules`, `dist`, `.angular`, `.nx` y `.git` del contexto de build.
- **feat(`package.json`):** Script `docker:app` (`scripts/docker-image.mjs`) que reconstruye la imagen de una sola app: si encuentra el compose del stack (resuelto vía `LOCAL_RESOURCE`/`HABERES_COMPOSE`) usa `docker compose build` y luego `up -d --no-deps` —o sólo build con `--no-up`—, conservando nombre de imagen (`um-haberes-<app>-client`) y red; si no lo encuentra, cae a `docker build` suelto con `docker/app.Dockerfile`. Valida que el nombre pasado exista en `apps/` (ignora proyectos `-e2e`).
- **feat(tests):** Especificaciones unitarias de servicios de feature con `HttpTestingController`: `AnotadorService` (pendientes y revisados por facultad/año/mes, historial de anotaciones por legajo, acreditación del período y alta de la anotación como cuerpo del POST), `CargosReportService` (detalle de cargos y docentes por sede como blob de reporte, geográficas del core) y `AsignacionCursosService` (sedes, filtro de cursos partido en palabras AND sin condiciones si está vacío, plantel titular/contratado, novedades pendientes de alta/baja, envío de novedad y acreditación del período). `feature-anotador`, `feature-cargos` y `feature-designaciones` reciben el target `test` con executor `@angular/build:unit-test` atado a `novedades:build:development` y su `tsconfig.spec.json`.
- **chore(nx):** Registrados los plugins `@nx/playwright/plugin` (target `e2e`) y `@nx/eslint/plugin` (target `lint`); cache de tareas habilitado para `e2e`; generadores por defecto `e2eTestRunner: playwright` en aplicaciones y `unitTestRunner: vitest-angular` en aplicaciones y librerías; `analytics: false`.

### Changed
- **ci(deploy):** El workflow reutilizable `deploy-pipeline.yml` recibe la matriz de apps como input `apps` (JSON list) y construye/publica las imágenes desde `docker/app.Dockerfile` en el push: eliminados el job `build-images` y el upload/download del artefacto `dist/apps` (la imagen depende sólo del commit chequeado); `nx run-many -t build --configuration=production` corre únicamente en PRs, porque en el push la compilación multietapa dentro de la imagen es el chequeo de compilación. `docker-publish.yml`, `deploy-develop.yml` y `deploy-staging.yml` pasan `apps: ["liquidacion", "novedades"]`; matriz con `fail-fast: false`.
- **ci(docs):** `generate-docs.yml` instala dependencias con `npm ci` en lugar de `npm install`, garantizando reproducibilidad desde el lockfile.
- **docs:** README: sección Docker reescrita con el build multinodo y el script `docker:app`, estructura y comandos documentan `apps/novedades-e2e`, y el párrafo de CI/CD describe el pipeline actualizado; `AGENTS.md` documenta el proyecto e2e, los tests de librerías vía `@angular/build:unit-test`, el comando `docker:app` y los criterios de CI multi-entorno (imagen multietapa como chequeo de compilación en push, tags `sha` y `latest` sólo en `main`).

### Removed
- **chore(docker):** Eliminados los Dockerfiles de runtime `apps/novedades/Dockerfile` y `apps/liquidacion/Dockerfile`, que sólo hacían `COPY dist/apps/<app>/browser` de un build previo y servían bundles obsoletos si no se reejecutaba `nx build`; los reemplaza `docker/app.Dockerfile`. El script `docker:app` y los workflows ya no dependen de `dist/` local.

## [0.7.0] - 2026-10-01

### Added
- **feat(`shared-api`):** `PersonaSearchService`, exportado desde el barrel como acceso único a `/api/haberes/core/persona` de haberes-core: `searchPersonas(termino)` (el término se parte por espacios y cada palabra viaja como condición AND a `POST /search`, equivalentes a `clsREPPersona.formSearch`), `buscar(termino)` (busca desde el primer carácter y sólo cae al legajo exacto si el término es numérico sin coincidencias), `getPersonaByLegajo(legajoId)` (`GET /{legajoId}`) y `getPersonaByDocumento(documento)` (`GET /documento/{documento}`), más el helper `textoPersona`. Especificación con 7 casos unitarios.
- **feat(`ui-layout`):** Buscador estándar `<ui-persona-search>` (`PersonaSearchComponent`, standalone) para todos los formularios del portal (equivale al modal `frmSearchREST` del legacy): coincidencias como `Apellido, Nombre (legajo)`, selección por teclado (flechas resaltan, ENTER confirma, ESC descarta), recarga de la persona completa por legajo antes de emitir `(seleccionada)`, binding `[persona]` para preselecciones del padre, método `limpiar()` y entradas `label`, `placeholder`, `buscandoLabel` y `panelClases`. Incluye especificación del componente.
- **feat(`shared-api`):** Campos opcionales `documento`, `estado` y `dependenciaId` en la interfaz compartida `Persona` (DTO `PersonaResponse`/`PersonaSearchResponse` de haberes-core), tipo único para todos los flujos de búsqueda de personas.
- **feat(`feature-bonos`):** Acceso exacto por legajo y documento en `bono-individual` mediante campos editables propios que consultan `getPersonaByLegajo` / `getPersonaByDocumento` al presionar ENTER o salir del campo.

### Changed
- **refactor(features):** Todas las pantallas que buscan personas migraron al buscador estándar (`<ui-persona-search>` + `PersonaSearchService`): `AnotadorComponent`, `BonoIndividualComponent`, `CargosLegajoComponent`, `DesignacionesComponent` y `AsigCursosComponent`, eliminando las pipelines duplicadas de Subject/debounce/dropdown dentro de cada feature y los imports cruzados a `@haberes/feature-designaciones` para buscar personas.
- **docs:** `AGENTS.md` documenta la nueva sección "Standard Person Search (Buscador de Personas Estándar)" (uso obligatorio del buscador, semántica de `PersonaSearchService`, comportamiento de teclado, accesos exactos por legajo/DNI, tipo compartido `Persona` y excepción de `feature-contabilidad`); actualizados los READMEs de `shared-api`, `ui-layout`, `feature-anotador`, `feature-bonos`, `feature-cargos` y `feature-designaciones`; `docs/architecture.mermaid` refleja ahora el servicio de personas en `shared-api` y `ui-persona-search` en `ui-layout`.

### Removed
- **refactor(`feature-designaciones`):** Eliminados `searchPersonas` y `getPersonaByLegajo` de `DesignacionesService`, que queda sólo con las consultas de cursos cargo y cursos fusión (la búsqueda de personas pertenece al buscador estándar).
- **refactor(`feature-bonos`):** Eliminada la interfaz duplicada `BonoPersona` y el helper local `textoPersona` del componente: se usa el tipo compartido `Persona` y el helper de `@haberes/shared-api`.

## [0.6.0] - 2026-09-28

### Added
- **feat(`ui-layout`):** Shell institucional unificado `UiShellComponent` (`<ui-shell>`) en `@haberes/ui-layout`, composición J2 que reemplaza el ensamblado `ui-navbar` + `ui-sidebar`: sidebar oscuro (`bg-um-sidebar`) con marca UM y nombre de módulo, menú polimórfico (lineal vía `menuItems` para `novedades`; acordeón colapsable vía `menuGroups` para `liquidación`), badge de entorno (`APP_ENV_INFO` con label, color y tooltip con versión), perfil de usuario con sede y facultad, cierre de sesión, header móvil accesible con menú desplegable y vista limpia del `router-outlet` para login/desautenticación.
- **feat(`ui-layout`):** Tema compartido J2 en `libs/ui-layout/src/styles/tokens.css`, importado por el `styles.css` de ambas apps: tokens `@theme static` (paleta `um-*`: `bg-um-sidebar`, `text-um-ink`, `border-um-border`, `bg-um-surface`, `text-um-primary`, tipografía Inter, escala tipográfica y radios) y capa `@layer components` con clases semánticas `.um-page-header`, `.um-eyebrow`, `.um-page-title`, `.um-page-desc`, `.um-label`, `.um-input` (`-invalid`), `.um-btn-primary`, `.um-btn-secondary`, `.um-card`, `.um-badge`, `.um-alert` (`-error`, `-warn`, `-success`) y `.um-table`.
- **feat(`ui-layout`):** Tipos `ShellMenuItem` y `ShellMenuGroup` exportados desde el barrel, con alias de compatibilidad `MenuItem`/`MenuGroup` para los datos de menú existentes (`menu-options.data.ts`).
- **feat(tests):** `ui-shell.spec.ts` que valida el renderizado del shell (menú lineal y agrupado, badge de entorno, usuario/logout y vista desautenticada), reemplazando la antigua especificación de navbar.

### Changed
- **refactor(apps):** `AppComponent` de `novedades` y `liquidación` reducida al uso declarativo de `<ui-shell>` (`moduleName`, `menuSectionLabel`, `menuItems`/`menuGroups`); el control de sesión (`isLoggedIn$`) ahora vive en el shell, eliminando los templates raíz `app.html`/`app.css` y los imports directos de `AuthService` en las apps.
- **refactor(ui):** Migración de todas las vistas al tema J2 con clases `um-*` (en lugar de cadenas de utilidades ad-hoc): `AnotadorComponent`, `BonoIndividualComponent`, `CargosLegajoComponent`, `DocentesSedeComponent`, `ImputacionIndividualComponent`, `AsigCursosComponent`, `DesignacionesComponent` y el login de `ui-auth` (encabezado `um-eyebrow`/`um-page-title`, alertas `um-alert` y logo `h-16 w-auto`).
- **docs:** `README.md` y `AGENTS.md` documentan el sistema de diseño J2 de cuatro capas (tokens, base/densidad, shell estructural y utilidades de componente); actualizados `libs/ui-layout/README.md`, `docs/architecture.mermaid` y el diagrama del pipeline `generate-docs.yml` para reflejar `ui-shell` en lugar de Navbar/Sidebar.

### Removed
- **refactor(`ui-layout`):** Eliminados `NavbarComponent` y `SidebarComponent` (componentes, templates y spec) del barrel público: su responsabilidad se unifica en `UiShellComponent`.

## [0.5.0] - 2026-09-24

### Added
- **feat(`feature-contabilidad`):** Nueva librería `@haberes/feature-contabilidad` para gestión de asientos contables individuales e imputación (`ImputacionIndividualComponent`, `ContabilidadService`, modelos y tests unitarios).
- **feat(skills):** Skill `frontend-guidelines` para lineamientos de diseño corporativo, patrones de tablas contables, uso del logo y prevención de terminología legacy.

### Changed
- **refactor(ui):** Refactorización estética corporativa moderna (Enterprise Institutional Design System):
  - Integración de tipografía Inter, cifras tabulares (`tabular-nums`) para montos y códigos contables, y paleta institucional Slate + Azul UM (`blue-700`).
  - Rediseño de tablas de datos de alta densidad operativa con cabeceras fijas (`backdrop-blur-xs`), bordes tenues y alineación financiera rigurosa.
  - Redimensionamiento y jerarquía del logotipo institucional (`logo.png`, 204×102 px): eliminación de contenedores cuadrados restrictivos y adopción de escala `h-11` (desktop sidebar), `h-20`/`h-24` (login) y `h-8` (móvil).
  - Erradicación integral de referencias a Visual Basic 6 (`.frm`, `.vbp`, "migración de VB6") en títulos, tarjetas, badges y buscadores de toda la interfaz de usuario.
- **docs:** Actualización de `AGENTS.md` y `README.md` con los lineamientos de diseño, reglas de logotipo y estándares de nomenclatura limpia.
- **docs(architecture):** Actualización de `docs/architecture.mermaid` con `feature-contabilidad` (ImputacionIndividual) en la app `liquidacion`.

## [0.4.0] - 2026-09-22


### Added
- **feat(`feature-bonos`):** Nueva librería `@haberes/feature-bonos` para el bono individual del docente (migración de `prjBonos` VB6).
  - `BonoIndividualComponent`: validación de integridad del bono, preparación, descarga de PDF, registro de auditoría con legajo solicitante y envío por email con validación de casilla.
  - `BonoReportService` sobre `/api/haberes/core/bono` y `/api/haberes/report/bono` (endpoints de front `/ui/generatePdf` y `/ui/sendBono`; la IP de auditoría la resuelve el backend, nunca el browser).
  - Modelos tipados (`IntegridadBonoResponse`, `ActividadResponse`, `BonoImpresionResponse`, etc.) exportados desde el barrel.
- **feat(`liquidacion`):** Nueva ruta lazy `/consultas/bono-individual` que monta `BonoIndividualComponent`.
- **feat(`liquidacion`):** Catálogo de opciones del sistema migrado de VB6 (`menu-options.data.ts`) con panel `/inicio` de búsqueda y filtrado por grupos funcionales, y rutas placeholder autogeneradas para las opciones aún no migradas.
- **feat(`ui-layout`):** Sidebar con menús colapsables por grupos (`MenuGroup`, input `menuGroups`); navbar con badge de entorno (label, color y tooltip con versión) junto al usuario.
- **feat(`shared-api`):** Indicador de entorno en runtime: token `APP_ENV_INFO` + `provideAppEnvInfo` (prefija el `document.title`) y `getEnvDisplay()` que normaliza `ENV_NAME` a LOCAL/DESARROLLO/STAGING/PRODUCCIÓN, mostrando "SIN DEFINIR" en rojo si falta.
- **feat(`shared-api`):** Token `API_URL` consumido por `AuthService` y `errorInterceptor` que cierra sesión y redirige a `/login` ante 401/403; ambos registrados en `app.config.ts` de las dos apps.
- **feat(apps):** `environment.development.ts` con `fileReplacements` en el target `build:development` de cada app: en `ng serve` el badge muestra LOCAL sin Docker.
- **feat(apps):** `entrypoint.sh` sustituye además `ENV_NAME_PLACEHOLDER` y `APP_VERSION_PLACEHOLDER` en los `.js` servidos, con defaults evidenciables (`desconocido`/`sin-version`).
- **feat(`package.json`):** Script `serve:all` que levanta novedades (4208) y liquidacion (4209) con concurrently.
- **feat(ci):** Nuevos workflows `ci.yml` (validación de PR a `main`: chequeo de sincronización package/lock, `npm ci`, `nx affected` de lint/test/build), `deploy-develop.yml` y `deploy-staging.yml` (verify + build + deploy multi-entorno).
- **chore(workspace):** Etiquetas `type:*`/`scope:*` en todos los proyectos y reglas `depConstraints` de dirección de dependencias en ESLint; path mapping `@haberes/feature-bonos`; targets de test (Vitest vía `@angular/build:unit-test`) para `shared-api`, `ui-layout` y `feature-bonos`.

### Changed
- **perf(`novedades`):** Todas las rutas pasan a lazy loading con `loadComponent`, eliminando los imports eager de las feature libraries.
- **ci(docker):** Los `Dockerfile` consumen el artefacto `dist/` pre-construido por el pipeline en lugar de compilar multi-stage en la imagen.
- **ci(nginx):** `proxy_pass` del gateway con variable y `resolver 127.0.0.11` para resolución DNS dinámica en Docker.
- **refactor(`shared-api`):** `AuthService.logout()` navega con `Router` en lugar de `window.location.href`; URLs derivadas de `API_URL`.
- **ui:** Puertos de desarrollo porteados a 4208 (novedades) y 4209 (liquidacion) alineados con `docker-compose.yml`; escala tipográfica global 87.5%; marca "Haberes" en navbar/sidebar.
- **chore(nx):** Inputs de lint/test limpiados de `karma.conf.js` obsoleto; fix de `npm ci` y lint en `package-lock.json` (PRs #11 y #12).

### Fixed
- **fix(`ui-layout`):** Especificación de `NavbarComponent` para el badge de entorno (label/color/tooltip y ausencia de badge sin `APP_ENV_INFO`).

## [0.3.1] - 2026-07-10

### Added
- **chore(ci):** Nuevo workflow `docker-publish.yml` para build y push automático de imágenes Docker a Docker Hub.
  - Pipeline matricial que construye imágenes para `liquidacion` y `novedades` en paralelo.
  - Trigger en push a `main`, con cache de capas via GitHub Actions Cache (GHA).
  - Tags automáticos: `latest` y `sha` del commit.
  - Autenticación via secrets `DOCKER_USERNAME` y `DOCKER_PASSWORD`.

### Changed
- **chore(docs):** Actualizado `actions/checkout` de `v4` a `v6` en `generate-docs.yml` para consistencia con `docker-publish.yml`.

## [0.3.0] - 2026-05-13

### Added
- **feat(`feature-designaciones`):** Nueva librería `AsigCursosComponent` para asignación de cursos docentes.
  - Componente `AsigCursosComponent` con gestión completa de altas, bajas y cambios de cargos docentes por curso.
  - Búsqueda de cursos por sede y filtro textual, con grilla de plantel docente actual (titulares y contratados).
  - Formularios de propuesta de novedades (alta/baja/cambio) con validación de acreditación y límite de novedades.
  - Auto-detección de cambios (horas, desarraigo, cambio de cargo) con baja automática del cargo anterior.
  - Servicio `AsignacionCursosService` para API REST de cursos, cargos tipos, geográficas, acreditación y novedades.
  - Reporte PDF de novedades docentes por facultad y período (`/api/haberes/report/novedades/novedadesDocentes`).
- **feat(`feature-cargos`):** Nuevo componente `DocentesSedeComponent` para reporte de docentes por sede.
  - Selector de sede geográfica con carga desde API (`/api/haberes/core/geografica`) y período (mes/año).
  - Descarga de reporte PDF de docentes por sede (`/api/haberes/report/docentes/docentesSede`).
  - Métodos `downloadDocentesSedeReport()` y `getGeograficas()` en `CargosReportService`.
- **feat(`novedades`):** Nuevas rutas `/docentes-sede` y `/asig-cursos` con ítems en el menú lateral.
  - Orden del menú: Asignación Cursos, Docentes por Sede, Cargos x Legajo, Anotador, Designaciones.

### Fixed
- **fix(`feature-cargos`):** Renombrada propiedad `reportUrl` a `cargosReportUrl` en `CargosReportService` para claridad semántica.

### Changed
- **chore(`feature-designaciones`):** Exportado `AsigCursosComponent` desde el barrel `index.ts`.
- **chore(`feature-cargos`):** Exportado `DocentesSedeComponent` desde el barrel `index.ts`.

## [0.2.0] - 2026-05-12

### Added
- **feat(`feature-anotador`):** Nueva librería para gestión de anotaciones docentes.
  - Componente `AnotadorComponent` con búsqueda de personas (por legajo o nombre), historial de anotaciones, lista de pendientes/revisados por facultad/período, y alta de nuevas anotaciones.
  - Integración con acreditación (validación de límite de novedades antes de permitir agregar).
- **feat(`feature-cargos`):** Nueva librería para reportes de cargos por legajo.
  - Componente `CargosLegajoComponent` con búsqueda de personas y descarga de reporte PDF detallado de cargos (`/api/haberes/report/bono/detalleCargos`).
- **feat(`novedades`):** Nuevas rutas `/anotador` y `/cargos` con ítems en el menú lateral de navegación.

### Fixed
- **fix(`feature-designaciones`):** Exportado `DesignacionesService` desde el barrel `index.ts` para permitir su reutilización por otras librerías.

### Changed
- **chore(`tsconfig.base.json`):** Agregados path mappings para `@haberes/feature-anotador` y `@haberes/feature-cargos`.

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
