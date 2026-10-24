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

  const serviceStub = {
    getDependencias: () => of([{ dependenciaId: 5, nombre: 'Dependencia' }]),
    getPersona: () => of(persona),
    getPersonaPorDocumento: () => of(persona),
    patchPersona,
    getContacto: () => of(null),
    saveContacto: vi.fn(() => of({ legajoId: 7 })),
    validarMail: () => of(true),
    getLegajosBanco: () => of([]),
    saveLegajoBanco: vi.fn(() => of({})),
    getAntiguedad: () => of({ mesesDocentes: 24, mesesAdministrativos: 12 }),
    calcularAntiguedad: () => of(void 0),
  };

  const crear = async () => {
    patchPersona.mockClear();
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
});
