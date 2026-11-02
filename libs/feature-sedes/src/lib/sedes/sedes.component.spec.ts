import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { SedesComponent } from './sedes.component';
import { SedesService } from './sedes.service';

describe('SedesComponent', () => {
  const serviceStub = {
    getSedes: () => of([]),
    update: () => of({ geograficaId: 1, nombre: '' }),
  };

  it('se crea y carga el listado', async () => {
    await TestBed.configureTestingModule({
      imports: [SedesComponent],
      providers: [{ provide: SedesService, useValue: serviceStub }],
    }).compileComponents();

    const fixture = TestBed.createComponent(SedesComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.componentInstance.sedes()).toEqual([]);
  });
});
