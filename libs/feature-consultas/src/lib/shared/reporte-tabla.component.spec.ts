import { TestBed } from '@angular/core/testing';

import { ColumnaTabla, ReporteTablaComponent, SeccionTabla } from './reporte-tabla.component';

interface FilaPrueba {
  codigo: string;
  importe: string;
}

describe('ReporteTablaComponent', () => {
  const columnas: ColumnaTabla<FilaPrueba>[] = [
    { titulo: 'Código', valor: (fila) => fila.codigo },
    { titulo: 'Importe', valor: (fila) => fila.importe, tipo: 'importe', alineacion: 'der' }
  ];
  const secciones: SeccionTabla<FilaPrueba>[] = [
    {
      titulo: 'Remunerativo',
      filas: [{ codigo: '100', importe: '1.234,50' }],
      subtotal: '1.234,50'
    }
  ];

  function crear(seccionesTabla: SeccionTabla<FilaPrueba>[]) {
    const fixture = TestBed.createComponent(ReporteTablaComponent<FilaPrueba>);
    const component = fixture.componentInstance;
    component.titulo = 'Totales Generales';
    component.subtitulo = '9/2026';
    component.columnas = columnas;
    component.secciones = seccionesTabla;
    fixture.detectChanges();
    return { fixture, component };
  }

  it('renderiza secciones, filas y subtotal', () => {
    const { fixture } = crear(secciones);

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Remunerativo');
    expect(texto).toContain('100');
    expect(texto).toContain('1.234,50');
    expect(texto).toContain('Subtotal Remunerativo');
  });

  it('muestra el estado vacío cuando no hay filas', () => {
    const { fixture } = crear([]);

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Sin datos para el período.');
    expect(texto).not.toContain('Subtotal');
  });

  it('muestra el estado de carga antes que los datos', () => {
    const fixture = TestBed.createComponent(ReporteTablaComponent<FilaPrueba>);
    fixture.componentInstance.columnas = columnas;
    fixture.componentInstance.secciones = secciones;
    fixture.componentInstance.cargando = true;
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Consultando datos del período');
    expect(texto).not.toContain('Subtotal');
  });
});
