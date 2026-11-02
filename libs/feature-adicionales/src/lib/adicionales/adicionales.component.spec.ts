import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AdicionalesComponent } from './adicionales.component';
import { AdicionalesService } from './adicionales.service';

describe('AdicionalesComponent', () => {
  const serviceStub = {
    getTablas: () => of([]),
    getRangos: () => of([]),
    addRango: () => of({}),
    deleteRango: () => of(void 0),
  };

  it('se crea y carga las tablas', async () => {
    await TestBed.configureTestingModule({
      imports: [AdicionalesComponent],
      providers: [{ provide: AdicionalesService, useValue: serviceStub }],
    }).compileComponents();

    const fixture = TestBed.createComponent(AdicionalesComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.componentInstance.tablas()).toEqual([]);
  });
});
