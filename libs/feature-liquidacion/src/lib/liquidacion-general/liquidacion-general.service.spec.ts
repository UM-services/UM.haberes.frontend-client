import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { LiquidacionGeneralService } from './liquidacion-general.service';
import {
  InicioProcesoGeneralResponse,
  PadronLiquidacionGeneral,
  ProcesoGeneral,
  ResultadoLegajoGeneral
} from './liquidacion-general.models';

describe('LiquidacionGeneralService', () => {
  let service: LiquidacionGeneralService;
  let http: HttpTestingController;

  const padron: PadronLiquidacionGeneral = {
    anho: 2026,
    mes: 11,
    acciones: { hayControl: true, puedeGenerarCargos: true, puedeLiquidar: true, puedeEliminar: true },
    resumen: {
      total: 1, docentes: 1, noDocentes: 0, conNovedades: 0, liquidados: 0,
      bloqueados: 0, netoNegativo: 0, netoCero: 0, totalNeto: 0
    },
    filas: []
  };

  const proceso: ProcesoGeneral = {
    procesoId: 'p1',
    tipo: 'LIQUIDAR',
    anho: 2026,
    mes: 11,
    estado: 'EN_CURSO',
    total: 10,
    procesados: 2,
    progreso: 20,
    exitosos: 2,
    omitidos: 0,
    fallidos: 0,
    forzar: false,
    iniciadoPor: 99,
    iniciadoEn: '2026-11-16T10:00:00Z',
    finalizadoEn: null,
    mensaje: null
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LiquidacionGeneralService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(LiquidacionGeneralService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('padron pide GET al namespace de liquidación general', () => {
    let resultado: PadronLiquidacionGeneral | undefined;
    service.padron(2026, 11).subscribe((respuesta) => (resultado = respuesta));

    const req = http.expectOne('/api/haberes/core/liquidacion-general/2026/11');
    expect(req.request.method).toBe('GET');
    req.flush(padron);

    expect(resultado?.anho).toBe(2026);
  });

  it('liquidar envía forzar y el legajo solicitante', () => {
    let resultado: InicioProcesoGeneralResponse | undefined;
    service.liquidar(2026, 11, true, 99).subscribe((respuesta) => (resultado = respuesta));

    const req = http.expectOne('/api/haberes/core/liquidacion-general/2026/11/liquidar');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ forzar: true });
    expect(req.request.headers.get('X-Legajo-Solicitante')).toBe('99');
    req.flush({ iniciado: true, proceso, motivo: null, mensaje: null });

    expect(resultado?.iniciado).toBe(true);
  });

  it('generar cargos no envía forzar y tolera solicitante nulo', () => {
    service.generarCargos(2026, 11, null).subscribe();

    const req = http.expectOne('/api/haberes/core/liquidacion-general/2026/11/cargos');
    expect(req.request.body).toEqual({});
    expect(req.request.headers.has('X-Legajo-Solicitante')).toBe(false);
    req.flush({ iniciado: false, proceso: null, motivo: 'SIN_CONTROL', mensaje: 'sin control' });
  });

  it('proceso y detalle consultan el proceso persistido', () => {
    let procesoResultado: ProcesoGeneral | undefined;
    service.proceso('p1').subscribe((respuesta) => (procesoResultado = respuesta));
    http.expectOne('/api/haberes/core/liquidacion-general/proceso/p1').flush(proceso);
    expect(procesoResultado?.progreso).toBe(20);

    let detalleResultado: ResultadoLegajoGeneral[] | undefined;
    service.detalle('p1', 'OMITIDO').subscribe((respuesta) => (detalleResultado = respuesta));
    http.expectOne('/api/haberes/core/liquidacion-general/proceso/p1/detalle/OMITIDO').flush([
      {
        detalleId: 1, legajoId: 1001, apellido: 'PEREZ', nombre: 'ANA', resultado: 'OMITIDO',
        motivo: 'BLOQUEADA', detalle: 'bloqueada', totalNeto: null, registradoEn: '2026-11-16T10:00:00Z'
      }
    ]);
    expect(detalleResultado).toHaveLength(1);
  });

  it('descarga la salida del período como blob', () => {
    let blob: Blob | undefined;
    service.descargarSalida(2026, 11).subscribe((respuesta) => (blob = respuesta));

    const req = http.expectOne('/api/haberes/core/sheet/generateitems/2026/11');
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob(['xlsx']));

    expect(blob).toBeInstanceOf(Blob);
  });
});
