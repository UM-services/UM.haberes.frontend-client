import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { CodigosComponent } from './codigos.component';
import { CodigosService } from './codigos.service';

describe('CodigosComponent', () => {
  const serviceStub = {
    getCodigos: () => of([]),
    getGrupos: () => of([]),
    getLast: () => of({ codigoId: 0 }),
    getGrupo: () => of(null),
    getAfipConcepto: () => of({ afipConceptoSueldoId: 1, descripcion: '' }),
    create: () => of({ codigoId: 1 }),
    update: () => of({ codigoId: 1 }),
    saveGrupo: () => of({ codigoId: 1 }),
    searchAfip: () => of([]),
  };

  it('se crea y carga códigos y grupos', async () => {
    await TestBed.configureTestingModule({
      imports: [CodigosComponent],
      providers: [{ provide: CodigosService, useValue: serviceStub }],
    }).compileComponents();

    const fixture = TestBed.createComponent(CodigosComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.componentInstance.codigos()).toEqual([]);
  });
});
