import { MenuGroup, MenuItem } from '@haberes/ui-layout';

export interface OpcionSistema extends MenuItem {
  grupo: string;
  origenVb6: string;
  descripcion: string;
}

export interface GrupoOpciones extends MenuGroup<OpcionSistema> {
  id: string;
  descripcion: string;
  iconSvg: string;
  items: OpcionSistema[];
}

export const MENU_GROUPS: GrupoOpciones[] = [
  {
    id: 'liquidacion',
    title: 'Liquidación',
    descripcion: 'Operaciones centrales de cálculo, novedades y generación de declaraciones de haberes',
    iconSvg: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    items: [
      {
        label: 'Asignación de Cargos y Facultades',
        path: '/liquidacion/asig-cargos',
        grupo: 'Liquidación',
        origenVb6: 'frmAsigCargo.frm',
        descripcion: 'Asignación de cargos docentes/no docentes a facultades y dependencias',
        iconSvg: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
      },
      {
        label: 'Novedades',
        path: '/liquidacion/novedades',
        grupo: 'Liquidación',
        origenVb6: 'frmNovedad.frm',
        descripcion: 'Gestión y carga de novedades mensuales de haberes por agente',
        iconSvg: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
      },
      {
        label: 'Liquidación Individual',
        path: '/liquidacion/individual',
        grupo: 'Liquidación',
        origenVb6: 'frmLiqIndividual.frm',
        descripcion: 'Cálculo y previsualización de recibo de sueldo de un agente específico',
        iconSvg: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
      },
      {
        label: 'Liquidación General',
        path: '/liquidacion/general',
        grupo: 'Liquidación',
        origenVb6: 'frmLiqGeneral.frm',
        descripcion: 'Proceso masivo de liquidación mensual de haberes para toda la universidad',
        iconSvg: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
      },
      {
        label: 'Límite Novedades',
        path: '/liquidacion/limite-novedades',
        grupo: 'Liquidación',
        origenVb6: 'frmLimiteNovedades.frm',
        descripcion: 'Configuración de fechas de cierre y topes de carga de novedades',
        iconSvg: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
      },
      {
        label: 'Transferir Novedades',
        path: '/liquidacion/transferir-novedades',
        grupo: 'Liquidación',
        origenVb6: 'frmTransferir.frm',
        descripcion: 'Consolidación y migración de novedades entre períodos y facultades',
        iconSvg: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4'
      },
      {
        label: 'Control de Liquidación',
        path: '/liquidacion/control',
        grupo: 'Liquidación',
        origenVb6: 'frmControl.frm',
        descripcion: 'Controles de consistencia, validaciones de cálculos y auditoría de haberes',
        iconSvg: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
      },
      {
        label: 'Planilla No Docentes',
        path: '/liquidacion/planilla-no-docentes',
        grupo: 'Liquidación',
        origenVb6: 'frmPlNoDocentes.frm',
        descripcion: 'Planilla específica para personal administrativo, técnico y de maestranza',
        iconSvg: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
      },
      {
        label: 'Generar AFIP (SICORE)',
        path: '/liquidacion/afip-sicore',
        grupo: 'Liquidación',
        origenVb6: 'frmGenSICORE.frm',
        descripcion: 'Generación de archivo de retenciones para presentación en AFIP SICORE',
        iconSvg: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10'
      },
      {
        label: 'Generar SAC',
        path: '/liquidacion/sac',
        grupo: 'Liquidación',
        origenVb6: 'frmGeneraSAC.frm',
        descripcion: 'Cálculo semestral y liquidación del Sueldo Anual Complementario (Aguinaldo)',
        iconSvg: 'M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7'
      },
      {
        label: 'Generar SIJP',
        path: '/liquidacion/sijp',
        grupo: 'Liquidación',
        origenVb6: 'frmGenSIJP.frm',
        descripcion: 'Exportación de datos previsionales para el Sistema Integrado de Jubilaciones y Pensiones',
        iconSvg: 'M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2'
      },
      {
        label: 'Libro Sueldos Digital',
        path: '/liquidacion/libro-sueldos-digital',
        grupo: 'Liquidación',
        origenVb6: 'frmGenLSD.frm',
        descripcion: 'Generación y validación de archivos para Libro de Sueldos Digital (LSD - AFIP)',
        iconSvg: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4'
      }
    ]
  },
  {
    id: 'designaciones',
    title: 'Designaciones',
    descripcion: 'Administración docente, cargos con clase, cursos y validación de novedades de facultades',
    iconSvg: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    items: [
      {
        label: 'Designaciones',
        path: '/designaciones/general',
        grupo: 'Designaciones',
        origenVb6: 'frmDesignaciones.frm',
        descripcion: 'Gestión integral de designaciones docentes por facultad, sede y carrera',
        iconSvg: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
      },
      {
        label: 'Asignación de Cursos',
        path: '/designaciones/asig-cursos',
        grupo: 'Designaciones',
        origenVb6: 'frmAsigCursos.frm',
        descripcion: 'Asignación de docentes a comisiones y cursos específicos',
        iconSvg: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
      },
      {
        label: 'Autorizar Novedades',
        path: '/designaciones/autorizar-novedades',
        grupo: 'Designaciones',
        origenVb6: 'frmAutNovedad.frm',
        descripcion: 'Aprobación y autorización de novedades enviadas desde las facultades',
        iconSvg: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
      },
      {
        label: 'Asignación de Cargos con Clase',
        path: '/designaciones/cargos-clase',
        grupo: 'Designaciones',
        origenVb6: 'frmAsigCargoClase.frm',
        descripcion: 'Asociación de cargos docentes con su categoría y clase horaria',
        iconSvg: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'
      },
      {
        label: 'Revisar Anotador',
        path: '/designaciones/anotador',
        grupo: 'Designaciones',
        origenVb6: 'frmAnotadorHab.frm',
        descripcion: 'Visualización de notas y observaciones de personal remitidas por facultades',
        iconSvg: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
      },
      {
        label: 'Duplicar Cargos con Clase',
        path: '/designaciones/duplicar-cargos-clase',
        grupo: 'Designaciones',
        origenVb6: 'frmCargoClaseDup.frm',
        descripcion: 'Duplicación de estructura de cargos y clases para nuevos períodos académicos',
        iconSvg: 'M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z'
      },
      {
        label: 'Actualizar Cargos con Clase',
        path: '/designaciones/actualizar-cargos-clase',
        grupo: 'Designaciones',
        origenVb6: 'frmActCargoClase.frm',
        descripcion: 'Actualización masiva de vigencias y valores en cargos con clase',
        iconSvg: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
      },
      {
        label: 'Asignación de Materias',
        path: '/designaciones/asig-materias',
        grupo: 'Designaciones',
        origenVb6: 'frmAsigMateria.frm',
        descripcion: 'Vinculación de asignaturas y planes de estudio a docentes designados',
        iconSvg: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
      },
      {
        label: 'Fusionar Todos',
        path: '/designaciones/fusionar-todos',
        grupo: 'Designaciones',
        origenVb6: 'frmFusionTodos.frm',
        descripcion: 'Fusión integral de comisiones y clases docentes compartidas',
        iconSvg: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4'
      }
    ]
  },
  {
    id: 'movimientos',
    title: 'Movimientos y Bancos',
    descripcion: 'Generación de archivos para acreditación de haberes bancaria y comunicaciones',
    iconSvg: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
    items: [
      {
        label: 'Generar Archivo Santander',
        path: '/movimientos/santander',
        grupo: 'Movimientos y Bancos',
        origenVb6: 'frmGenSantander.frm',
        descripcion: 'Generación del archivo masivo de acreditaciones para Banco Santander',
        iconSvg: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
      },
      {
        label: 'Generar Archivo Otros Bancos',
        path: '/movimientos/otros-bancos',
        grupo: 'Movimientos y Bancos',
        origenVb6: 'frmGenOtrosBcos.frm',
        descripcion: 'Generación de archivo de transferencias interbancarias y CBU de otros bancos',
        iconSvg: 'M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z'
      },
      {
        label: 'Generar Archivo Santander Individual',
        path: '/movimientos/santander-individual',
        grupo: 'Movimientos y Bancos',
        origenVb6: 'frmGenSantanderInd.frm',
        descripcion: 'Emisión puntual de pago o ajuste de acreditación Santander para un agente',
        iconSvg: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
      },
      {
        label: 'Generar Archivo Otros Bancos Individual',
        path: '/movimientos/otros-bancos-individual',
        grupo: 'Movimientos y Bancos',
        origenVb6: 'frmGenOtrosBcosInd.frm',
        descripcion: 'Emisión puntual de transferencia para cuenta bancaria individual de otro banco',
        iconSvg: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z'
      },
      {
        label: 'Cargar Excluidos',
        path: '/movimientos/excluidos',
        grupo: 'Movimientos y Bancos',
        origenVb6: 'frmExcluidos.frm',
        descripcion: 'Gestión de agentes con pago retenido o excluidos del envío bancario',
        iconSvg: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636'
      },
      {
        label: 'Mailing de Recibos',
        path: '/movimientos/mailing',
        grupo: 'Movimientos y Bancos',
        origenVb6: 'frmMailing.frm',
        descripcion: 'Envío electrónico masivo de recibos de sueldo por correo electrónico',
        iconSvg: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
      }
    ]
  },
  {
    id: 'consultas',
    title: 'Consultas y Reportes',
    descripcion: 'Informes de auditoría, totales generales, recibos y planillas de haberes',
    iconSvg: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    items: [
      {
        label: 'Imprimir Bonos por Dependencia',
        path: '/consultas/bonos-dependencia',
        grupo: 'Consultas y Reportes',
        origenVb6: 'frmImprimir.frm',
        descripcion: 'Emisión e impresión de recibos de sueldo agrupados por facultad o dependencia',
        iconSvg: 'M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z'
      },
      {
        label: 'Imprimir Bono Individual',
        path: '/consultas/bono-individual',
        grupo: 'Consultas y Reportes',
        origenVb6: 'frmImprimirInd.frm',
        descripcion: 'Impresión individual o generación de PDF del recibo de sueldo del personal',
        iconSvg: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
      },
      {
        label: 'Comparación Entre Meses Consecutivos',
        path: '/consultas/comparacion-meses',
        grupo: 'Consultas y Reportes',
        origenVb6: 'frmCompEntreMesesConsec.frm',
        descripcion: 'Análisis comparativo de variaciones salariales entre dos meses consecutivos',
        iconSvg: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
      },
      {
        label: 'Totales Generales',
        path: '/consultas/totales-generales',
        grupo: 'Consultas y Reportes',
        origenVb6: 'frmRpTotGeneral.frm',
        descripcion: 'Resumen consolidado de haberes, aportes, contribuciones y costo total',
        iconSvg: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z'
      },
      {
        label: 'Totales Generales por Código',
        path: '/consultas/totales-codigo',
        grupo: 'Consultas y Reportes',
        origenVb6: 'frmRpTotCodigo.frm',
        descripcion: 'Acumulado mensual desagregado por cada concepto o código de liquidación',
        iconSvg: 'M4 6h16M4 10h16M4 14h16M4 18h16'
      },
      {
        label: 'Detalle por Código',
        path: '/consultas/detalle-codigo',
        grupo: 'Consultas y Reportes',
        origenVb6: 'frmRpDetCodigo.frm',
        descripcion: 'Listado detallado de agentes a los que se les liquidó un código en particular',
        iconSvg: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01'
      },
      {
        label: 'Impresión Libro de Sueldos',
        path: '/consultas/libro-sueldos',
        grupo: 'Consultas y Reportes',
        origenVb6: 'frmLibroSueldo.frm',
        descripcion: 'Generación del Libro de Sueldos legal en formato oficial',
        iconSvg: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
      },
      {
        label: 'Docentes por Sede',
        path: '/consultas/docentes-sede',
        grupo: 'Consultas y Reportes',
        origenVb6: 'frmDocSede.frm',
        descripcion: 'Reporte de docentes con actividades y designaciones activas por sede',
        iconSvg: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
      },
      {
        label: 'Designación de Docentes',
        path: '/consultas/designacion-docentes',
        grupo: 'Consultas y Reportes',
        origenVb6: 'frmDocDesig.frm',
        descripcion: 'Listado oficial de designaciones docentes por unidad académica',
        iconSvg: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
      },
      {
        label: 'Cursos por Docente',
        path: '/consultas/cursos-docente',
        grupo: 'Consultas y Reportes',
        origenVb6: 'frmCurDocente.frm',
        descripcion: 'Detalle de materias y comisiones que tiene a cargo cada docente',
        iconSvg: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
      },
      {
        label: 'Cursos por Contratado',
        path: '/consultas/cursos-contratado',
        grupo: 'Consultas y Reportes',
        origenVb6: 'frmCursoContratado.frm',
        descripcion: 'Relevamiento de cursos dictados por personal con modalidad contratada',
        iconSvg: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
      },
      {
        label: 'Fusión por Docente',
        path: '/consultas/fusion-docente',
        grupo: 'Consultas y Reportes',
        origenVb6: 'frmFusDocente.frm',
        descripcion: 'Reporte de cursos y cargos unificados o compartidos por docente',
        iconSvg: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4'
      },
      {
        label: 'Planilla de Liquidables',
        path: '/consultas/planilla-liquidables',
        grupo: 'Consultas y Reportes',
        origenVb6: 'frmLiquidables.frm',
        descripcion: 'Padrón de agentes habilitados para liquidar en el período corriente',
        iconSvg: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
      },
      {
        label: 'Planilla de Cargos por Período',
        path: '/consultas/cargos-periodo',
        grupo: 'Consultas y Reportes',
        origenVb6: 'frmCargoPeriodo.frm',
        descripcion: 'Evolución y distribución de cargos asignados por mes o período',
        iconSvg: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
      },
      {
        label: 'Planilla de Cursos por Período',
        path: '/consultas/cursos-periodo',
        grupo: 'Consultas y Reportes',
        origenVb6: 'frmCursoPeriodo.frm',
        descripcion: 'Seguimiento de cursos abiertos y comisiones dictadas en el ciclo lectivo',
        iconSvg: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
      },
      {
        label: 'Planilla de Básicos por Período',
        path: '/consultas/basicos-periodo',
        grupo: 'Consultas y Reportes',
        origenVb6: 'frmBasicoPeriodo.frm',
        descripcion: 'Escala de sueldos básicos y adicionales históricos por período',
        iconSvg: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
      },
      {
        label: 'Planilla de Cantidad de Cargos',
        path: '/consultas/cantidad-cargos',
        grupo: 'Consultas y Reportes',
        origenVb6: 'frmDocenteCantidad.frm',
        descripcion: 'Estadística y recuento de cargos acumulados por legajo docente',
        iconSvg: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
      },
      {
        label: 'Histórico de Asignación de Cargos',
        path: '/consultas/historico-cargos',
        grupo: 'Consultas y Reportes',
        origenVb6: 'frmCargoHist.frm',
        descripcion: 'Historial de altas, bajas y modificaciones en asignaciones de cargos',
        iconSvg: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
      },
      {
        label: 'Cargos con Clase por Facultad',
        path: '/consultas/cargos-clase-facultad',
        grupo: 'Consultas y Reportes',
        origenVb6: 'frmRpCargoClase.frm',
        descripcion: 'Reporte discriminado de cargos con clase organizados por facultad',
        iconSvg: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
      }
    ]
  },
  {
    id: 'contabilidad',
    title: 'Contabilidad',
    descripcion: 'Imputaciones contables, centros de costo y totales del Formulario 931',
    iconSvg: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z',
    items: [
      {
        label: 'Generar Imputación Individual',
        path: '/contabilidad/imputacion-individual',
        grupo: 'Contabilidad',
        origenVb6: 'frmAsientoInd.frm',
        descripcion: 'Generación del asiento de imputación contable de un legajo o ajuste específico',
        iconSvg: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
      },
      {
        label: 'Generar Imputación Masiva',
        path: '/contabilidad/imputacion-masiva',
        grupo: 'Contabilidad',
        origenVb6: 'frmAsiento.frm',
        descripcion: 'Generación masiva del asiento de sueldos para el sistema contable de tesorería',
        iconSvg: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
      },
      {
        label: 'Totales Formulario 931',
        path: '/contabilidad/formulario-931',
        grupo: 'Contabilidad',
        origenVb6: 'frmFF931.frm',
        descripcion: 'Resumen consolidado de aportes y contribuciones patronales para AFIP F.931',
        iconSvg: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
      },
      {
        label: 'Imputaciones Contables Cargos',
        path: '/contabilidad/imputaciones-cargos',
        grupo: 'Contabilidad',
        origenVb6: 'frmImputCargos.frm',
        descripcion: 'Mapeo de cuentas contables y centros de costo por tipo de cargo',
        iconSvg: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4'
      },
      {
        label: 'Imputaciones Contables Cargos con Clase',
        path: '/contabilidad/imputaciones-cargos-clase',
        grupo: 'Contabilidad',
        origenVb6: 'frmImputClases.frm',
        descripcion: 'Parametrización contable por clase docente y dedicación horaria',
        iconSvg: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'
      },
      {
        label: 'Imputaciones Contables Códigos',
        path: '/contabilidad/imputaciones-codigos',
        grupo: 'Contabilidad',
        origenVb6: 'frmImputCodigos.frm',
        descripcion: 'Asignación de cuentas contables específicas a cada concepto salarial',
        iconSvg: 'M4 6h16M4 10h16M4 14h16M4 18h16'
      }
    ]
  },
  {
    id: 'parametros',
    title: 'Parámetros y Tablas',
    descripcion: 'Gestión de personas, sedes, categorías, clases y conceptos salariales',
    iconSvg: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
    items: [
      {
        label: 'Datos Personales',
        path: '/parametros/personas',
        grupo: 'Parámetros y Tablas',
        origenVb6: 'frmPersona.frm',
        descripcion: 'Padrón de personas físicas, legajos, CUIL y datos filiatorios',
        iconSvg: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
      },
      {
        label: 'Contactos',
        path: '/parametros/contactos',
        grupo: 'Parámetros y Tablas',
        origenVb6: 'frmContactos.frm',
        descripcion: 'Gestión de correos electrónicos, teléfonos y domicilios por persona',
        iconSvg: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z'
      },
      {
        label: 'Adicional Carga Horaria',
        path: '/parametros/adicional-carga-horaria',
        grupo: 'Parámetros y Tablas',
        origenVb6: 'frmAdicional.frm',
        descripcion: 'Tablas de coeficientes y escalas por dedicación o carga horaria',
        iconSvg: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
      },
      {
        label: 'Categorías',
        path: '/parametros/categorias',
        grupo: 'Parámetros y Tablas',
        origenVb6: 'frmCategoria.frm',
        descripcion: 'Catálogo de categorías escalafonarias docentes y no docentes',
        iconSvg: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z'
      },
      {
        label: 'Cargos con Clase',
        path: '/parametros/cargos-clase',
        grupo: 'Parámetros y Tablas',
        origenVb6: 'frmCargoClase.frm',
        descripcion: 'Definición de cargos académicos vinculados con horas cátedra/clase',
        iconSvg: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'
      },
      {
        label: 'Clases',
        path: '/parametros/clases',
        grupo: 'Parámetros y Tablas',
        origenVb6: 'frmClase.frm',
        descripcion: 'Maestro de tipos de clases docentes (teoría, práctica, seminario)',
        iconSvg: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
      },
      {
        label: 'Códigos de Haberes',
        path: '/parametros/codigos',
        grupo: 'Parámetros y Tablas',
        origenVb6: 'frmCodigo.frm',
        descripcion: 'Conceptos salariales remunerativos, no remunerativos y descuentos',
        iconSvg: 'M4 6h16M4 10h16M4 14h16M4 18h16'
      },
      {
        label: 'Sedes',
        path: '/parametros/sedes',
        grupo: 'Parámetros y Tablas',
        origenVb6: 'frmGeografica.frm',
        descripcion: 'Configuración geográfica de sedes y dependencias de la universidad',
        iconSvg: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
      }
    ]
  }
];

export const TODAS_LAS_OPCIONES: OpcionSistema[] = MENU_GROUPS.flatMap(g => g.items);
