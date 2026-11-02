import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_URL } from '@haberes/shared-api';

import { CategoriasService } from './categorias.service';

describe('CategoriasService', () => {
  let service: CategoriasService;
  let http: HttpTestingController;

  const categoria = {
    categoriaId: 3,
    nombre: 'Categoría 3',
    basico: 1000,
    docente: 1,
    noDocente: 0,
    liquidaPorHora: 0,
    estadoDocente: 25,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: '/api/haberes' },
      ],
    });
    service = TestBed.inject(CategoriasService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('crea y actualiza con el período en la ruta', () => {
    service.create(categoria, 2026, 10).subscribe();
    const post = http.expectOne('/api/haberes/core/categoria/2026/10');
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual(categoria);
    post.flush(categoria);

    service.update(categoria, 2026, 10).subscribe();
    const put = http.expectOne('/api/haberes/core/categoria/3/2026/10');
    expect(put.request.method).toBe('PUT');
    put.flush(categoria);
  });

  it('descarga la planilla como blob', () => {
    let tipo: string | undefined;
    service.download().subscribe((blob) => (tipo = blob.type));

    const req = http.expectOne('/api/haberes/core/sheet/generateCategorias');
    expect(req.request.responseType).toBe('blob');
    req.flush(
      new Blob(['x'], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
    );

    expect(tipo).toContain('spreadsheetml');
  });

  it('sube la planilla con filename y base64', () => {
    service.upload({ filename: 'categorias.xlsx', base64: 'AAA' }, 2026, 10).subscribe();

    const req = http.expectOne('/api/haberes/core/categoria/upload/2026/10');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ filename: 'categorias.xlsx', base64: 'AAA' });
    req.flush(null);
  });
});
