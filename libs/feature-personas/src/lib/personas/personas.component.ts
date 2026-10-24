import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { Persona, mensajeDeError } from '@haberes/shared-api';
import { PersonaSearchComponent } from '@haberes/ui-layout';
import {
  AntiguedadPeriodo,
  Contacto,
  Dependencia,
  LegajoBanco,
  PersonaPatch,
  PersonasService,
  fechaInput,
  fechaPayload,
} from './personas.service';

interface PersonaForm {
  legajoId: number;
  documento: number;
  apellido: string;
  nombre: string;
  nacimiento: string;
  altaDocente: string;
  ajusteDocente: number;
  altaAdministrativa: string;
  ajusteAdministrativo: number;
  estadoCivil: string;
  cuil: string;
  posgrado: number;
  estado: number;
  liquida: string;
  salida: string;
  dependenciaId: number | null;
  obraSocial: number;
  situacionAfip: number;
  localidadAfip: number;
  actividadAfip: number;
  modeloContratacionAfip: number;
  estadoAfip: number;
  reemplazoDesarraigo: boolean;
  mitadDesarraigo: boolean;
  directivoEtec: boolean;
}

interface ContactoForm {
  fijo: string;
  movil: string;
  mailPersonal: string;
  mailInstitucional: string;
}

@Component({
  selector: 'lib-personas',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, FormsModule, PersonaSearchComponent],
  templateUrl: './personas.component.html',
})
export class PersonasComponent implements OnInit {
  private readonly service = inject(PersonasService);

  readonly persona = signal<Persona | null>(null);
  readonly contacto = signal<Contacto | null>(null);
  readonly dependencias = signal<Dependencia[]>([]);
  readonly legajosBanco = signal<LegajoBanco[]>([]);
  readonly antiguedad = signal<AntiguedadPeriodo | null>(null);

  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly guardandoCbu = signal(false);
  readonly error = signal('');
  readonly mensaje = signal('');
  readonly personaSeleccionada = signal<Persona | null>(null);
  readonly mailInvalido = signal({ personal: false, institucional: false });

  readonly legajoBusqueda = signal('');
  readonly documentoBusqueda = signal('');

  readonly anhoActual = new Date().getFullYear();
  readonly mesActual = new Date().getMonth() + 1;
  readonly posgrados = ['Sin posgrado', 'Doctorado', 'Maestría', 'Especialización'];

  form: PersonaForm = this.formVacio();
  contactoForm: ContactoForm = this.contactoVacio();

  cbuForm = {
    legajoBancoId: null as number | null,
    anho: this.anhoActual,
    mes: this.mesActual,
    cbu: '',
    fijo: 0,
    porcentaje: 0,
    resto: false,
  };
  readonly cbuEsNuevo = signal(true);

  ngOnInit(): void {
    this.service.getDependencias().subscribe({
      next: (dependencias) => this.dependencias.set(dependencias),
      error: () => this.dependencias.set([]),
    });
  }

  seleccionarPersona(persona: Persona | null): void {
    if (!persona) return;
    this.cargar(persona.legajoId);
  }

  buscarPorLegajo(): void {
    const legajoId = Number(this.legajoBusqueda());
    if (!legajoId) return;
    if (this.persona()?.legajoId === legajoId) return;
    this.cargar(legajoId);
  }

  buscarPorDocumento(): void {
    const documento = Number(this.documentoBusqueda());
    if (!documento) return;
    if (Number(this.persona()?.documento ?? 0) === documento) return;

    this.limpiarMensajes();
    this.cargando.set(true);
    this.service.getPersonaPorDocumento(documento).subscribe({
      next: (persona) => {
        this.cargando.set(false);
        this.aplicarPersona(persona);
      },
      error: (err) => {
        this.cargando.set(false);
        this.persona.set(null);
        this.error.set(mensajeDeError(err, 'No se encontró una persona con ese documento'));
      },
    });
  }

  cargar(legajoId: number): void {
    this.limpiarMensajes();
    this.cargando.set(true);
    this.service.getPersona(legajoId).subscribe({
      next: (persona) => {
        this.cargando.set(false);
        this.aplicarPersona(persona);
      },
      error: (err) => {
        this.cargando.set(false);
        this.persona.set(null);
        this.personaSeleccionada.set(null);
        this.error.set(mensajeDeError(err, 'No se encontró el legajo indicado'));
      },
    });
  }

  guardar(): void {
    const actual = this.persona();
    if (!actual) return;

    this.limpiarMensajes();

    if (!this.form.apellido.trim()) {
      this.error.set('El apellido es obligatorio.');
      return;
    }
    if (!this.form.nombre.trim()) {
      this.error.set('El nombre es obligatorio.');
      return;
    }
    if (!this.form.dependenciaId) {
      this.error.set('Debe seleccionar una dependencia.');
      return;
    }

    const cuil = this.form.cuil.replace(/-/g, '').trim();
    if (cuil && cuil.length !== 11) {
      this.error.set('El CUIL debe tener 11 dígitos.');
      return;
    }
    if (this.mailInvalido().personal || this.mailInvalido().institucional) {
      this.error.set('Corrija los mails marcados como inválidos antes de guardar.');
      return;
    }

    const patchPersona = this.calcularPatchPersona();
    const patchContacto = this.calcularPatchContacto();
    const hayPersona = Object.keys(patchPersona).length > 0;
    const hayContacto = Object.keys(patchContacto).length > 0;

    if (!hayPersona && !hayContacto) {
      this.mensaje.set('No hay cambios para guardar.');
      return;
    }

    const fechasCambiadas = [
      'nacimiento',
      'altaDocente',
      'ajusteDocente',
      'altaAdministrativa',
      'ajusteAdministrativo',
    ].some((campo) => campo in patchPersona);

    this.guardando.set(true);
    const tareas: Observable<unknown>[] = [];
    if (hayPersona) tareas.push(this.service.patchPersona(actual.legajoId, patchPersona));
    if (hayContacto) {
      tareas.push(
        this.service.saveContacto(
          { legajoId: actual.legajoId, ...this.contactoForm },
          this.contacto() !== null,
        ),
      );
    }

    let pendientes = tareas.length;
    let fallo = false;
    for (const tarea of tareas) {
      tarea.subscribe({
        next: () => {
          pendientes -= 1;
          if (pendientes === 0 && !fallo) this.finalizarGuardado(actual.legajoId, fechasCambiadas);
        },
        error: (err) => {
          fallo = true;
          this.guardando.set(false);
          this.cargar(actual.legajoId);
          this.error.set(mensajeDeError(err, 'No se pudieron guardar los cambios'));
        },
      });
    }
  }

  descartar(): void {
    const actual = this.persona();
    if (!actual) return;
    this.cargar(actual.legajoId);
    this.mensaje.set('Cambios descartados.');
  }

  validarMail(campo: 'personal' | 'institucional'): void {
    const mail =
      campo === 'personal'
        ? this.contactoForm.mailPersonal.trim()
        : this.contactoForm.mailInstitucional.trim();

    if (!mail) {
      this.mailInvalido.update((estado) => ({ ...estado, [campo]: false }));
      return;
    }

    this.service.validarMail(mail).subscribe({
      next: (valido) => this.mailInvalido.update((estado) => ({ ...estado, [campo]: !valido })),
      error: () => this.mailInvalido.update((estado) => ({ ...estado, [campo]: true })),
    });
  }

  hayCambios(): boolean {
    if (!this.persona()) return false;
    return (
      Object.keys(this.calcularPatchPersona()).length > 0 ||
      Object.keys(this.calcularPatchContacto()).length > 0
    );
  }

  seleccionarCbu(fila: LegajoBanco): void {
    this.cbuForm = {
      legajoBancoId: fila.legajoBancoId,
      anho: fila.anho,
      mes: fila.mes,
      cbu: fila.cbu ?? '',
      fijo: Number(fila.fijo ?? 0),
      porcentaje: Number(fila.porcentaje ?? 0),
      resto: fila.resto === 1,
    };
    this.cbuEsNuevo.set(false);
  }

  nuevoCbu(): void {
    this.cbuForm = {
      legajoBancoId: null,
      anho: this.anhoActual,
      mes: this.mesActual,
      cbu: '',
      fijo: 0,
      porcentaje: 0,
      resto: false,
    };
    this.cbuEsNuevo.set(true);
  }

  guardarCbu(): void {
    const actual = this.persona();
    if (!actual) return;

    this.limpiarMensajes();
    const cbu = this.cbuForm.cbu.replace(/\s/g, '');

    if (cbu.length !== 22) {
      this.error.set('El CBU debe tener 22 dígitos.');
      return;
    }
    if (Number(this.cbuForm.fijo) > 0 && Number(this.cbuForm.porcentaje) > 0) {
      this.error.set('El importe fijo y el porcentaje son excluyentes.');
      return;
    }
    if (!this.cbuForm.anho || !this.cbuForm.mes) {
      this.error.set('Indique el período del CBU.');
      return;
    }

    const resto =
      this.cbuForm.resto ||
      (Number(this.cbuForm.fijo) === 0 && Number(this.cbuForm.porcentaje) === 0);

    const payload: LegajoBanco = {
      legajoBancoId: this.cbuForm.legajoBancoId,
      legajoId: actual.legajoId,
      anho: Number(this.cbuForm.anho),
      mes: Number(this.cbuForm.mes),
      cbu,
      fijo: Number(this.cbuForm.fijo ?? 0),
      porcentaje: Number(this.cbuForm.porcentaje ?? 0),
      resto: resto ? 1 : 0,
    };

    this.guardandoCbu.set(true);
    this.service.saveLegajoBanco(payload, this.cbuForm.legajoBancoId !== null).subscribe({
      next: () => {
        this.guardandoCbu.set(false);
        this.nuevoCbu();
        this.cargarCbu(actual.legajoId);
        this.mensaje.set('CBU guardado.');
      },
      error: (err) => {
        this.guardandoCbu.set(false);
        this.error.set(mensajeDeError(err, 'No se pudo guardar el CBU'));
      },
    });
  }

  aniosMeses(meses: number | null | undefined): string {
    const total = Number(meses ?? 0);
    return `${Math.floor(total / 12)}a ${total % 12}m`;
  }

  private aplicarPersona(persona: Persona): void {
    this.persona.set(persona);
    this.personaSeleccionada.set(persona);
    this.form = this.formDesde(persona);
    this.contactoForm = this.contactoVacio();
    this.mailInvalido.set({ personal: false, institucional: false });
    this.legajoBusqueda.set(String(persona.legajoId));
    this.documentoBusqueda.set(String(persona.documento ?? ''));
    this.cargarContacto(persona.legajoId);
    this.cargarCbu(persona.legajoId);
    this.cargarAntiguedad(persona.legajoId);
  }

  private cargarContacto(legajoId: number): void {
    this.service.getContacto(legajoId).subscribe((contacto) => {
      this.contacto.set(contacto);
      this.contactoForm = {
        fijo: contacto?.fijo ?? '',
        movil: contacto?.movil ?? '',
        mailPersonal: contacto?.mailPersonal ?? '',
        mailInstitucional: contacto?.mailInstitucional ?? '',
      };
    });
  }

  private cargarCbu(legajoId: number): void {
    this.service.getLegajosBanco(legajoId).subscribe({
      next: (filas) => {
        const ordenadas = [...filas].sort((a, b) => b.anho * 100 + b.mes - (a.anho * 100 + a.mes));
        this.legajosBanco.set(ordenadas);
      },
      error: () => this.legajosBanco.set([]),
    });
  }

  private cargarAntiguedad(legajoId: number): void {
    this.service.getAntiguedad(legajoId, this.anhoActual, this.mesActual).subscribe({
      next: (antiguedad) => this.antiguedad.set(antiguedad),
      error: () => this.antiguedad.set(null),
    });
  }

  private finalizarGuardado(legajoId: number, fechasCambiadas: boolean): void {
    this.guardando.set(false);
    this.cargar(legajoId);
    this.mensaje.set('Cambios guardados.');

    if (fechasCambiadas) {
      this.service
        .calcularAntiguedad(legajoId, this.anhoActual, this.mesActual)
        .subscribe(() => this.cargarAntiguedad(legajoId));
    }
  }

  private calcularPatchPersona(): PersonaPatch {
    const original = this.persona();
    if (!original) return {};

    const patch: PersonaPatch = {};
    const numero = (valor: unknown): number => Number(valor ?? 0);

    if (this.form.apellido.trim() !== (original.apellido ?? '')) {
      patch.apellido = this.form.apellido.trim();
    }
    if (this.form.nombre.trim() !== (original.nombre ?? '')) {
      patch.nombre = this.form.nombre.trim();
    }
    if (numero(this.form.documento) !== numero(original.documento)) {
      patch.documento = numero(this.form.documento);
    }

    const estadoCivil = this.form.estadoCivil.slice(0, 10);
    if (estadoCivil !== (original.estadoCivil ?? '')) patch.estadoCivil = estadoCivil;

    const cuil = this.form.cuil.replace(/-/g, '').trim();
    if (cuil !== (original.cuil ?? '')) patch.cuil = cuil;

    if (this.form.nacimiento && this.form.nacimiento !== fechaInput(original.nacimiento)) {
      patch.nacimiento = fechaPayload(original.nacimiento, this.form.nacimiento);
    }
    if (this.form.altaDocente && this.form.altaDocente !== fechaInput(original.altaDocente)) {
      patch.altaDocente = fechaPayload(original.altaDocente, this.form.altaDocente);
    }
    if (
      this.form.altaAdministrativa &&
      this.form.altaAdministrativa !== fechaInput(original.altaAdministrativa)
    ) {
      patch.altaAdministrativa = fechaPayload(
        original.altaAdministrativa,
        this.form.altaAdministrativa,
      );
    }

    if (numero(this.form.ajusteDocente) !== numero(original.ajusteDocente)) {
      patch.ajusteDocente = numero(this.form.ajusteDocente);
    }
    if (numero(this.form.ajusteAdministrativo) !== numero(original.ajusteAdministrativo)) {
      patch.ajusteAdministrativo = numero(this.form.ajusteAdministrativo);
    }
    if (numero(this.form.posgrado) !== numero(original.posgrado)) {
      patch.posgrado = numero(this.form.posgrado);
    }
    if (numero(this.form.estado) !== numero(original.estado)) {
      patch.estado = numero(this.form.estado);
    }
    if (this.form.liquida !== (original.liquida ?? '')) patch.liquida = this.form.liquida;
    if (this.form.salida !== (original.salida ?? '')) patch.salida = this.form.salida;

    if (numero(this.form.dependenciaId) !== numero(original.dependenciaId)) {
      patch.dependenciaId = numero(this.form.dependenciaId);
    }
    if (numero(this.form.obraSocial) !== numero(original.obraSocial)) {
      patch.obraSocial = numero(this.form.obraSocial);
    }
    if (numero(this.form.situacionAfip) !== numero(original.situacionAfip)) {
      patch.situacionAfip = numero(this.form.situacionAfip);
    }
    if (numero(this.form.localidadAfip) !== numero(original.localidadAfip)) {
      patch.localidadAfip = numero(this.form.localidadAfip);
    }
    if (numero(this.form.actividadAfip) !== numero(original.actividadAfip)) {
      patch.actividadAfip = numero(this.form.actividadAfip);
    }
    if (numero(this.form.modeloContratacionAfip) !== numero(original.modeloContratacionAfip)) {
      patch.modeloContratacionAfip = numero(this.form.modeloContratacionAfip);
    }
    if (numero(this.form.estadoAfip) !== numero(original.estadoAfip)) {
      patch.estadoAfip = numero(this.form.estadoAfip);
    }

    if (this.form.reemplazoDesarraigo !== (original.reemplazoDesarraigo === 1)) {
      patch.reemplazoDesarraigo = this.form.reemplazoDesarraigo ? 1 : 0;
    }
    if (this.form.mitadDesarraigo !== (original.mitadDesarraigo === 1)) {
      patch.mitadDesarraigo = this.form.mitadDesarraigo ? 1 : 0;
    }
    if (this.form.directivoEtec !== (original.directivoEtec === 1)) {
      patch.directivoEtec = this.form.directivoEtec ? 1 : 0;
    }

    return patch;
  }

  private calcularPatchContacto(): Partial<Contacto> {
    const original = this.contacto();
    const patch: Partial<Contacto> = {};

    if (this.contactoForm.fijo.trim() !== (original?.fijo ?? '')) {
      patch.fijo = this.contactoForm.fijo.trim();
    }
    if (this.contactoForm.movil.trim() !== (original?.movil ?? '')) {
      patch.movil = this.contactoForm.movil.trim();
    }
    if (this.contactoForm.mailPersonal.trim() !== (original?.mailPersonal ?? '')) {
      patch.mailPersonal = this.contactoForm.mailPersonal.trim();
    }
    if (this.contactoForm.mailInstitucional.trim() !== (original?.mailInstitucional ?? '')) {
      patch.mailInstitucional = this.contactoForm.mailInstitucional.trim();
    }

    return patch;
  }

  private formDesde(persona: Persona): PersonaForm {
    return {
      legajoId: persona.legajoId,
      documento: Number(persona.documento ?? 0),
      apellido: persona.apellido ?? '',
      nombre: persona.nombre ?? '',
      nacimiento: fechaInput(persona.nacimiento),
      altaDocente: fechaInput(persona.altaDocente),
      ajusteDocente: Number(persona.ajusteDocente ?? 0),
      altaAdministrativa: fechaInput(persona.altaAdministrativa),
      ajusteAdministrativo: Number(persona.ajusteAdministrativo ?? 0),
      estadoCivil: persona.estadoCivil ?? '',
      cuil: persona.cuil ?? '',
      posgrado: Number(persona.posgrado ?? 0),
      estado: Number(persona.estado ?? 0),
      liquida: persona.liquida ?? '',
      salida: persona.salida ?? '',
      dependenciaId: persona.dependenciaId ?? null,
      obraSocial: Number(persona.obraSocial ?? 0),
      situacionAfip: Number(persona.situacionAfip ?? 0),
      localidadAfip: Number(persona.localidadAfip ?? 0),
      actividadAfip: Number(persona.actividadAfip ?? 0),
      modeloContratacionAfip: Number(persona.modeloContratacionAfip ?? 0),
      estadoAfip: Number(persona.estadoAfip ?? 0),
      reemplazoDesarraigo: persona.reemplazoDesarraigo === 1,
      mitadDesarraigo: persona.mitadDesarraigo === 1,
      directivoEtec: persona.directivoEtec === 1,
    };
  }

  private formVacio(): PersonaForm {
    return {
      legajoId: 0,
      documento: 0,
      apellido: '',
      nombre: '',
      nacimiento: '',
      altaDocente: '',
      ajusteDocente: 0,
      altaAdministrativa: '',
      ajusteAdministrativo: 0,
      estadoCivil: '',
      cuil: '',
      posgrado: 0,
      estado: 0,
      liquida: '',
      salida: '',
      dependenciaId: null,
      obraSocial: 0,
      situacionAfip: 0,
      localidadAfip: 0,
      actividadAfip: 0,
      modeloContratacionAfip: 0,
      estadoAfip: 0,
      reemplazoDesarraigo: false,
      mitadDesarraigo: false,
      directivoEtec: false,
    };
  }

  private contactoVacio(): ContactoForm {
    return { fijo: '', movil: '', mailPersonal: '', mailInstitucional: '' };
  }

  private limpiarMensajes(): void {
    this.error.set('');
    this.mensaje.set('');
  }
}
