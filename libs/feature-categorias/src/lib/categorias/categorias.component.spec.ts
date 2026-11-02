import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { CategoriasComponent } from './categorias.component';
import { CategoriasService } from './categorias.service';

describe('CategoriasComponent', () => {
  const serviceStub = {
    getCategorias: () => of([]),
    getLast: () => of({ categoriaId: 0, nombre: '' }),
    create: () => of({ categoriaId: 1 }),
    update: () => of({ categoriaId: 1 }),
    delete: () => of(void 0),
    download: () => of(new Blob()),
    upload: () => of(void 0),
  };

  it('se crea y carga el listado', async () => {
    await TestBed.configureTestingModule({
      imports: [CategoriasComponent],
      providers: [{ provide: CategoriasService, useValue: serviceStub }],
    }).compileComponents();

    const fixture = TestBed.createComponent(CategoriasComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.componentInstance.categorias()).toEqual([]);
  });
});
