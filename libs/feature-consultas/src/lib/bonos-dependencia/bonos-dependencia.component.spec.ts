import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AuthService } from '@haberes/shared-api';

import { BonosDependenciaComponent } from './bonos-dependencia.component';
import { BonosDependenciaData } from './bonos-dependencia.models';

describe('BonosDependenciaComponent', () => {
  let fixture: ComponentFixture<BonosDependenciaComponent>;
  let component: BonosDependenciaComponent;
  let http: HttpTestingController;

  const datos: BonosDependenciaData = {
    anho: 2026,
    mes: 9,
    dependenciaId: '4',
    salida: 'A',
    filas: [
      {
        legajoId: '120',
        apellidoNombre: 'Gómez, Ana',
        mailInstitucional: 'ana.gomez@um.edu.ar',
        bonoEnviado: false
      },
      {
        legajoId: '121',
        apellidoNombre: 'Pérez, Juan',
        mailInstitucional: 'juan.perez@um.edu.ar',
        bonoEnviado: true
      },
      {
        legajoId: '122',
        apellidoNombre: 'Sosa, Luis',
        mailInstitucional: '',
        bonoEnviado: false
      }
    ]
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { currentUser$: of({ legajoId: 999 }) } }
      ]
    });
    fixture = TestBed.createComponent(BonosDependenciaComponent);
    component = fixture.componentInstance;
    component.anho.set(2026);
    component.mes.set(9);
    component.dependenciaId.set(4);
    http = TestBed.inject(HttpTestingController);

    Object.defineProperty(window.URL, 'createObjectURL', { value: vi.fn(() => 'blob:mock'), writable: true });
    Object.defineProperty(window.URL, 'revokeObjectURL', { value: vi.fn(), writable: true });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  });

  afterEach(() => {
    fixture.destroy();
    // La detección de cambios anticipada dispara ngOnInit: se descarta el catálogo pendiente.
    http.match('/api/haberes/core/dependencia/').forEach((req) => req.flush([]));
    http.verify();
  });

  const cargarDatos = () => {
    component.verDatos();
    http
      .expectOne('/api/haberes/report/ui/bonoDependencia/data/2026/9/4/A')
      .flush(datos);
  };

  /** Deja correr el timer del polling (0 ms) antes de buscar la request de estado. */
  const esperarPoll = () => new Promise((resolve) => setTimeout(resolve, 10));

  const prepararLote = () => {
    component.imprimir();
    const prepare = http.expectOne(
      '/api/haberes/core/bono/dependencia/4/2026/9/A/print-prepare'
    );
    expect(prepare.request.method).toBe('POST');
    expect(prepare.request.headers.get('X-Legajo-Solicitante')).toBe('999');
    prepare.flush({ dependenciaId: 4, anho: 2026, mes: 9, salida: 'A', total: 3, preparados: 3, fallidos: [] });
    http
      .expectOne({ method: 'POST', url: '/api/haberes/report/ui/bonoDependencia/pdf/2026/9/4/A' })
      .flush({ jobId: 'job-1', estado: 'EN_PROCESO', procesados: 0, total: 3, mensaje: null, fallidos: [] });
  };

  const estadoJob = (estado: 'LISTO' | 'ERROR', extra: Record<string, unknown> = {}) => ({
    jobId: 'job-1',
    estado,
    procesados: 3,
    total: 3,
    mensaje: null,
    fallidos: [],
    ...extra
  });

  it('carga las dependencias al iniciar', () => {
    component.ngOnInit();
    http
      .expectOne('/api/haberes/core/dependencia/')
      .flush([{ dependenciaId: 4, nombre: 'Departamento de Física' }]);

    expect(component.dependencias()).toHaveLength(1);
  });

  it('no consulta sin dependencia seleccionada', () => {
    component.dependenciaId.set(null);

    component.verDatos();

    expect(component.habilitado()).toBe(false);
    expect(component.datos()).toBeNull();
  });

  it('consulta los legajos y marca los bonos ya enviados', () => {
    cargarDatos();

    expect(component.filas()).toHaveLength(3);
    expect(component.marcados().has('121')).toBe(true);
    expect(component.marcados().has('120')).toBe(false);
  });

  it('envía sólo los legajos sin marca y con mail institucional', () => {
    cargarDatos();

    expect(component.legajosAEnviar().map((f) => f.legajoId)).toEqual(['120']);
    expect(component.puedeEnviar()).toBe(true);
  });

  it('imprime preparando el lote en el core y generando el PDF en segundo plano', async () => {
    cargarDatos();

    prepararLote();
    await esperarPoll();
    http
      .expectOne('/api/haberes/report/ui/bonoDependencia/pdf/job/job-1')
      .flush(estadoJob('LISTO'));
    http
      .expectOne('/api/haberes/report/ui/bonoDependencia/pdf/job/job-1/file')
      .flush(new Blob(['pdf']));

    expect(component.imprimiendo()).toBe(false);
    expect(component.fallidos()).toEqual([]);
    expect(component.fallidosGeneracion()).toEqual([]);
  });

  it('informa el avance del job mientras genera el PDF', async () => {
    cargarDatos();

    prepararLote();
    await esperarPoll();
    http
      .expectOne('/api/haberes/report/ui/bonoDependencia/pdf/job/job-1')
      .flush({ jobId: 'job-1', estado: 'EN_PROCESO', procesados: 2, total: 3, mensaje: null, fallidos: [] });

    expect(component.progreso()).toEqual({ actual: 2, total: 3 });
    expect(component.imprimiendo()).toBe(true);
  });

  it('avisa los legajos que quedaron fuera del PDF generado', async () => {
    cargarDatos();

    prepararLote();
    await esperarPoll();
    http
      .expectOne('/api/haberes/report/ui/bonoDependencia/pdf/job/job-1')
      .flush(estadoJob('LISTO', { fallidos: [{ legajoId: '121', motivo: 'sin antigüedad' }] }));
    http
      .expectOne('/api/haberes/report/ui/bonoDependencia/pdf/job/job-1/file')
      .flush(new Blob(['pdf']));

    expect(component.fallidosGeneracion()).toEqual([
      { legajoId: 121, motivo: 'sin antigüedad' }
    ]);
  });

  it('muestra el error del job cuando la generación falla', async () => {
    cargarDatos();

    prepararLote();
    await esperarPoll();
    http
      .expectOne('/api/haberes/report/ui/bonoDependencia/pdf/job/job-1')
      .flush(estadoJob('ERROR', { mensaje: 'No hay liquidaciones para la dependencia 4 en 9/2026' }));

    expect(component.error()).toContain('No hay liquidaciones');
    expect(component.imprimiendo()).toBe(false);
    expect(component.progreso()).toBeNull();
  });

  it('si el lote tiene fallidos avisa y permite generar el PDF de todos modos', async () => {
    cargarDatos();

    component.imprimir();
    http.expectOne('/api/haberes/core/bono/dependencia/4/2026/9/A/print-prepare').flush({
      dependenciaId: 4,
      anho: 2026,
      mes: 9,
      salida: 'A',
      total: 3,
      preparados: 2,
      fallidos: [{ legajoId: 121, motivo: 'integridad fallida' }]
    });

    expect(component.fallidos()).toHaveLength(1);
    expect(component.imprimiendo()).toBe(false);

    component.descargarPdf();
    http
      .expectOne({ method: 'POST', url: '/api/haberes/report/ui/bonoDependencia/pdf/2026/9/4/A' })
      .flush({ jobId: 'job-1', estado: 'EN_PROCESO', procesados: 0, total: 3, mensaje: null, fallidos: [] });
    await esperarPoll();
    http
      .expectOne('/api/haberes/report/ui/bonoDependencia/pdf/job/job-1')
      .flush(estadoJob('LISTO'));
    http
      .expectOne('/api/haberes/report/ui/bonoDependencia/pdf/job/job-1/file')
      .flush(new Blob(['pdf']));
  });

  it('envía los bonos pendientes con progreso y resultado por legajo', () => {
    cargarDatos();

    component.enviar();

    const prepare = http.expectOne('/api/haberes/core/bono/120/2026/9/send-prepare');
    expect(prepare.request.method).toBe('POST');
    expect(prepare.request.body).toEqual({
      mailInstitucional: 'ana.gomez@um.edu.ar',
      legajoIdSolicitud: 999
    });
    prepare.flush({ bonoImpresionId: 1 });

    const send = http.expectOne('/api/haberes/report/ui/bonoDependencia/sendBono/120/2026/9');
    expect(send.request.responseType).toBe('text');
    send.flush('Envío de Correo Ok!!');

    // Al terminar refresca la grilla.
    http
      .expectOne('/api/haberes/report/ui/bonoDependencia/data/2026/9/4/A')
      .flush(datos);

    expect(component.resultados()).toHaveLength(1);
    expect(component.resultados()[0].ok).toBe(true);
    expect(component.enviando()).toBe(false);
  });

  it('registra el error de un legajo y sigue con el resto', () => {
    cargarDatos();

    component.enviar();
    http
      .expectOne('/api/haberes/core/bono/120/2026/9/send-prepare')
      .flush({ message: 'boom' }, { status: 500, statusText: 'Server Error' });

    http
      .expectOne('/api/haberes/report/ui/bonoDependencia/data/2026/9/4/A')
      .flush(datos);

    expect(component.resultados()).toHaveLength(1);
    expect(component.resultados()[0].ok).toBe(false);
    expect(component.enviando()).toBe(false);
  });
});
