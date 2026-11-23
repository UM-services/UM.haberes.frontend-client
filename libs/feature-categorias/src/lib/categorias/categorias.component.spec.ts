import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { CategoriasComponent } from './categorias.component';
import { Categoria, CategoriaPage, CategoriasService } from './categorias.service';

function categoria(categoriaId: number, nombre: string): Categoria {
  return {
    categoriaId,
    nombre,
    basico: 100,
    docente: 1,
    noDocente: 0,
    liquidaPorHora: 0,
    estadoDocente: 0,
    puntos: 0,
    etecHoras: 0,
  };
}

function pagina(
  filas: Categoria[],
  total = filas.length,
  paginaActual = 0,
  tamano = 50,
): CategoriaPage {
  return { filas, total, pagina: paginaActual, tamano };
}

function crearStub(overrides: Record<string, unknown> = {}) {
  return {
    getCategorias: vi.fn(() => of([])),
    search: vi.fn(() => of(pagina([]))),
    getLast: vi.fn(() => of(categoria(1306, 'Última'))),
    create: vi.fn(() => of(categoria(1, 'Nueva'))),
    update: vi.fn(() => of(categoria(1, 'Editada'))),
    delete: vi.fn(() => of(void 0)),
    download: vi.fn(() => of(new Blob())),
    upload: vi.fn(() => of(void 0)),
    ...overrides,
  };
}

async function crear(stub: ReturnType<typeof crearStub>) {
  await TestBed.configureTestingModule({
    imports: [CategoriasComponent],
    providers: [{ provide: CategoriasService, useValue: stub }],
  }).compileComponents();

  const fixture = TestBed.createComponent(CategoriasComponent);
  fixture.detectChanges();
  return fixture;
}

/** El buscador de texto espera 300 ms antes de consultar. */
function esperarDebounce(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 320));
}

describe('CategoriasComponent', () => {
  it('se crea y busca la primera página sin filtro', async () => {
    const stub = crearStub();

    const fixture = await crear(stub);

    expect(fixture.componentInstance.filas()).toEqual([]);
    expect(fixture.componentInstance.total()).toBe(0);
    expect(stub.search).toHaveBeenCalledWith({ texto: '', pagina: 0, tamano: 50 });
  });

  it('sugiere el siguiente id con el último del backend', async () => {
    const stub = crearStub({ getLast: vi.fn(() => of(categoria(1306, 'Última'))) });

    const fixture = await crear(stub);
    fixture.componentInstance.nueva();

    expect(fixture.componentInstance.form.categoriaId).toBe(1307);
  });

  it('espera 300 ms antes de buscar por texto y limpia la página', async () => {
    const stub = crearStub();
    const fixture = await crear(stub);
    const componente = fixture.componentInstance;
    stub.search.mockClear();

    componente.onFiltro('aux');
    expect(stub.search).not.toHaveBeenCalled();

    await esperarDebounce();

    expect(stub.search).toHaveBeenCalledTimes(1);
    expect(stub.search).toHaveBeenCalledWith({ texto: 'aux', pagina: 0, tamano: 50 });
  });

  it('pagina de a 50 filas y deshabilita Siguiente en la última página', async () => {
    const stub = crearStub({
      search: vi.fn(() => of(pagina([categoria(1, 'A')], 51, 0))),
    });
    const fixture = await crear(stub);
    const componente = fixture.componentInstance;

    expect(componente.inicioRango()).toBe(1);
    expect(componente.finRango()).toBe(1);
    expect(componente.hayPaginaAnterior()).toBe(false);
    expect(componente.hayPaginaSiguiente()).toBe(true);

    stub.search.mockClear();
    componente.irPagina(1);

    expect(componente.pagina()).toBe(1);
    expect(stub.search).toHaveBeenCalledWith(expect.objectContaining({ pagina: 1 }));
    expect(componente.hayPaginaAnterior()).toBe(true);
    expect(componente.hayPaginaSiguiente()).toBe(false);
  });

  it('no retrocede antes de la primera página', async () => {
    const stub = crearStub();
    const fixture = await crear(stub);
    const componente = fixture.componentInstance;
    stub.search.mockClear();

    componente.irPagina(-1);

    expect(componente.pagina()).toBe(0);
    expect(stub.search).not.toHaveBeenCalled();
  });

  it('limpiar el filtro vuelve a la primera página sin texto', async () => {
    const stub = crearStub();
    const fixture = await crear(stub);
    const componente = fixture.componentInstance;

    componente.onFiltro('aux');
    await esperarDebounce();
    stub.search.mockClear();

    componente.limpiarFiltro();

    expect(componente.filtroTexto()).toBe('');
    expect(componente.pagina()).toBe(0);
    expect(stub.search).toHaveBeenCalledWith({ texto: '', pagina: 0, tamano: 50 });
  });

  it('muestra el estado vacío cuando el filtro no tiene coincidencias', async () => {
    const stub = crearStub({ search: vi.fn(() => of(pagina([], 0))) });
    const fixture = await crear(stub);

    fixture.componentInstance.onFiltro('zzz');
    await esperarDebounce();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Ninguna categoría coincide con el filtro');
  });

  it('al dar de alta vuelve a la primera página y conserva el filtro', async () => {
    const stub = crearStub({
      search: vi.fn((filtro: { pagina?: number }) =>
        of(pagina([categoria(1, 'A')], 200, filtro?.pagina ?? 0)),
      ),
    });
    const fixture = await crear(stub);
    const componente = fixture.componentInstance;

    componente.onFiltro('a');
    await esperarDebounce();
    componente.pagina.set(2);
    stub.search.mockClear();

    componente.nueva();
    componente.form.nombre = 'Nueva';
    componente.form.categoriaId = 7;
    componente.form.basico = 100;
    componente.guardar();

    expect(stub.create).toHaveBeenCalled();
    expect(componente.pagina()).toBe(0);
    expect(componente.filtroTexto()).toBe('a');
    expect(stub.search).toHaveBeenCalledWith({ texto: 'a', pagina: 0, tamano: 50 });
  });

  it('muestra el mensaje del backend cuando el id ya existe', async () => {
    const stub = crearStub({
      create: vi.fn(() =>
        throwError(
          () =>
            new HttpErrorResponse({
              status: 400,
              error: { detail: 'La categoría 7 ya existe' },
            }),
        ),
      ),
    });
    const fixture = await crear(stub);
    const componente = fixture.componentInstance;

    componente.nueva();
    componente.form.nombre = 'Duplicada';
    componente.form.categoriaId = 7;
    componente.form.basico = 100;
    componente.guardar();

    expect(componente.error()).toBe('La categoría 7 ya existe');
  });

  it('al borrar la única fila de una página retrocede a la anterior', async () => {
    const stub = crearStub();
    const fixture = await crear(stub);
    const componente = fixture.componentInstance;
    const confirmar = vi.fn(() => true);
    vi.stubGlobal('confirm', confirmar);

    componente.pagina.set(1);
    componente.filas.set([categoria(51, 'Única')]);
    stub.search.mockClear();

    componente.eliminar(categoria(51, 'Única'));

    expect(componente.pagina()).toBe(0);
    expect(stub.search).toHaveBeenCalledWith(expect.objectContaining({ pagina: 0 }));
    vi.unstubAllGlobals();
  });
});
