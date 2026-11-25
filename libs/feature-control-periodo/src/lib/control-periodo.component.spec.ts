import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { API_URL } from '@haberes/shared-api';

import { ControlPeriodoComponent } from './control-periodo.component';
import {
  ControlEtec,
  ControlPeriodo,
  ModoLiquidacion,
  mesSiguiente,
  tramoHoraVacio,
} from './control-periodo.models';

describe('ControlPeriodoComponent', () => {
  let fixture: ComponentFixture<ControlPeriodoComponent>;
  let component: ControlPeriodoComponent;
  let http: HttpTestingController;

  const hoy = new Date();
  const anhoInicial = hoy.getFullYear();
  const mesInicial = hoy.getMonth() + 1;
  const mm = String(mesInicial).padStart(2, '0');

  const modos: ModoLiquidacion[] = [
    { modoLiquidacionId: 2, descripcion: 'Sin fusión' },
    { modoLiquidacionId: 1, descripcion: 'Con fusión' },
  ];

  function controlPeriodo(): ControlPeriodo {
    return {
      controlId: 12,
      anho: anhoInicial,
      mes: mesInicial,
      fechaDesde: `${anhoInicial}-${mm}-01T00:00:00+0000`,
      fechaHasta: `${anhoInicial}-${mm}-28T00:00:00+0000`,
      fechaPago: `${anhoInicial}-${mm}-27T00:00:00+0000`,
      fechaDeposito: `${anhoInicial}-${mm}-26T00:00:00+0000`,
      aporteJubilatorio: '11',
      depositoBanco: 'BROU',
      doctorado: 120000,
      maestria: 90000,
      especializacion: 70000,
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
      modoLiquidacionId: 2,
    };
  }

  function urlPeriodo(anho = anhoInicial, mes = mesInicial): string {
    return `/api/haberes/core/control/periodo/${anho}/${mes}/opcional`;
  }

  function urlCopiar(anho = anhoInicial, mes = mesInicial): string {
    return `/api/haberes/core/control/copiar/${anho}/${mes}`;
  }

  function urlEtec(anho = anhoInicial, mes = mesInicial): string {
    return `/api/haberes/core/etec/control/${anho}/${mes}`;
  }

  function urlEtecOpcional(anho = anhoInicial, mes = mesInicial): string {
    return `${urlEtec(anho, mes)}/opcional`;
  }

  function urlEtecCopiar(anho = anhoInicial, mes = mesInicial): string {
    return `/api/haberes/core/etec/control/copiar/${anho}/${mes}`;
  }

  function urlEscala(): string {
    return '/api/haberes/core/etec/arraigo/escala';
  }

  function urlHora(anho = anhoInicial, mes = mesInicial): string {
    return `/api/haberes/core/etec/hora/escala/${anho}/${mes}`;
  }

  function urlCategorias(): string {
    return '/api/haberes/core/categoria/';
  }

  function flushPeriodoNuevo(): void {
    http.expectOne('/api/haberes/core/modoLiquidacion/').flush(modos);
    http.expectOne(urlEtecOpcional()).flush(null);
    http.expectOne(urlEscala()).flush([]);
    http.expectOne(urlHora()).flush([]);
    http.expectOne(urlCategorias()).flush([]);
    http.expectOne(urlPeriodo()).flush(null);
  }

  function flushPeriodoExistente(control: ControlPeriodo = controlPeriodo()): void {
    http.expectOne('/api/haberes/core/modoLiquidacion/').flush(modos);
    http.expectOne(urlEtecOpcional()).flush(null);
    http.expectOne(urlEscala()).flush([]);
    http.expectOne(urlHora()).flush([]);
    http.expectOne(urlCategorias()).flush([]);
    http.expectOne(urlPeriodo()).flush(control);
  }

  function flushRecarga(control: ControlPeriodo | null = controlPeriodo(),
                        etec: ControlEtec | null = null): void {
    http.expectOne(urlEtecOpcional()).flush(etec);
    http.expectOne(urlEscala()).flush([]);
    http.expectOne(urlHora()).flush([]);
    http.expectOne(urlCategorias()).flush([]);
    http.expectOne(urlPeriodo()).flush(control);
  }

  function completarFormulario(): void {
    component.form.modoLiquidacionId = 2;
    component.form.fechaDesde = `${anhoInicial}-${mm}-01`;
    component.form.fechaHasta = `${anhoInicial}-${mm}-28`;
    component.form.fechaPago = `${anhoInicial}-${mm}-27`;
    component.form.fechaDeposito = `${anhoInicial}-${mm}-26`;
    component.form.aporteJubilatorio = '11';
    component.form.depositoBanco = 'BROU';
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ControlPeriodoComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: '/api/haberes' },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ControlPeriodoComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('inicia en el período actual y deja el formulario vacío si no hay datos', () => {
    flushPeriodoNuevo();

    expect(component.anho()).toBe(anhoInicial);
    expect(component.mes()).toBe(mesInicial);
    expect(component.esNuevo()).toBe(true);
    expect(component.form.controlId).toBeNull();
    expect(component.form.modoLiquidacionId).toBeNull();
    expect(component.form.importes.doctorado).toBe(0);
    expect(component.modos().map((modo) => modo.descripcion)).toEqual(['Con fusión', 'Sin fusión']);
  });

  it('carga un período existente con sus valores', () => {
    flushPeriodoExistente();

    expect(component.esNuevo()).toBe(false);
    expect(component.form.controlId).toBe(12);
    expect(component.form.fechaDesde).toBe(`${anhoInicial}-${mm}-01`);
    expect(component.form.modoLiquidacionId).toBe(2);
    expect(component.form.importes.doctorado).toBe(120000);
    expect(component.avisoFechas()).toBe(false);
  });

  it('avisa al salir cuando el período tiene cambios sin guardar', () => {
    flushPeriodoExistente();
    expect(component.hayCambiosSinGuardar()).toBe(false);

    component.form.depositoBanco = 'OTRO';

    expect(component.hayCambiosSinGuardar()).toBe(true);
  });

  it('avisa cuando las fechas de liquidación no son del período', () => {
    flushPeriodoExistente({
      ...controlPeriodo(),
      fechaDesde: '2025-01-01T00:00:00+0000',
    });

    expect(component.avisoFechas()).toBe(true);
  });

  it('muestra las fechas como dd/MM/yyyy y los importes formateados', async () => {
    flushPeriodoExistente();
    await fixture.whenStable();
    fixture.detectChanges();

    const desde = fixture.nativeElement.querySelector('#control-fecha-desde') as HTMLInputElement;
    expect(desde.value).toBe(`01/${mm}/${anhoInicial}`);

    const doctorado = fixture.nativeElement.querySelector('#control-doctorado') as HTMLInputElement;
    expect(doctorado.value).toBe('120000');
    expect(doctorado.parentElement?.querySelector('p')?.textContent?.trim()).toBe('$ 120.000,00');
  });

  it('navega al mes siguiente sin confirmar si no hay cambios', () => {
    flushPeriodoNuevo();
    const confirmar = vi.spyOn(window, 'confirm');
    const siguiente = mesSiguiente(anhoInicial, mesInicial);

    component.irSiguiente();
    http.expectOne(urlEtecOpcional(siguiente.anho, siguiente.mes)).flush(null);
    http.expectOne(urlEscala()).flush([]);
    http.expectOne(urlHora(siguiente.anho, siguiente.mes)).flush([]);
    http.expectOne(urlCategorias()).flush([]);
    http.expectOne(urlPeriodo(siguiente.anho, siguiente.mes)).flush(null);

    expect(confirmar).not.toHaveBeenCalled();
    expect(component.anho()).toBe(siguiente.anho);
    expect(component.mes()).toBe(siguiente.mes);
    confirmar.mockRestore();
  });

  it('no cambia de período si se cancelan los cambios sin guardar', () => {
    flushPeriodoExistente();
    component.form.aporteJubilatorio = '99';
    const confirmar = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const siguiente = mesSiguiente(anhoInicial, mesInicial);

    component.irSiguiente();

    expect(confirmar).toHaveBeenCalled();
    http.expectNone(urlPeriodo(siguiente.anho, siguiente.mes));
    expect(component.anho()).toBe(anhoInicial);
    expect(component.mes()).toBe(mesInicial);
    confirmar.mockRestore();
  });

  it('copia el período anterior y recarga los parámetros creados', () => {
    flushPeriodoNuevo();
    const confirmar = vi.spyOn(window, 'confirm').mockReturnValue(true);

    component.copiarAnterior();
    const post = http.expectOne(urlCopiar());
    expect(post.request.method).toBe('POST');
    post.flush(controlPeriodo());
    const etecPost = http.expectOne(urlEtecCopiar());
    expect(etecPost.request.method).toBe('POST');
    etecPost.flush(null);
    flushRecarga();

    expect(component.esNuevo()).toBe(false);
    expect(component.form.controlId).toBe(12);
    expect(component.mensaje()).toContain('Parámetros copiados');
    confirmar.mockRestore();
  });

  it('no ofrece copiar si el período ya tiene datos', () => {
    flushPeriodoExistente();
    const confirmar = vi.spyOn(window, 'confirm');

    component.copiarAnterior();

    expect(confirmar).not.toHaveBeenCalled();
    http.expectNone(urlCopiar());
    confirmar.mockRestore();
  });

  it('muestra el mensaje del backend cuando la copia devuelve 409', () => {
    flushPeriodoNuevo();
    const confirmar = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const detalle = 'Ya existen datos de control para 2026/11';

    component.copiarAnterior();
    http.expectOne(urlCopiar()).flush({ detail: detalle }, { status: 409, statusText: 'Conflict' });

    expect(component.error()).toBe(detalle);
    expect(component.copiando()).toBe(false);
    confirmar.mockRestore();
  });

  it('valida modo, fechas, orden de fechas e importes antes de guardar', () => {
    flushPeriodoNuevo();

    component.guardar();
    expect(component.error()).toContain('modo de liquidación');

    component.form.modoLiquidacionId = 2;
    component.guardar();
    expect(component.error()).toContain('fechas');

    completarFormulario();
    component.form.fechaDesde = `${anhoInicial}-${mm}-28`;
    component.form.fechaHasta = `${anhoInicial}-${mm}-01`;
    component.guardar();
    expect(component.error()).toContain('posterior');

    completarFormulario();
    component.form.importes.valampo = -1;
    component.guardar();
    expect(component.error()).toContain('negativos');
    expect(component.importeNegativo('valampo')).toBe(true);

    http.expectNone('/api/haberes/core/control/');
  });

  it('no guarda si el año escrito no corresponde al período cargado', () => {
    flushPeriodoNuevo();
    completarFormulario();
    component.anho.set(anhoInicial + 1);
    const confirmar = vi.spyOn(window, 'confirm').mockReturnValue(true);

    component.guardar();

    http.expectOne(urlEtecOpcional(anhoInicial + 1, mesInicial)).flush(null);
    http.expectOne(urlEscala()).flush([]);
    http.expectOne(urlHora(anhoInicial + 1, mesInicial)).flush([]);
    http.expectOne(urlCategorias()).flush([]);
    http.expectOne(urlPeriodo(anhoInicial + 1, mesInicial)).flush(null);
    http.expectNone('/api/haberes/core/control/');
    confirmar.mockRestore();
  });

  it('crea el período con POST cuando no existe', () => {
    flushPeriodoNuevo();
    completarFormulario();
    component.etecForm.valorPuntoEtec = 311.3633;

    component.guardar();
    const post = http.expectOne('/api/haberes/core/control/');
    expect(post.request.method).toBe('POST');
    expect(post.request.body.anho).toBe(anhoInicial);
    expect(post.request.body.mes).toBe(mesInicial);
    expect(post.request.body.fechaDesde).toBe(`${anhoInicial}-${mm}-01T00:00:00+0000`);
    expect(post.request.body.modoLiquidacionId).toBe(2);
    expect(post.request.body.controlId).toBeUndefined();
    post.flush(controlPeriodo());
    const etecPost = http.expectOne(urlEtec());
    expect(etecPost.request.method).toBe('POST');
    expect(etecPost.request.body.valorPuntoEtec).toBe(311.3633);
    etecPost.flush(null);
    flushRecarga();

    expect(component.mensaje()).toContain('Parámetros guardados');
  });

  it('actualiza con PUT y conserva el offset original de las fechas', () => {
    flushPeriodoExistente();
    component.form.aporteJubilatorio = '12';
    component.form.fechaHasta = `${anhoInicial}-${mm}-29`;

    component.guardar();
    const put = http.expectOne('/api/haberes/core/control/12');
    expect(put.request.method).toBe('PUT');
    expect(put.request.body.aporteJubilatorio).toBe('12');
    expect(put.request.body.fechaHasta).toBe(`${anhoInicial}-${mm}-29T00:00:00+0000`);
    put.flush(controlPeriodo());
    const etecPost = http.expectOne(urlEtec());
    etecPost.flush(null);
    flushRecarga();

    expect(component.mensaje()).toContain('Parámetros guardados');
  });

  it('carga y guarda la escala de arraigo', () => {
    http.expectOne('/api/haberes/core/modoLiquidacion/').flush(modos);
    http.expectOne(urlEtecOpcional()).flush(null);
    http.expectOne(urlEscala()).flush([
      { escalaArraigoEtecId: 1, aniosMinimos: 2, porcentaje: 20 },
      { escalaArraigoEtecId: 2, aniosMinimos: 10, porcentaje: 60 },
    ]);
    http.expectOne(urlHora()).flush([]);
    http.expectOne(urlCategorias()).flush([]);
    http.expectOne(urlPeriodo()).flush(null);

    expect(component.escalaArraigo().length).toBe(2);

    component.escalaArraigo.set([{ escalaArraigoEtecId: null, aniosMinimos: 3, porcentaje: 25 }]);
    component.guardarEscalaArraigo();
    const put = http.expectOne(urlEscala());
    expect(put.request.method).toBe('PUT');
    expect(put.request.body).toEqual([{ aniosMinimos: 3, porcentaje: 25 }]);
    put.flush([{ escalaArraigoEtecId: 7, aniosMinimos: 3, porcentaje: 25 }]);

    expect(component.escalaArraigo().length).toBe(1);
    expect(component.mensaje()).toContain('Escala de arraigo guardada');
  });

  it('no envía la escala si hay antigüedades repetidas o años inválidos', () => {
    flushPeriodoNuevo();
    component.escalaArraigo.set([
      { escalaArraigoEtecId: null, aniosMinimos: 2, porcentaje: 20 },
      { escalaArraigoEtecId: null, aniosMinimos: 2, porcentaje: 30 },
    ]);

    component.guardarEscalaArraigo();

    http.expectNone(urlEscala());
    expect(component.error()).toContain('repetida');
  });

  it('carga y guarda la escala de horas del período', () => {
    http.expectOne('/api/haberes/core/modoLiquidacion/').flush(modos);
    http.expectOne(urlEtecOpcional()).flush({
      controlEtecId: 5,
      anho: anhoInicial,
      mes: mesInicial,
      valorPuntoEtec: 311.3633,
      montoFijoCargo: 0,
      horasReferenciaCargo: 18,
      basicoMaestroGrado: 750000,
      porcentajePresentismo: 20,
      porcentajeAdicionalCarrera: 10,
      garantia: 0,
      horasAdicionalCargaHoraria: 0,
      valorHoraAdicionalCargaHoraria: 0,
    });
    http.expectOne(urlEscala()).flush([]);
    http.expectOne(urlHora()).flush([
      {
        escalaHoraEtecId: 1,
        controlEtecId: 5,
        categoriaId: 2002,
        horasDesde: 0,
        horasHasta: 6,
        montoFijo: 100000,
        valorHora: 5000,
      },
    ]);
    http.expectOne(urlCategorias()).flush([
      { categoriaId: 2002, nombre: 'DOCENTE ETEC HORAS', etecHoras: 1 },
    ]);
    http.expectOne(urlPeriodo()).flush(null);

    expect(component.escalaHora().length).toBe(1);
    expect(component.importeHora(component.escalaHora()[0])).toBe('130.000,00');

    component.agregarTramoHora();
    expect(component.escalaHora()[1].horasDesde).toBe(6);

    component.escalaHora.set([
      {
        ...tramoHoraVacio(),
        categoriaId: 2002,
        horasDesde: 0,
        horasHasta: 6,
        montoFijo: 100000,
        valorHora: 5000,
      },
    ]);
    component.guardarEscalaHora();
    const put = http.expectOne(urlHora());
    expect(put.request.method).toBe('PUT');
    expect(put.request.body).toEqual([
      { categoriaId: 2002, horasDesde: 0, horasHasta: 6, montoFijo: 100000, valorHora: 5000 },
    ]);
    put.flush([
      {
        escalaHoraEtecId: 9,
        controlEtecId: 5,
        categoriaId: 2002,
        horasDesde: 0,
        horasHasta: 6,
        montoFijo: 100000,
        valorHora: 5000,
      },
    ]);

    expect(component.escalaHora()[0].escalaHoraEtecId).toBe(9);
    expect(component.mensaje()).toContain('Escala de horas guardada');
  });

  it('no envía la escala de horas si los tramos se superponen', () => {
    flushPeriodoNuevo();
    component.escalaHora.set([
      { ...tramoHoraVacio(), categoriaId: 2002, horasDesde: 0, horasHasta: 9 },
      { ...tramoHoraVacio(), categoriaId: 2002, horasDesde: 6, horasHasta: 12 },
    ]);

    component.guardarEscalaHora();

    http.expectNone(urlHora());
    expect(component.error()).toContain('superponen');
  });

  it('no envía la escala de horas si falta el control ETEC del período', () => {
    flushPeriodoNuevo();
    component.escalaHora.set([
      { ...tramoHoraVacio(), categoriaId: 2002, horasDesde: 0, horasHasta: 6 },
    ]);

    component.guardarEscalaHora();

    http.expectNone(urlHora());
    expect(component.error()).toContain('parámetros ETEC');
  });
});
