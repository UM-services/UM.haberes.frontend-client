import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { AuthService } from '@haberes/shared-api';

import { LiquidacionGeneralComponent } from './liquidacion-general.component';
import { PadronLiquidacionGeneral } from './liquidacion-general.models';

describe('LiquidacionGeneralComponent', () => {
  let component: LiquidacionGeneralComponent;
  let httpMock: HttpTestingController;

  const padronBase = (): PadronLiquidacionGeneral => ({
    anho: 2026,
    mes: 11,
    acciones: { hayControl: true, puedeGenerarCargos: true, puedeLiquidar: true, puedeEliminar: true },
    resumen: {
      total: 3, docentes: 2, noDocentes: 1, conNovedades: 1, liquidados: 1,
      bloqueados: 1, netoNegativo: 1, netoCero: 1, totalNeto: 1000
    },
    filas: [
      {
        orden: 1, legajoId: 1001, apellido: 'PEREZ', nombre: 'ANA', estado: 1, liquida: 'S',
        dependenciaId: 7, salida: 'B', esDocente: true, esNoDocente: false, tieneNovedades: true,
        liquidado: true, bloqueado: false, totalRemunerativo: 1500, totalNoRemunerativo: 0,
        totalDeduccion: 500, totalNeto: 1000
      },
      {
        orden: 2, legajoId: 1002, apellido: 'GOMEZ', nombre: 'LUIS', estado: 1, liquida: 'S',
        dependenciaId: 7, salida: 'B', esDocente: false, esNoDocente: true, tieneNovedades: false,
        liquidado: false, bloqueado: true, totalRemunerativo: 0, totalNoRemunerativo: 0,
        totalDeduccion: 0, totalNeto: -250
      },
      {
        orden: 3, legajoId: 1003, apellido: 'DIAZ', nombre: 'EVA', estado: 9, liquida: 'N',
        dependenciaId: 8, salida: 'B', esDocente: false, esNoDocente: false, tieneNovedades: false,
        liquidado: false, bloqueado: false, totalRemunerativo: 0, totalNoRemunerativo: 0,
        totalDeduccion: 0, totalNeto: 0
      }
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
    component = TestBed.createComponent(LiquidacionGeneralComponent).componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    httpMock.expectOne('/api/haberes/core/liquidacion-general/2026/11').flush(padronBase());
  });

  afterEach(() => httpMock.verify());

  it('carga el padrón del período al crear la pantalla', () => {
    expect(component.padron()?.resumen.total).toBe(3);
    expect(component.acciones()?.puedeLiquidar).toBe(true);
    expect(component.legajoSolicitante()).toBe(999);
  });

  it('filtra por texto, bloqueados y neto negativo', () => {
    component.filtroTexto.set('gomez');
    expect(component.filasFiltradas().map((fila) => fila.legajoId)).toEqual([1002]);

    component.filtroTexto.set('');
    component.soloBloqueados.set(true);
    expect(component.filasFiltradas().map((fila) => fila.legajoId)).toEqual([1002]);

    component.soloBloqueados.set(false);
    component.soloNegativos.set(true);
    expect(component.filasFiltradas().map((fila) => fila.legajoId)).toEqual([1002]);
  });

  it('informa cuando el proceso no se puede iniciar por falta de control', () => {
    component.generarCargos();

    const req = httpMock.expectOne('/api/haberes/core/liquidacion-general/2026/11/cargos');
    expect(req.request.method).toBe('POST');
    req.flush({ iniciado: false, proceso: null, motivo: 'SIN_CONTROL', mensaje: 'Faltan datos de control.' });

    expect(component.procesando()).toBe(false);
    expect(component.error()).toContain('control');
    expect(component.proceso()).toBeNull();
  });

  it('navega el período con wrap de año y recarga el padrón', () => {
    component.mes.set(1);
    component.anho.set(2026);

    component.cambiarMes(-1);
    httpMock.expectOne('/api/haberes/core/liquidacion-general/2025/12').flush(padronBase());

    expect(component.mes()).toBe(12);
    expect(component.anho()).toBe(2025);
  });
});
