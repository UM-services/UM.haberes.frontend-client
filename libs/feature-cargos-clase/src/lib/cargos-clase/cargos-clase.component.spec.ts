import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { CargosClaseComponent } from './cargos-clase.component';
import { CargosClaseService } from './cargos-clase.service';

describe('CargosClaseComponent', () => {
  const serviceStub = {
    getCargos: () => of([]),
    getClases: () => of([]),
    create: () => of({ cargoClaseId: 1, nombre: '', claseId: 1 }),
    update: () => of({ cargoClaseId: 1, nombre: '', claseId: 1 }),
    getDetalle: () => of([]),
  };

  it('se crea y carga el catálogo', async () => {
    await TestBed.configureTestingModule({
      imports: [CargosClaseComponent],
      providers: [{ provide: CargosClaseService, useValue: serviceStub }],
    }).compileComponents();

    const fixture = TestBed.createComponent(CargosClaseComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.componentInstance.cargos()).toEqual([]);
  });
});
