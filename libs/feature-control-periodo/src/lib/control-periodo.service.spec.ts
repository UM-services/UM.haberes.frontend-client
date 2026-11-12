import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_URL } from '@haberes/shared-api';

import { ControlPeriodoService } from './control-periodo.service';
import { ControlPeriodo, ControlPeriodoRequest } from './control-periodo.models';

describe('ControlPeriodoService', () => {
  let service: ControlPeriodoService;
  let http: HttpTestingController;

  /** El payload de escritura no lleva `controlId` ni la relación embebida. */
  function comoRequest(periodo: ControlPeriodo): ControlPeriodoRequest {
    const copia: Partial<ControlPeriodo> = { ...periodo };
    delete copia.controlId;
    delete copia.modoLiquidacion;
    return copia as ControlPeriodoRequest;
  }

  const control: ControlPeriodo = {
    controlId: 12,
    anho: 2026,
    mes: 11,
    fechaDesde: '2026-11-01T00:00:00+0000',
    fechaHasta: '2026-11-30T00:00:00+0000',
    fechaPago: '2026-11-29T00:00:00+0000',
    fechaDeposito: '2026-11-28T00:00:00+0000',
    aporteJubilatorio: '11',
    depositoBanco: 'BROU',
    doctorado: 0,
    maestria: 0,
    especializacion: 0,
    familiaNumerosa: 0,
    escuelaPrimaria: 0,
    escuelaSecundaria: 0,
    escuelaPrimariaNumerosa: 0,
    escuelaSecundariaNumerosa: 0,
    prenatal: 0,
    libre: 0,
    ayudaEscolar: 0,
    matrimonio: 0,
    nacimiento: 0,
    funcionDireccion: 0,
    mayorResponsabilidadPatrimonial: 0,
    polimedb: 0,
    polimedo: 0,
    montoeci: 0,
    valampo: 0,
    jubilaem: 11,
    inssjpem: 3,
    osociaem: 3,
    jubilpat: 16.5,
    inssjpat: 2,
    osocipat: 6,
    ansalpat: 1.5,
    salfapat: 4.7,
    minimoAporte: 0,
    maximoAporte: 0,
    mincontr: 0,
    maximo1sijp: 1000000,
    maximo2sijp: 1000000,
    maximo3sijp: 1000000,
    maximo4sijp: 1000000,
    maximo5sijp: 1000000,
    estadoDocenteTitular: 0,
    estadoDocenteAdjunto: 0,
    estadoDocenteAuxiliar: 0,
    adicionalHoraCargoClase: 0,
    horaReferenciaEtec: 0,
    valorPuntoEtec: 0,
    modoLiquidacionId: 2,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: '/api/haberes' },
      ],
    });
    service = TestBed.inject(ControlPeriodoService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('consulta el período por el endpoint opcional y devuelve null si está vacío', () => {
    service.getPeriodo(2026, 11).subscribe((resultado) => expect(resultado).toBeNull());

    const req = http.expectOne('/api/haberes/core/control/periodo/2026/11/opcional');
    expect(req.request.method).toBe('GET');
    req.flush(null);
  });

  it('devuelve el período completo cuando existe', () => {
    let resultado: ControlPeriodo | null = null;
    service.getPeriodo(2026, 11).subscribe((periodo) => (resultado = periodo));

    http.expectOne('/api/haberes/core/control/periodo/2026/11/opcional').flush(control);

    expect(resultado).toEqual(control);
  });

  it('obtiene el catálogo de modos de liquidación', () => {
    service.getModos().subscribe();

    const req = http.expectOne('/api/haberes/core/modoLiquidacion/');
    expect(req.request.method).toBe('GET');
    req.flush([{ modoLiquidacionId: 2, descripcion: 'Sin fusión' }]);
  });

  it('crea y actualiza con el payload completo', () => {
    const request = comoRequest(control);

    service.crear(request).subscribe();
    const post = http.expectOne('/api/haberes/core/control/');
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual(request);
    post.flush(control);

    service.actualizar(request, 12).subscribe();
    const put = http.expectOne('/api/haberes/core/control/12');
    expect(put.request.method).toBe('PUT');
    expect(put.request.body).toEqual(request);
    put.flush(control);
  });

  it('copia el período anterior sin body', () => {
    service.copiarAnterior(2026, 11).subscribe();

    const req = http.expectOne('/api/haberes/core/control/copiar/2026/11');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBeNull();
    req.flush(control);
  });

  it('propaga el 409 del backend cuando el período ya tiene datos', () => {
    let estado: number | null = null;
    service.copiarAnterior(2026, 11).subscribe({
      error: (error) => (estado = error.status),
    });

    http
      .expectOne('/api/haberes/core/control/copiar/2026/11')
      .flush(
        { detail: 'Ya existen datos de control para 2026/11' },
        { status: 409, statusText: 'Conflict' },
      );

    expect(estado).toBe(409);
  });
});
