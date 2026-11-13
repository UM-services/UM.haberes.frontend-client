import { NOVEDADES_GRUPOS, NOVEDADES_MENU_ITEMS } from './novedades-menu.data';

const PATHS_ESPERADOS = [
  '/inicio',
  '/asig-cursos',
  '/docentes-sede',
  '/cargos',
  '/anotador',
  '/designaciones',
];

describe('datos del menú de Novedades', () => {
  it('el menú cubre todas las pantallas de Novedades', () => {
    expect(NOVEDADES_MENU_ITEMS.map((item) => item.path)).toEqual(PATHS_ESPERADOS);
  });

  it('cada opción del menú tiene label e ícono', () => {
    for (const item of NOVEDADES_MENU_ITEMS) {
      expect(item.label.length).toBeGreaterThan(0);
      expect(item.iconSvg?.length).toBeGreaterThan(0);
    }
  });

  it('el directorio expone las mismas pantallas que el menú (sin el panel)', () => {
    const pathsDirectorio = NOVEDADES_GRUPOS.flatMap((grupo) =>
      grupo.items.map((item) => item.path),
    ).sort();

    expect(pathsDirectorio).toEqual(
      PATHS_ESPERADOS.filter((path) => path !== '/inicio').sort(),
    );
  });

  it('todas las opciones del directorio están disponibles', () => {
    const noDisponibles = NOVEDADES_GRUPOS.flatMap((grupo) => grupo.items).filter(
      (item) => !item.disponible,
    );

    expect(noDisponibles).toEqual([]);
  });
});
