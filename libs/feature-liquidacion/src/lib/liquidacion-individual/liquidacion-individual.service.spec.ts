import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { LiquidacionIndividualService } from './liquidacion-individual.service';
import { FichaLiquidacionIndividual, ResultadoProcesoResponse } from './liquidacion-individual.models';

describe('LiquidacionIndividualService', () => {
  let service: LiquidacionIndividualService;
  let http: HttpTestingController;

  const ficha: FichaLiquidacionIndividual = {
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
    antiguedad: { mesesDocentes: 192, mesesAdministrativos: 0, indiceDocente: 1.85, indiceAdministrativo: 1 },
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
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LiquidacionIndividualService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(LiquidacionIndividualService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('ficha pide GET al namespace de liquidación individual', () => {
    let resultado: FichaLiquidacionIndividual | undefined;

    service.ficha(1001, 2026, 11).subscribe((r) => (resultado = r));

    const req = http.expectOne('/api/haberes/core/liquidacion-individual/1001/2026/11');
    expect(req.request.method).toBe('GET');
    req.flush(ficha);

    expect(resultado).toEqual(ficha);
  });

  it('las escrituras envían X-Legajo-Solicitante', () => {
    const respuesta: ResultadoProcesoResponse = { resultado: 'LIQUIDADO', mensaje: 'ok' };
    let resultado: ResultadoProcesoResponse | undefined;

    service.liquidar(1001, 2026, 11, false, 999).subscribe((r) => (resultado = r));

    const req = http.expectOne('/api/haberes/core/liquidacion-individual/1001/2026/11/liquidar');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ forzar: false });
    expect(req.request.headers.get('X-Legajo-Solicitante')).toBe('999');
    req.flush(respuesta);

    expect(resultado).toEqual(respuesta);
  });

  it('eliminar liquidación usa forzar en el path', () => {
    service.eliminarLiquidacion(1001, 2026, 11, true, 999).subscribe();

    const req = http.expectOne('/api/haberes/core/liquidacion-individual/1001/2026/11/true');
    expect(req.request.method).toBe('DELETE');
    expect(req.request.headers.get('X-Legajo-Solicitante')).toBe('999');
    req.flush({ resultado: 'ELIMINADA', mensaje: 'ok' });
  });

  it('registrar novedad envía el comando completo', () => {
    service.registrarNovedad(1001, 2026, 11, {
      codigoId: 16,
      importe: null,
      valor: 'N',
      observaciones: 'obs',
      forzar: false
    }, 999).subscribe();

    const req = http.expectOne('/api/haberes/core/liquidacion-individual/1001/2026/11/novedad');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      codigoId: 16,
      importe: null,
      valor: 'N',
      observaciones: 'obs',
      forzar: false
    });
    req.flush({ resultado: 'GUARDADA', mensaje: 'ok', novedad: null });
  });

  it('eliminar novedad usa novedadId y forzar en el path', () => {
    service.eliminarNovedad(1001, 2026, 11, 77, false, 999).subscribe();

    const req = http.expectOne('/api/haberes/core/liquidacion-individual/1001/2026/11/novedad/77/false');
    expect(req.request.method).toBe('DELETE');
    req.flush({ resultado: 'ELIMINADA', mensaje: 'ok' });
  });

  it('buscarCodigos codifica el término', () => {
    service.buscarCodigos('presentismo extra').subscribe();

    const req = http.expectOne('/api/haberes/core/codigo/search/presentismo%20extra');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });
});
