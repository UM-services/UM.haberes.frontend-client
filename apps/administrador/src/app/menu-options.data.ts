import { MenuGroup, GrupoPanel } from '@haberes/ui-layout';

/**
 * Menú del shell del módulo Administrador. Sigue los tres bloques en que el
 * sistema anterior agrupaba los parámetros: personas, catálogos de liquidación
 * y parámetros de cálculo.
 */
export const ADMINISTRADOR_MENU_GROUPS: MenuGroup[] = [
  {
    title: 'Personas',
    iconSvg:
      'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6-4a3 3 0 11-3-3',
    items: [
      { label: 'Datos Personales', path: '/personas' },
    ],
  },
  {
    title: 'Catálogos de liquidación',
    iconSvg: 'M4 6h16M4 10h16M4 14h10M4 18h7',
    items: [
      { label: 'Categorías', path: '/categorias' },
      { label: 'Códigos', path: '/codigos' },
      { label: 'Clases', path: '/clases' },
      { label: 'Cargos con Clase', path: '/cargos-clase' },
    ],
  },
  {
    title: 'Parámetros de cálculo',
    iconSvg:
      'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
    items: [
      { label: 'Adicional Carga Horaria', path: '/adicionales' },
      { label: 'Sedes', path: '/sedes' },
    ],
  },
];

/**
 * Panel de inicio: mismas opciones del menú, con descripción y estado.
 * `disponible` pasa a true a medida que cada pantalla se implementa.
 */
export const ADMINISTRADOR_GRUPOS: GrupoPanel[] = [
  {
    id: 'personas',
    title: 'Personas',
    descripcion: 'Legajo maestro del personal',
    items: [
      {
        label: 'Datos Personales',
        path: '/personas',
        descripcion: 'Datos filiatorios, situación, contacto y CBU por período',
        disponible: true,
      },
    ],
  },
  {
    id: 'catalogos',
    title: 'Catálogos de liquidación',
    descripcion: 'Conceptos, categorías y clases que alimentan la liquidación',
    items: [
      {
        label: 'Categorías',
        path: '/categorias',
        descripcion: 'Básicos por categoría, flags docente/no docente y vigencia mensual',
        disponible: true,
      },
      {
        label: 'Códigos',
        path: '/codigos',
        descripcion: 'Códigos de concepto, clasificación contable y conceptos AFIP',
        disponible: true,
      },
      {
        label: 'Clases',
        path: '/clases',
        descripcion: 'Clases de hora cátedra y valor hora',
        disponible: true,
      },
      {
        label: 'Cargos con Clase',
        path: '/cargos-clase',
        descripcion: 'Catálogo de cargos con clase y legajos asignados por período',
        disponible: true,
      },
    ],
  },
  {
    id: 'parametros',
    title: 'Parámetros de cálculo',
    descripcion: 'Valores y sedes que intervienen en el cálculo de adicionales',
    items: [
      {
        label: 'Adicional Carga Horaria',
        path: '/adicionales',
        descripcion: 'Rangos de horas y porcentaje de adicional por facultad y sede',
        disponible: true,
      },
      {
        label: 'Sedes',
        path: '/sedes',
        descripcion: 'Sedes, importe de desarraigo y sede de reemplazo',
        disponible: true,
      },
    ],
  },
];
