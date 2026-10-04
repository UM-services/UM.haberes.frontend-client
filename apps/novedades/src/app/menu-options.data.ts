import { GrupoPanel } from '@haberes/ui-layout';

/**
 * Opciones del módulo Novedades para el panel principal (presentación del
 * hub de tesorería). Las grouping siguen la taxonomía del directorio de
 * Liquidación (Designaciones vs Consultas y Reportes).
 */
export const NOVEDADES_GRUPOS: GrupoPanel[] = [
  {
    id: 'designaciones',
    title: 'Designaciones',
    descripcion: 'Gestión docente, asignación de cursos y revisión de novedades de facultades',
    items: [
      {
        label: 'Designaciones',
        path: '/designaciones',
        descripcion: 'Gestión integral de designaciones docentes por facultad, sede y carrera',
        disponible: true
      },
      {
        label: 'Asignación de Cursos',
        path: '/asig-cursos',
        descripcion: 'Asignación de docentes a comisiones y cursos específicos',
        disponible: true
      },
      {
        label: 'Revisar Anotador',
        path: '/anotador',
        descripcion: 'Visualización de notas y observaciones de personal remitidas por facultades',
        disponible: true
      }
    ]
  },
  {
    id: 'consultas',
    title: 'Consultas',
    descripcion: 'Reportes de docentes activos y cargos por legajo',
    items: [
      {
        label: 'Docentes por Sede',
        path: '/docentes-sede',
        descripcion: 'Reporte de docentes con actividades y designaciones activas por sede',
        disponible: true
      },
      {
        label: 'Cargos por Legajo',
        path: '/cargos',
        descripcion: 'Detalle de cargos y designaciones de un agente por número de legajo',
        disponible: true
      }
    ]
  }
];
