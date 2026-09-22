# @haberes/feature-bonos

Librería de impresión individual de bonos de sueldo para el módulo de Liquidación
(migración de `frmImprimirInd.frm` / `clsCtlPrint.cls` de `prjBonos.vbp`).

## Servicios

- **`BonoReportService`**: acceso a la API de haberes-core (`/api/haberes/core/bono`,
  hexagonal `liquidaciones/bono`) y del report service (`/api/haberes/report/bono`):
  - `GET .../integridad` — verificación previa (Liquidación, Item, Actividad, LegajoControl, dependencia).
  - `POST .../prepare` — recalcula actividad (`beforePrintBono`), sin registrar auditoría.
  - `GET /api/haberes/report/bono/ui/generatePdf/{legajoId}/{anho}/{mes}` — blob PDF del bono.
    Endpoint **exclusivo del front**: NO audita ni recibe IP (las rutas legacy
    `generatePdf/.../{ipAddress}` quedan sólo para el cliente VB6).
  - `POST .../auditoria` — registra la auditoría de impresión en el core, que resuelve la
    IP real del request server-side (`ClientIpResolver`).
  - `POST .../send-prepare` — valida mail, guarda contacto (upsert) y registra auditoría con IP server-side.
  - `GET /api/haberes/report/bono/ui/sendBono/{legajoId}/{anho}/{mes}` — envío por e-mail (respuesta
    texto). Endpoint **exclusivo del front**: NO audita (el legado `sendBono/.../{ipAddress}` queda para VB6).
  - `POST /api/haberes/core/tool/mailvalidate` — validación de mail (equivalente a `modValidate.validateMail`).
  - `GET /api/haberes/core/contacto/{legajoId}` — mail institucional.
  - `GET .../auditoria` — historial de impresiones del período.

Flujo Imprimir: `prepare` (core recalcula) → `ui/generatePdf` (report devuelve el PDF sin auditar)
→ `auditoria` (core audita con la IP real del request, un solo registro). Flujo Enviar: `send-prepare`
(core valida mail, hace upsert de contacto y audita con IP real, sin pisar fijo/movil/mailPersonal)
→ `ui/sendBono` (report envía el correo sin auditar).

La identidad solicitante viaja como `legajoIdSolicitud` en el body (el gateway no inyecta
hoy el header `X-Legajo-Solicitante`, verificado en despliegue local; el core lo prioriza
si existiera). La IP del puesto nunca la manda el browser: la resuelve el core con
`ClientIpResolver` (`X-Forwarded-For` → `X-Real-IP` → `getRemoteAddr`) al momento de auditar,
por lo que ya no se envía ningún placeholder.

## Componentes

- **`BonoIndividualComponent`**: pantalla `/consultas/bono-individual` de la app
  `liquidacion` (migración de `frmImprimirInd.frm`): búsqueda de personal por legajo o
  apellido, período mes/año con navegación, verificación de integridad, impresión
  (descarga/apertura del PDF y auditoría con la IP real en el core) y envío por e-mail
  con validación de mail vía `POST /api/haberes/core/tool/mailvalidate` (equivalente a
  `modValidate.validateMail` de VB6).

## Dependencias

- `@haberes/shared-api` (AuthService para el legajo solicitante)
- `@haberes/feature-designaciones` (búsqueda de personas, patrón de feature-cargos)
