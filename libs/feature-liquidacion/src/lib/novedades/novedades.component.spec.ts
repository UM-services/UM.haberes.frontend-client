import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { AuthService, Persona } from '@haberes/shared-api';

import { NovedadesComponent } from './novedades.component';
import { Novedad, NovedadPendiente } from './novedades.models';

describe('NovedadesComponent', () => {
  let fixture: ComponentFixture<NovedadesComponent>;
  let component: NovedadesComponent;
  let httpMock: HttpTestingController;

  const persona: Persona = {
    legajoId: 1001,
    documento: 30111222,
    apellido: 'PEREZ',
    nombre: 'ANA'
  };

  const codigo = {
    codigoId: 27,
    nombre: 'PRESENTISMO',
    docente: null,
    noDocente: null,
    search: 'PRESENTISMO'
  };

  const novedadBase = (): Novedad => ({
    novedadId: 77,
    legajoId: 1001,
    anho: 2026,
    mes: 11,
    codigoId: 27,
    dependenciaId: null,
    importe: 1500,
    value: null,
    observaciones: 'obs',
    importado: 0,
    novedadUploadId: null,
    persona,
    codigo: { codigoId: 27, nombre: 'PRESENTISMO' },
    dependencia: null
  });

  const pendiente = (legajoId: number, conPersona: boolean): NovedadPendiente => ({
    novedadUploadId: legajoId,
    legajoId,
    anho: 2026,
    mes: 11,
    codigoId: 27,
    dependenciaId: null,
    importe: 100,
    value: null,
    pendiente: 1,
    persona: conPersona ? { legajoId, apellido: 'GOMEZ', nombre: 'LUIS' } : null,
    codigo: { codigoId: 27, nombre: 'PRESENTISMO' },
    dependencia: null
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
    fixture = TestBed.createComponent(NovedadesComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    vi.restoreAllMocks();
  });

  const flushAcreditacion = (anho: number, mes: number, acreditado = 0): void => {
    httpMock.expectOne(`/api/haberes/core/acreditacion/periodo/${anho}/${mes}`)
      .flush({
        acreditacionId: 1,
        anho,
        mes,
        acreditado,
        limiteNovedades: null,
        fechaContable: null,
        ordenContable: null
      });
  };

  const abrirPeriodo = (anho = 2026, mes = 11): void => {
    component.anho.set(anho);
    component.mes.set(mes);
    component.ngOnInit();
    flushAcreditacion(anho, mes);
  };

  const elegirCodigo = (novedades: Novedad[] = []): void => {
    component.seleccionarCodigo(codigo);
    httpMock.expectOne(`/api/haberes/core/novedad/codigo/27/${component.anho()}/${component.mes()}`)
      .flush(novedades);
  };

  it('se crea sin código y con el período actual', () => {
    expect(component).toBeTruthy();
    expect(component.codigoSeleccionado()).toBeNull();
    expect(component.legajoSolicitante()).toBe(999);
  });

  it('al cambiar el período recarga acreditación y novedades', () => {
    abrirPeriodo(2026, 11);
    elegirCodigo();

    component.cambiarMes(1);

    expect(component.mes()).toBe(12);
    flushAcreditacion(2026, 12);
    httpMock.expectOne('/api/haberes/core/novedad/codigo/27/2026/12').flush([]);
  });

  it('con el período acreditado bloquea las escrituras y muestra el banner', () => {
    component.anho.set(2026);
    component.mes.set(11);
    fixture.detectChanges();
    flushAcreditacion(2026, 11, 1);
    component.seleccionarCodigo(codigo);
    httpMock.expectOne('/api/haberes/core/novedad/codigo/27/2026/11').flush([]);
    fixture.detectChanges();

    expect(component.periodoCerrado()).toBe(true);
    expect(component.puedeEscribir()).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('acreditado');
  });

  it('con la consulta de acreditación caída no habilita escrituras', () => {
    component.anho.set(2026);
    component.mes.set(11);
    component.ngOnInit();
    httpMock.expectOne('/api/haberes/core/acreditacion/periodo/2026/11')
      .flush({ message: 'sin servicio' }, { status: 500, statusText: 'Server Error' });

    expect(component.acreditacionError()).toBe(true);
    expect(component.puedeEscribir()).toBe(false);
  });

  it('da de alta cuando la clave única no existe', () => {
    abrirPeriodo();
    elegirCodigo();
    component.persona.set(persona);
    component.importeTexto.set('1500,50');
    component.observaciones.set('obs');

    component.agregarNovedad();

    httpMock.expectOne('/api/haberes/core/novedad/unique/1001/2026/11/27/null')
      .flush({ message: 'No existe' }, { status: 400, statusText: 'Bad Request' });

    const alta = httpMock.expectOne('/api/haberes/core/novedad/');
    expect(alta.request.method).toBe('POST');
    expect(alta.request.headers.get('X-Legajo-Solicitante')).toBe('999');
    expect(alta.request.body).toEqual({
      legajoId: 1001,
      anho: 2026,
      mes: 11,
      codigoId: 27,
      dependenciaId: null,
      importe: 1500.5,
      value: '',
      observaciones: 'obs',
      importado: 0,
      novedadUploadId: null
    });
    alta.flush(novedadBase(), { status: 201, statusText: 'Created' });

    httpMock.expectOne('/api/haberes/core/novedad/codigo/27/2026/11').flush([novedadBase()]);
    expect(component.exito()).toBe('Novedad agregada.');
  });

  it('actualiza la fila existente preservando importado y novedadUploadId', () => {
    const existente: Novedad = { ...novedadBase(), importado: 1, novedadUploadId: 55 };
    abrirPeriodo();
    elegirCodigo([existente]);
    component.persona.set(persona);
    component.importeTexto.set('200');

    component.agregarNovedad();

    httpMock.expectOne('/api/haberes/core/novedad/unique/1001/2026/11/27/null').flush(existente);

    const actualizacion = httpMock.expectOne('/api/haberes/core/novedad/77');
    expect(actualizacion.request.method).toBe('PUT');
    expect(actualizacion.request.body.importado).toBe(1);
    expect(actualizacion.request.body.novedadUploadId).toBe(55);
    expect(actualizacion.request.body.importe).toBe(200);
    actualizacion.flush(existente);

    httpMock.expectOne('/api/haberes/core/novedad/codigo/27/2026/11').flush([existente]);
    expect(component.exito()).toBe('Novedad actualizada.');
  });

  it('actualiza desde la grilla si la clave única no la encuentra (dependencia nula)', () => {
    const existente = novedadBase();
    abrirPeriodo();
    elegirCodigo([existente]);
    component.persona.set(persona);
    component.importeTexto.set('200');

    component.agregarNovedad();

    httpMock.expectOne('/api/haberes/core/novedad/unique/1001/2026/11/27/null')
      .flush({ message: 'No existe' }, { status: 400, statusText: 'Bad Request' });

    const actualizacion = httpMock.expectOne('/api/haberes/core/novedad/77');
    expect(actualizacion.request.method).toBe('PUT');
    expect(actualizacion.request.body.importe).toBe(200);
    actualizacion.flush(existente);

    httpMock.expectOne('/api/haberes/core/novedad/codigo/27/2026/11').flush([existente]);
  });

  it('interpreta S/N como importe 0 y un número como importe', () => {
    abrirPeriodo();
    elegirCodigo();
    component.persona.set(persona);

    component.importeTexto.set('S');
    component.agregarNovedad();
    httpMock.expectOne('/api/haberes/core/novedad/unique/1001/2026/11/27/null')
      .flush({ message: 'No existe' }, { status: 400, statusText: 'Bad Request' });
    const altaS = httpMock.expectOne('/api/haberes/core/novedad/');
    expect(altaS.request.body.importe).toBe(0);
    expect(altaS.request.body.value).toBe('S');
    altaS.flush(novedadBase(), { status: 201, statusText: 'Created' });
    httpMock.expectOne('/api/haberes/core/novedad/codigo/27/2026/11').flush([]);

    component.importeTexto.set('250,75');
    component.agregarNovedad();
    httpMock.expectOne('/api/haberes/core/novedad/unique/1001/2026/11/27/null')
      .flush({ message: 'No existe' }, { status: 400, statusText: 'Bad Request' });
    const altaNumero = httpMock.expectOne('/api/haberes/core/novedad/');
    expect(altaNumero.request.body.importe).toBe(250.75);
    expect(altaNumero.request.body.value).toBe('');
    altaNumero.flush(novedadBase(), { status: 201, statusText: 'Created' });
    httpMock.expectOne('/api/haberes/core/novedad/codigo/27/2026/11').flush([]);
  });

  it('sube la planilla con el paso a paso elegido', () => {
    abrirPeriodo();
    component.archivo.set(new File(['x'], 'novedades.xlsx'));
    component.stepByStep.set(true);

    component.enviarArchivo('AAA');

    const req = httpMock.expectOne('/api/haberes/core/novedadfile/upload/2026/11/true');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ filename: 'novedades.xlsx', base64: 'AAA' });
    req.flush('');

    httpMock.expectOne('/api/haberes/core/novedadupload/pendiente/2026/11/1').flush([]);
    expect(component.exito()).toBe('Planilla subida correctamente.');
  });

  it('muestra los avisos del upload y no declara éxito si falla', () => {
    abrirPeriodo();
    component.archivo.set(new File(['x'], 'novedades.xlsx'));

    component.enviarArchivo('AAA');
    httpMock.expectOne('/api/haberes/core/novedadfile/upload/2026/11/false')
      .flush('Legajo= 99 inexistente\nSheet= X SIN CodigoId');
    httpMock.expectOne('/api/haberes/core/novedadupload/pendiente/2026/11/1').flush([]);

    expect(component.avisos()).toEqual(['Legajo= 99 inexistente', 'Sheet= X SIN CodigoId']);
    expect(component.exito()).toContain('avisos');

    component.enviarArchivo('BBB');
    httpMock.expectOne('/api/haberes/core/novedadfile/upload/2026/11/false')
      .flush('Título no encontrado', { status: 400, statusText: 'Bad Request' });

    expect(component.error()).toBe('Título no encontrado');
    expect(component.exito()).toBeNull();
  });

  it('agrupa los legajos inexistentes de los pendientes', () => {
    abrirPeriodo();

    component.revisarPendientes();

    httpMock.expectOne('/api/haberes/core/novedadupload/pendiente/2026/11/1')
      .flush([pendiente(1001, true), pendiente(1002, false)]);

    expect(component.pendientes().length).toBe(2);
    expect(component.legajosInexistentes()).toEqual([1002]);
    expect(component.pendientesVisibles()).toBe(true);
  });

  it('informa clave duplicada cuando la importación responde 409', () => {
    abrirPeriodo();
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    component.importar();

    httpMock.expectOne('/api/haberes/core/novedadfile/import/2026/11')
      .flush({ message: 'Clave duplicada' }, { status: 409, statusText: 'Conflict' });

    expect(component.error()).toContain('clave única');
    expect(component.exito()).toBeNull();
  });

  it('desimporta todas las filas importado=1 del período', () => {
    abrirPeriodo();
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    component.desimportar();

    httpMock.expectOne('/api/haberes/core/novedad/importado/1/2026/11')
      .flush([novedadBase(), { ...novedadBase(), novedadId: 78, legajoId: 1002 }]);

    const primera = httpMock.expectOne('/api/haberes/core/novedad/77');
    expect(primera.request.method).toBe('DELETE');
    primera.flush(null, { status: 204, statusText: 'No Content' });
    expect(component.progreso()).toBe('1/2');

    const segunda = httpMock.expectOne('/api/haberes/core/novedad/78');
    expect(segunda.request.method).toBe('DELETE');
    segunda.flush(null, { status: 204, statusText: 'No Content' });

    httpMock.expectOne('/api/haberes/core/novedadupload/pendiente/2026/11/1').flush([]);
    expect(component.exito()).toContain('Se eliminaron 2');
  });

  it('elimina todo el período sólo con la confirmación MM/AAAA exacta', () => {
    abrirPeriodo();
    const prompt = vi.spyOn(window, 'prompt').mockReturnValue('11/2025');

    component.eliminarTodas();

    expect(prompt).toHaveBeenCalled();
    expect(component.error()).toContain('no se eliminó nada');

    prompt.mockReturnValue('11/2026');
    component.eliminarTodas();

    const req = httpMock.expectOne('/api/haberes/core/novedad/periodo/2026/11');
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    httpMock.expectOne('/api/haberes/core/novedadupload/pendiente/2026/11/1').flush([]);
    expect(component.exito()).toContain('11/2026');
  });

  it('transfiere las novedades del mes anterior e informa el resultado', () => {
    abrirPeriodo();
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    component.transferirAnterior();

    expect(component.transfiriendo()).toBe(true);
    expect(component.transferenciaOrigen()).toBe('10/2026');

    const req = httpMock.expectOne('/api/haberes/core/novedadfile/transfer/2026/11');
    expect(req.request.method).toBe('POST');
    req.flush({ nuevas: 3, actualizadas: 4, sinCambios: 2, total: 9 });

    expect(component.transfiriendo()).toBe(false);
    expect(component.procesando()).toBe(false);
    expect(component.exito()).toContain('Se transfirieron 7 novedades desde 10/2026');
    expect(component.exito()).toContain('3 nuevas, 4 actualizadas; 2 sin cambios');
  });

  it('avisa cuando la transferencia no tiene cambios', () => {
    abrirPeriodo();
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    component.transferirAnterior();

    httpMock.expectOne('/api/haberes/core/novedadfile/transfer/2026/11')
      .flush({ nuevas: 0, actualizadas: 0, sinCambios: 5, total: 5 });

    expect(component.exito()).toContain('Sin cambios: las 5 novedades de 10/2026 ya están transferidas.');
  });

  it('suma el importe de las novedades mostradas', () => {
    component.novedades.set([
      { ...novedadBase(), importe: 100 },
      { ...novedadBase(), novedadId: 78, importe: 50.5 },
      { ...novedadBase(), novedadId: 79, importe: null }
    ]);

    expect(component.total()).toBe(150.5);
  });

  it('al seleccionar una fila conserva el valor S/N y no cambia el código', () => {
    component.codigoSeleccionado.set(codigo);
    const novedad = { ...novedadBase(), value: 'S', importe: 0 };

    component.seleccionarNovedad(novedad);

    expect(component.novedadSeleccionada()?.novedadId).toBe(77);
    expect(component.importeTexto()).toBe('S');
    expect(component.observaciones()).toBe('obs');
    expect(component.persona()?.legajoId).toBe(1001);
    expect(component.codigoSeleccionado()?.codigoId).toBe(27);
  });
});
