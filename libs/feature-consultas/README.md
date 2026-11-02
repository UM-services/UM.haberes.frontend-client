# @haberes/feature-consultas

Pantallas del grupo **Consultas y Reportes** del módulo Liquidación (app `liquidacion`,
puerto 4209). Consume exclusivamente el namespace nuevo de `haberes-report`:

```
GET /api/haberes/report/ui/{reporte}/data/{params}   -> DTO tipado para la tabla
GET /api/haberes/report/ui/{reporte}/pdf/{params}    -> PDF del mismo contenido
GET /api/haberes/report/ui/{reporte}/xlsx/{params}   -> XLSX del mismo contenido

```

La API key del namespace la inyecta el gateway (`SetRequestHeader=X-API-Key`): el navegador
no la conoce. Las rutas legacy que consume el cliente de escritorio no pasan por ese filtro.

## Patrón de pantalla

1. Filtros idénticos al formulario legado (`haberes-consulta-periodo` para mes/año).
2. Botón **Ver datos** → `ConsultasReportService.data<TotalesGeneralesData>('reporte', params)`.
3. Tabla presentacional compartida `haberes-reporte-tabla`, con columnas **tipadas** contra el
   DTO de cada reporte (`ColumnaTabla<Fila>`).
4. Botones **PDF** y **XLSX** con los mismos parámetros que la tabla visible.

## Migradas

| Ruta | Pantalla | Origen legado | Backend |
|---|---|---|---|
| `/consultas/totales-generales` | Totales Generales | `frmRpTotGeneral.frm` (`rptTotalGeneral`) | `/ui/totalesGenerales/{data,pdf,xlsx}/{anho}/{mes}` |
| `/consultas/totales-codigo` | Totales Generales por Código (vistas Totales/Comparación) | `frmRpTotCodigo.frm` (`rptTotalCodigo` + `rptCodigoComparativo`) | `/ui/totalesCodigo/...` + `/ui/comparacionCodigos/...` |
| `/consultas/comparacion-meses` | Comparación entre Meses Consecutivos | `frmCompEntreMesesConsec.frm` | `/ui/comparacionRemuneraciones/.../{anhoAnterior}/{mesAnterior}` |
| `/consultas/docentes-sede` | Docentes por Sede | `frmDocSede.frm` | `/ui/docentesSede/{facultadId}/{geograficaId}/{anho}/{mes}` |
| `/consultas/designacion-docentes` | Designación de Docentes | `frmDocDesig.frm` | `/ui/designacionesDocente/{anho}/{mes}` |
| `/consultas/cursos-docente` | Cursos por Docente | `frmCurDocente.frm` | `/ui/cursoDocente/{anho}/{mes}` |
| `/consultas/fusion-docente` | Fusión por Docente | `frmFusDocente.frm` | `/ui/fusionDocente/{anho}/{mes}` |
| `/consultas/cargos-clase-facultad` | Cargos con Clase por Facultad | `frmRpCargoClase.frm` | `/ui/cargosClasePeriodo/{facultadId}/{anho}/{mes}` |
| `/consultas/planilla-liquidables` | Planilla de Liquidables (sin período) | `frmLiquidables.frm` | `/ui/liquidables/{data,pdf,xlsx}` |
| `/consultas/cantidad-cargos` | Cantidad de Cargos | `frmDocenteCantidad.frm` | `/ui/cantidadCargos/{data,pdf,xlsx}/{anho}/{mes}` |
| `/consultas/detalle-codigo` | Detalle por Código | `frmRpDetCodigo.frm` | `/ui/detalleCodigo/{data,pdf,xlsx}/{codigoId}/{anho}/{mes}` |
| `/consultas/cargos-periodo` | Cargos por Período | `frmCargoPeriodo.frm` | `/ui/cargosPeriodo/{data,pdf,xlsx}/{anho}/{mes}` |
| `/consultas/cursos-periodo` | Cursos por Período | `frmCursoPeriodo.frm` | `/ui/cursosPeriodo/{data,pdf,xlsx}/{anho}/{mes}` |
| `/consultas/libro-sueldos` | Libro de Sueldos (+ LSD ZIP) | `frmLibroSueldo.frm` | `/ui/libroSueldos/{data,pdf,xlsx}/{anho}/{mes}` + `POST /ui/libroSueldos/lsd/{anho}/{mes}` |
| `/consultas/basicos-periodo` | Básicos por Período | `frmBasicoPeriodo.frm` | `/ui/basicosPeriodo/{data,pdf,xlsx}/{anho}/{mes}` |
| `/consultas/cursos-contratado` | Cursos por Contratado | `frmCursoContratado.frm` | `/ui/cursosContratado/{data,pdf,xlsx}/{anho}/{mes}` |
| `/consultas/bonos-dependencia` | Bonos por Dependencia (grilla + PDF + envío) | `frmImprimir.frm` | `/ui/bonoDependencia/{data,pdf}/{anho}/{mes}/{dependenciaId}/{salida}` + `/ui/bonoDependencia/sendBono/{legajoId}/{anho}/{mes}` |
| `/consultas/historico-cargos` | Histórico de Asignación de Cargos (aviso + PDF) | `frmCargoHist.frm` | `/ui/historicoCargos/{data,pdf}/{categoriaId}` |

## Convenciones

- Un `models.ts` por reporte (interface del DTO del backend); no se comparten DTOs entre
  pantallas.
- La tabla no conoce reportes: recibe columnas y secciones ya tipadas.
- Sin `@RequestParam` en el backend: los parámetros viajan por path.
- Importes alineados a la derecha con `font-mono tabular-nums` (lo aplica la tabla según el
  `tipo` de la columna).
- No se exponen nombres ni artefactos del sistema legado en la interfaz.
