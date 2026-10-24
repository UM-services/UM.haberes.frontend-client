import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ClasesComponent } from './clases.component';
import { ClasesService } from './clases.service';

describe('ClasesComponent', () => {
  const serviceStub = {
    getClases: () => of([]),
    getLast: () => of({ claseId: 0, nombre: '', valorHora: 0 }),
    create: () => of({ claseId: 1, nombre: '', valorHora: 0 }),
    update: () => of({ claseId: 1, nombre: '', valorHora: 0 }),
    delete: () => of(void 0),
  };

  it('se crea y carga el listado', async () => {
    await TestBed.configureTestingModule({
      imports: [ClasesComponent],
      providers: [{ provide: ClasesService, useValue: serviceStub }],
    }).compileComponents();

    const fixture = TestBed.createComponent(ClasesComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.componentInstance.clases()).toEqual([]);
  });
});
