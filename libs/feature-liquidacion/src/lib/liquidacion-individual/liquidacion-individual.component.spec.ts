import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { AuthService, Persona } from '@haberes/shared-api';

import { LiquidacionIndividualComponent } from './liquidacion-individual.component';
import { FichaLiquidacionIndividual } from './liquidacion-individual.models';

describe('LiquidacionIndividualComponent', () => {
  let component: LiquidacionIndividualComponent;
  let httpMock: HttpTestingController;

  const persona: Persona = {
    legajoId: 1001,
    documento: 30111222,
    apellido: 'PEREZ',
    nombre: 'ANA'
  };

  const fichaBase = (): FichaLiquidacionIndividual => ({
    legajoId: 1001,
    anho: 2026,
    mes: 11,
    persona: {
      legajoId: 1001,
      documento: 30111222,
      apellido: 'PEREZ',
      nombre: 'ANA',
      estado: 1,
      liquida: 'S',
      dependenciaId: 7,
      salida: 'B'
    },
    control: { controlId: 88, anho: 2026, mes: 11, modoLiquidacionId: 1 },
    liquidacion: null,
    antiguedad: { mesesDocentes: 192, mesesAdministrativos: 0, mesesEtec: 6, indiceDocente: 1.85, indiceAdministrativo: 1 },
    cargosDocentes: [],
    cargosNoDocentes: [],
    cargosConClase: [],
    novedades: [],
    items: [],
    acciones: {
      puedeGenerarCargos: true,
      puedeLiquidar: true,
      puedeEliminarLiquidacion: false,
      puedeEditarNovedades: true,
      bloqueado: false,
      motivoBloqueo: null
    }
  });

  const fichaConItems = (): FichaLiquidacionIndividual => ({
    ...fichaBase(),
    liquidacion: {
      liquidacionId: 7,
      bloqueado: 0,
      estado: 1,
      liquida: 'S',
      totalRemunerativo: 1500,
      totalNoRemunerativo: 0,
      totalDeduccion: 300,
      totalNeto: 1200,
      fechaLiquidacion: null,
      fechaAcreditacion: null
    },
    items: [
      { itemId: 1, codigoId: 1, codigoNombre: 'ASIGNACION CARGO', importe: 1000 },
      { itemId: 2, codigoId: 985, codigoNombre: 'PRESENTISMO ETEC', importe: 200 },
      { itemId: 3, codigoId: 61, codigoNombre: 'JUBILACION', importe: 300 },
      { itemId: 4, codigoId: 96, codigoNombre: 'TOTAL REMUNERATIVO', importe: 1200 }
    ]
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { currentUser$: of({ legajoId: 999 }) } }
      ]
    });
    component = TestBed.createComponent(LiquidacionIndividualComponent).componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('se crea con el período actual y sin ficha', () => {
    expect(component).toBeTruthy();
    expect(component.hayFicha()).toBe(false);
  });

  it('al seleccionar un legajo carga la ficha del período', () => {
    component.seleccionarPersona(persona);

    const req = httpMock.expectOne('/api/haberes/core/liquidacion-individual/1001/2026/11');
    expect(req.request.method).toBe('GET');
    req.flush(fichaBase());

    expect(component.ficha()?.legajoId).toBe(1001);
    expect(component.acciones()?.puedeLiquidar).toBe(true);
    expect(component.legajoSolicitante()).toBe(999);
  });

  it('navega el período con wrap de año', () => {
    component.mes.set(1);
    component.anho.set(2026);

    component.cambiarMes(-1);

    expect(component.mes()).toBe(12);
    expect(component.anho()).toBe(2025);
  });

  it('formatea meses como años y meses', () => {
    expect(component.anosMeses(192)).toBe('16 años 0 meses');
    expect(component.anosMeses(13)).toBe('1 año 1 mes');
    expect(component.anosMeses(null)).toBe('—');
  });

  it('muestra las tres antigüedades etiquetadas', () => {
    component.seleccionarPersona(persona);
    httpMock.expectOne('/api/haberes/core/liquidacion-individual/1001/2026/11').flush(fichaBase());

    const texto = component.antiguedadTexto();
    expect(texto).toContain('Docente 16 años 0 meses');
    expect(texto).toContain('Administrativa 0 años 0 meses');
    expect(texto).toContain('ETEC 0 años 6 meses');
  });

  it('agrega una novedad S/N por el endpoint del slice', () => {
    component.seleccionarPersona(persona);
    httpMock.expectOne('/api/haberes/core/liquidacion-individual/1001/2026/11').flush(fichaBase());

    component.codigoSeleccionado.set({
      codigoId: 16,
      nombre: 'PRESENTISMO',
      docente: null,
      noDocente: null,
      search: ''
    });
    component.importeTexto.set('n');
    component.observaciones.set('sin presentismo');

    component.agregarNovedad();

    const req = httpMock.expectOne('/api/haberes/core/liquidacion-individual/1001/2026/11/novedad');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      codigoId: 16,
      importe: null,
      valor: 'N',
      observaciones: 'sin presentismo',
      forzar: false
    });
    req.flush({ resultado: 'GUARDADA', mensaje: 'Novedad guardada.', novedad: null });

    // El alta recarga la ficha.
    httpMock.expectOne('/api/haberes/core/liquidacion-individual/1001/2026/11').flush(fichaBase());
    expect(component.exito()).toBe('Novedad guardada.');
  });

  it('muestra el mensaje del backend cuando la liquidación está bloqueada', () => {
    component.seleccionarPersona(persona);
    httpMock.expectOne('/api/haberes/core/liquidacion-individual/1001/2026/11').flush(fichaBase());

    component.liquidar();

    const req = httpMock.expectOne('/api/haberes/core/liquidacion-individual/1001/2026/11/liquidar');
    req.flush({ resultado: 'BLOQUEADA', mensaje: 'La liquidación está bloqueada.' });

    httpMock.expectOne('/api/haberes/core/liquidacion-individual/1001/2026/11').flush(fichaBase());
    expect(component.error()).toBe('La liquidación está bloqueada.');
  });

  it('muestra el mensaje de éxito cuando liquida', () => {
    component.seleccionarPersona(persona);
    httpMock.expectOne('/api/haberes/core/liquidacion-individual/1001/2026/11').flush(fichaBase());

    component.liquidar();

    const req = httpMock.expectOne('/api/haberes/core/liquidacion-individual/1001/2026/11/liquidar');
    req.flush({ resultado: 'LIQUIDADO', mensaje: 'Liquidación generada correctamente.' });

    httpMock.expectOne('/api/haberes/core/liquidacion-individual/1001/2026/11').flush(fichaBase());
    expect(component.exito()).toBe('Liquidación generada correctamente.');
  });

  it('separa los conceptos por grupo y no muestra los totales como concepto', () => {
    component.seleccionarPersona(persona);
    httpMock.expectOne('/api/haberes/core/liquidacion-individual/1001/2026/11').flush(fichaConItems());
    httpMock.expectOne('/api/haberes/core/codigogrupo/').flush([
      { codigoId: 1, remunerativo: 1, noRemunerativo: 0, deduccion: 0, total: 0 },
      { codigoId: 985, remunerativo: 1, noRemunerativo: 0, deduccion: 0, total: 0 },
      { codigoId: 61, remunerativo: 0, noRemunerativo: 0, deduccion: 1, total: 0 },
      { codigoId: 96, remunerativo: 0, noRemunerativo: 0, deduccion: 0, total: 1 }
    ]);

    const grupos = component.itemsAgrupados();
    expect(grupos?.map((grupo) => grupo.clave)).toEqual(['remunerativo', 'deduccion']);
    expect(grupos?.[0].items.map((item) => item.codigoId)).toEqual([1, 985]);
    expect(grupos?.[0].total).toBe(1500);
    expect(grupos?.[1].items.map((item) => item.codigoId)).toEqual([61]);
    expect(grupos?.[1].total).toBe(300);
  });

  it('sin catálogo de grupos deja la tabla plana', () => {
    component.seleccionarPersona(persona);
    httpMock.expectOne('/api/haberes/core/liquidacion-individual/1001/2026/11').flush(fichaConItems());
    httpMock.expectOne('/api/haberes/core/codigogrupo/')
      .flush('error', { status: 500, statusText: 'Server Error' });

    expect(component.itemsAgrupados()).toBeNull();
  });

  it('refresca el catálogo de grupos al recargar la ficha', () => {
    component.seleccionarPersona(persona);
    httpMock.expectOne('/api/haberes/core/liquidacion-individual/1001/2026/11').flush(fichaConItems());
    httpMock.expectOne('/api/haberes/core/codigogrupo/').flush([]);

    component.cargarFicha();

    httpMock.expectOne('/api/haberes/core/liquidacion-individual/1001/2026/11').flush(fichaConItems());
    httpMock.expectOne('/api/haberes/core/codigogrupo/').flush([]);
  });
});
