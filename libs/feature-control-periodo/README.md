# Control del Período

Parámetros mensuales del período: fechas de liquidación, pago y depósito, alícuotas, topes SIJP,
adicionales, modo de liquidación y el bloque **ETEC (cargos por puntos)**.

- El control ETEC guarda los siete parámetros de `control_etec` (valor del punto con cuatro
  decimales, monto fijo del cargo, presentismo, adicional carrera docente, garantía, horas
  adicionales y valor hora adicional). Se consulta con
  `GET /api/haberes/core/etec/control/{anho}/{mes}/opcional`, se guarda junto con el período con
  `POST /api/haberes/core/etec/control/{anho}/{mes}`, se copia con
  `POST /api/haberes/core/etec/control/copiar/{anho}/{mes}` y muestra un badge
  **Configurado / Sin configurar**.
- La tarjeta incluye la **escala global de arraigo** (tramos de antigüedad mínima → porcentaje),
  independiente del período: se lee con `GET /api/haberes/core/etec/arraigo/escala` y se reemplaza
  completa con `PUT /api/haberes/core/etec/arraigo/escala`. Valida años ≥ 1, antigüedades no
  repetidas y porcentajes entre 0 y 100.
- Consumida por la app `administrador`.
- Alias: `@haberes/feature-control-periodo`.
- Ruta: `/control-periodo` (ver `apps/administrador/src/app/app.routes.ts`).
- Pruebas: `npx nx test feature-control-periodo` (usa el build de desarrollo de `administrador`).
