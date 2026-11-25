import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { Persona } from '@haberes/shared-api';

import { PersonasComponent } from './personas.component';
import { PersonasService } from './personas.service';

describe('PersonasComponent', () => {
  const persona: Persona = {
    legajoId: 7,
    apellido: 'Pérez',
    nombre: 'Ana',
    documento: 30111222,
    dependenciaId: 5,
    estadoCivil: 'S',
    cuil: '27301112224',
    posgrado: 0,
    estado: 1,
    liquida: 'S',
    estadoAfip: 1,
    situacionAfip: 3,
  };

  const patchPersona = vi.fn(() => of(persona));
  const crearPersona = vi.fn(() => of(persona));
  const calcularAntiguedad = vi.fn(() => of(void 0));
  const saveLegajoBanco = vi.fn(() => of({}));

  const serviceStub = {
    getDependencias: () => of([{ dependenciaId: 5, nombre: 'Dependencia' }]),
    getPersona: () => of(persona),
    getPersonaPorDocumento: () => of(persona),
    crearPersona,
    patchPersona,
    getContacto: () => of(null),
    saveContacto: vi.fn(() => of({ legajoId: 7 })),
    validarMail: () => of(true),
    getLegajosBanco: () => of([]),
    saveLegajoBanco,
    getAntiguedad: () => of({ mesesDocentes: 24, mesesAdministrativos: 12, mesesEtec: 6 }),
    calcularAntiguedad,
  };

  const crear = async () => {
    patchPersona.mockClear();
    crearPersona.mockClear();
    calcularAntiguedad.mockClear();
    saveLegajoBanco.mockClear();
    await TestBed.configureTestingModule({
      imports: [PersonasComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PersonasService, useValue: serviceStub },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(PersonasComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  it('carga la ficha sin marcar cambios', async () => {
    const component = await crear();

    component.cargar(7);

    expect(component.persona()?.legajoId).toBe(7);
    expect(component.hayCambios()).toBe(false);
  });

  it('envía únicamente el campo modificado', async () => {
    const component = await crear();
    component.cargar(7);

    component.form.apellido = 'Gómez';
    expect(component.hayCambios()).toBe(true);

    component.guardar();

    expect(patchPersona).toHaveBeenCalledWith(7, { apellido: 'Gómez' });
  });

  it('no llama al backend cuando no hay cambios', async () => {
    const component = await crear();
    component.cargar(7);

    component.guardar();

    expect(patchPersona).not.toHaveBeenCalled();
    expect(component.mensaje()).toContain('No hay cambios');
  });

  it('envía la fecha de alta ETEC cuando cambia', async () => {
    const component = await crear();
    component.cargar(7);

    component.form.altaEtec = '2026-03-01';
    component.guardar();

    expect(patchPersona).toHaveBeenCalledWith(7, { altaEtec: '2026-03-01T00:00:00+0000' });
    expect(calcularAntiguedad).toHaveBeenCalledWith(7, component.anhoActual, component.mesActual);
  });

  it('conserva el acreditado al editar un CBU existente', async () => {
    const component = await crear();
    component.cargar(7);
    component.seleccionarCbu({
      legajoBancoId: 3,
      legajoId: 7,
      anho: 2026,
      mes: 11,
      cbu: '0720000000000000000001',
      fijo: 0,
      porcentaje: 0,
      resto: 1,
      acreditado: 1234.56,
    });

    component.guardarCbu();

    expect(saveLegajoBanco).toHaveBeenCalledWith(
      expect.objectContaining({ legajoBancoId: 3, acreditado: 1234.56 }),
      true,
    );
  });

  it('crea un legajo nuevo con el número informado', async () => {
    const component = await crear();
    component.nuevoLegajo();
    component.form.legajoId = 99;
    component.form.documento = 30111223;
    component.form.apellido = 'Nuevo';
    component.form.nombre = 'Legajo';
    component.form.dependenciaId = 5;
    component.form.altaEtec = '2026-03-01';

    component.guardar();

    expect(crearPersona).toHaveBeenCalledWith(
      expect.objectContaining({
        legajoId: 99,
        apellido: 'Nuevo',
        nombre: 'Legajo',
        dependenciaId: 5,
        altaEtec: '2026-03-01T00:00:00+0000',
      }),
    );
    expect(calcularAntiguedad).toHaveBeenCalledWith(7, component.anhoActual, component.mesActual);
  });
});
