import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { API_URL } from '@haberes/shared-api';

import { ControlPeriodoComponent } from './control-periodo.component';
import { ControlPeriodo, ModoLiquidacion, mesSiguiente } from './control-periodo.models';

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
      horaReferenciaEtec: 0,
      valorPuntoEtec: 0,
      modoLiquidacionId: 2,
    };
  }

  function urlPeriodo(anho = anhoInicial, mes = mesInicial): string {
    return `/api/haberes/core/control/periodo/${anho}/${mes}/opcional`;
  }

  function urlCopiar(anho = anhoInicial, mes = mesInicial): string {
    return `/api/haberes/core/control/copiar/${anho}/${mes}`;
  }

  function flushPeriodoNuevo(): void {
    http.expectOne('/api/haberes/core/modoLiquidacion/').flush(modos);
    http.expectOne(urlPeriodo()).flush(null);
  }

  function flushPeriodoExistente(control: ControlPeriodo = controlPeriodo()): void {
    http.expectOne('/api/haberes/core/modoLiquidacion/').flush(modos);
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
    http.expectOne(urlPeriodo()).flush(controlPeriodo());

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

    http.expectOne(urlPeriodo(anhoInicial + 1, mesInicial)).flush(null);
    http.expectNone('/api/haberes/core/control/');
    confirmar.mockRestore();
  });

  it('crea el período con POST cuando no existe', () => {
    flushPeriodoNuevo();
    completarFormulario();
    component.form.importes.valorPuntoEtec = 1234.56;

    component.guardar();
    const post = http.expectOne('/api/haberes/core/control/');
    expect(post.request.method).toBe('POST');
    expect(post.request.body.anho).toBe(anhoInicial);
    expect(post.request.body.mes).toBe(mesInicial);
    expect(post.request.body.fechaDesde).toBe(`${anhoInicial}-${mm}-01T00:00:00+0000`);
    expect(post.request.body.modoLiquidacionId).toBe(2);
    expect(post.request.body.valorPuntoEtec).toBe(1234.56);
    expect(post.request.body.controlId).toBeUndefined();
    post.flush(controlPeriodo());
    http.expectOne(urlPeriodo()).flush(controlPeriodo());

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
    http.expectOne(urlPeriodo()).flush(controlPeriodo());

    expect(component.mensaje()).toContain('Parámetros guardados');
  });
});
