import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { mensajeDeError } from '@haberes/shared-api';
import { AfipConcepto, Codigo, CodigoGrupo, CodigosService } from './codigos.service';

type GrupoTipo = '' | 'remunerativo' | 'noRemunerativo' | 'deduccion';

interface CodigoForm {
  codigoId: number;
  nombre: string;
  docente: boolean;
  noDocente: boolean;
  transferible: boolean;
  incluidoEtec: boolean;
  afipPrimero: number | null;
  afipSegundo: number | null;
  grupo: GrupoTipo;
}

@Component({
  selector: 'lib-codigos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, FormsModule],
  templateUrl: './codigos.component.html',
})
export class CodigosComponent implements OnInit {
  private readonly service = inject(CodigosService);

  readonly codigos = signal<Codigo[]>([]);
  readonly grupos = signal<Record<number, CodigoGrupo>>({});
  readonly grupoActual = signal<CodigoGrupo | null>(null);
  readonly descripciones = signal<Record<number, string>>({});
  readonly resultados = signal<AfipConcepto[]>([]);

  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly buscando = signal(false);
  readonly error = signal('');
  readonly mensaje = signal('');
  readonly esNuevo = signal(true);
  readonly busqueda = signal('');

  form: CodigoForm = this.formVacio();

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    forkJoin({
      codigos: this.service.getCodigos(),
      grupos: this.service.getGrupos(),
    }).subscribe({
      next: ({ codigos, grupos }) => {
        const mapa: Record<number, CodigoGrupo> = {};
        for (const grupo of grupos) mapa[grupo.codigoId] = grupo;

        this.codigos.set(codigos);
        this.grupos.set(mapa);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(mensajeDeError(err, 'No se pudieron cargar los códigos'));
        this.cargando.set(false);
      },
    });
  }

  nuevo(): void {
    this.limpiar();
    this.service.getLast().subscribe({
      next: (ultimo) => {
        this.form = { ...this.formVacio(), codigoId: (ultimo?.codigoId ?? 0) + 1 };
        this.esNuevo.set(true);
      },
      error: () => {
        this.form = { ...this.formVacio(), codigoId: 1 };
        this.esNuevo.set(true);
      },
    });
  }

  seleccionar(codigo: Codigo): void {
    this.limpiarMensajes();
    this.resultados.set([]);
    this.busqueda.set('');
    this.form = {
      codigoId: codigo.codigoId,
      nombre: codigo.nombre ?? '',
      docente: codigo.docente === 1,
      noDocente: codigo.noDocente === 1,
      transferible: codigo.transferible === 1,
      incluidoEtec: codigo.incluidoEtec === 1,
      afipPrimero: codigo.afipConceptoSueldoIdPrimerSemestre ?? null,
      afipSegundo: codigo.afipConceptoSueldoIdSegundoSemestre ?? null,
      grupo: '',
    };
    this.esNuevo.set(false);
    this.grupoActual.set(null);

    this.service.getGrupo(codigo.codigoId).subscribe((grupo) => {
      if (!grupo) return;
      this.grupoActual.set(grupo);
      this.form.grupo = this.tipoGrupo(grupo);
      this.grupos.update((mapa) => ({ ...mapa, [grupo.codigoId]: grupo }));
    });

    this.cargarDescripciones([this.form.afipPrimero, this.form.afipSegundo]);
  }

  limpiar(): void {
    this.limpiarMensajes();
    this.esNuevo.set(true);
    this.grupoActual.set(null);
    this.resultados.set([]);
    this.busqueda.set('');
    this.form = this.formVacio();
  }

  guardar(): void {
    this.limpiarMensajes();

    if (!this.form.nombre.trim()) {
      this.error.set('El nombre del código es obligatorio.');
      return;
    }

    // Regla heredada: si solo hay concepto de 1er semestre, se replica al 2do.
    const primero = this.form.afipPrimero;
    const segundo = primero && !this.form.afipSegundo ? primero : this.form.afipSegundo;

    const payload: Codigo = {
      codigoId: this.form.codigoId,
      nombre: this.form.nombre.trim(),
      docente: this.form.docente ? 1 : 0,
      noDocente: this.form.noDocente ? 1 : 0,
      transferible: this.form.transferible ? 1 : 0,
      incluidoEtec: this.form.incluidoEtec ? 1 : 0,
      afipConceptoSueldoIdPrimerSemestre: primero,
      afipConceptoSueldoIdSegundoSemestre: segundo,
    };

    const grupo: CodigoGrupo = {
      codigoId: this.form.codigoId,
      remunerativo: this.form.grupo === 'remunerativo' ? 1 : 0,
      noRemunerativo: this.form.grupo === 'noRemunerativo' ? 1 : 0,
      deduccion: this.form.grupo === 'deduccion' ? 1 : 0,
      total: this.grupoActual()?.total ?? 0,
    };

    const request$ = this.esNuevo() ? this.service.create(payload) : this.service.update(payload);

    this.guardando.set(true);
    request$.subscribe({
      next: (guardado) => {
        this.service
          .saveGrupo({ ...grupo, codigoId: guardado.codigoId }, !!this.grupoActual())
          .subscribe({
            next: (grupoGuardado) => {
              this.guardando.set(false);
              this.grupoActual.set(grupoGuardado);
              this.form.afipSegundo = segundo;
              this.esNuevo.set(false);
              this.seleccionar({ ...guardado, afipConceptoSueldoIdSegundoSemestre: segundo });
              this.mensaje.set('Código guardado correctamente.');
              this.cargar();
            },
            error: (err) => {
              this.guardando.set(false);
              this.error.set(mensajeDeError(err, 'El código se guardó, pero no su grupo contable'));
              this.cargar();
            },
          });
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(mensajeDeError(err, 'No se pudo guardar el código'));
      },
    });
  }

  buscarAfip(): void {
    const termino = this.busqueda().trim();
    if (!termino) {
      this.resultados.set([]);
      return;
    }

    this.buscando.set(true);
    this.service.searchAfip(termino.split(/\s+/)).subscribe({
      next: (conceptos) => {
        this.resultados.set(conceptos);
        this.buscando.set(false);
      },
      error: (err) => {
        this.buscando.set(false);
        this.error.set(mensajeDeError(err, 'No se pudieron buscar los conceptos AFIP'));
      },
    });
  }

  asignarAfip(concepto: AfipConcepto, semestre: 1 | 2): void {
    if (semestre === 1) {
      this.form.afipPrimero = concepto.afipConceptoSueldoId;
    } else {
      this.form.afipSegundo = concepto.afipConceptoSueldoId;
    }
    this.descripciones.update((mapa) => ({
      ...mapa,
      [concepto.afipConceptoSueldoId]: concepto.descripcion,
    }));
  }

  desasignarAfip(semestre: 1 | 2): void {
    if (semestre === 1) {
      this.form.afipPrimero = null;
    } else {
      this.form.afipSegundo = null;
    }
  }

  descripcionAfip(afipConceptoSueldoId: number | null): string {
    if (!afipConceptoSueldoId) return 'Sin asignar';
    return this.descripciones()[afipConceptoSueldoId] ?? `#${afipConceptoSueldoId}`;
  }

  grupoDe(codigoId: number): CodigoGrupo | null {
    return this.grupos()[codigoId] ?? null;
  }

  marca(valor: number | null | undefined): boolean {
    return valor === 1;
  }

  private cargarDescripciones(ids: Array<number | null>): void {
    const pendientes = ids.filter((id): id is number => !!id && !this.descripciones()[id]);
    for (const id of pendientes) {
      this.service.getAfipConcepto(id).subscribe({
        next: (concepto) =>
          this.descripciones.update((mapa) => ({ ...mapa, [id]: concepto.descripcion })),
        error: () => undefined,
      });
    }
  }

  private tipoGrupo(grupo: CodigoGrupo): GrupoTipo {
    if (grupo.remunerativo === 1) return 'remunerativo';
    if (grupo.noRemunerativo === 1) return 'noRemunerativo';
    if (grupo.deduccion === 1) return 'deduccion';
    return '';
  }

  private formVacio(): CodigoForm {
    return {
      codigoId: 0,
      nombre: '',
      docente: false,
      noDocente: false,
      transferible: false,
      incluidoEtec: false,
      afipPrimero: null,
      afipSegundo: null,
      grupo: '',
    };
  }

  private limpiarMensajes(): void {
    this.error.set('');
    this.mensaje.set('');
  }
}
