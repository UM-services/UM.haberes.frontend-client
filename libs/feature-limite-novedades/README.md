# feature-limite-novedades

Pantalla **Límite de Novedades** del módulo Administrador: fija hasta qué día se
pueden cargar novedades de un período y muestra el estado del registro de
acreditación (contable y bancario) en sólo lectura.

## Contrato usado de `haberes-core`

| Método | Endpoint | Uso |
|---|---|---|
| `GET` | `/api/haberes/core/acreditacion/periodo/{anho}/{mes}` | Lectura del período. **404 = período sin registro** (se traduce a `null`) |
| `POST` | `/api/haberes/core/acreditacion/` | Alta del período con `{ anho, mes, limiteNovedades }` |
| `PATCH` | `/api/haberes/core/acreditacion/{acreditacionId}` | Edición parcial de `{ limiteNovedades }`; nunca toca el resto del registro |

No se usa el `PUT` de reemplazo total: pisa `acreditado`, fechas contables e
importes con los valores del body.

## Conversión de fechas

El límite se persiste como **fin del día elegido en hora de Argentina**
(`yyyy-MM-ddT23:59:59-0300`), porque el corte real ocurre al terminar ese día.
El offset va sin dos puntos porque los DTOs del backend usan el patrón `XX`.

Los registros heredados guardaron `yyyy-MM-ddT00:00:00Z`; el backend los devuelve
como `…T00:00:00Z`, que en ART es el día anterior a las 21:00. Por eso la lectura
no puede hacer `slice(0, 10)` a secas:

- `fechaLimiteVisible(valor)`: si el valor es medianoche UTC devuelve el día tal
  cual (registro heredado); en cualquier otro caso convierte al día calendario de
  `America/Argentina/Buenos_Aires`.
- `fechaLimitePayload(fecha)`: arma el fin del día en ART para el backend.

Regla estable: los valores nuevos son `…T02:59:59Z`, nunca medianoche UTC, así
que un registro deja de clasificarse como heredado en cuanto se guarda y la fecha
mostrada no cambia.

**No se usa `fechaInput` de `@haberes/shared-api`** en este campo: hace
`slice(0, 10)` sobre el ISO y con la convención nueva mostraría el día siguiente.

## Pruebas

```bash
npx nx test feature-limite-novedades
npx nx lint feature-limite-novedades
```
