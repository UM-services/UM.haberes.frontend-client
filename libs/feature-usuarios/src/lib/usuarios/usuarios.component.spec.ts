import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthService } from '@haberes/shared-api';

import { UsuariosComponent } from './usuarios.component';
import { UsuariosService } from './usuarios.service';

describe('UsuariosComponent', () => {
  const usuarios = [
    { legajoId: 725, usuarioId: 9, facultadId: null, administrador: 1 },
    { legajoId: 349, usuarioId: 3, facultadId: 1, administrador: 0 },
  ];

  const serviceStub = {
    getUsuarios: () => of(usuarios),
    getPersonas: () => of([{ legajoId: 725, apellido: 'Quinteros', nombre: 'Daniel' }]),
    setAdministrador: (legajoId: number, administrador: number) =>
      of({ legajoId, usuarioId: 9, facultadId: null, administrador }),
  };

  const authStub = {
    currentUserValue: { legajoId: 725 },
    getFacultad: () => of({ nombre: 'Ingeniería' }),
  };

  const crear = async () => {
    await TestBed.configureTestingModule({
      imports: [UsuariosComponent],
      providers: [
        { provide: UsuariosService, useValue: serviceStub },
        { provide: AuthService, useValue: authStub },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(UsuariosComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  it('carga usuarios y resuelve nombres y alcance', async () => {
    const component = await crear();

    expect(component.usuarios().length).toBe(2);
    const fila = component.filas().find((item) => item.legajoId === 725);
    expect(fila?.apellido).toBe('Quinteros');
    expect(fila?.facultadNombre).toBe('Global');
    expect(fila?.esActual).toBe(true);
  });

  it('no permite editar la sesión actual ni usuarios con facultad', async () => {
    const component = await crear();

    const propia = component.filas().find((item) => item.legajoId === 725);
    const conFacultad = component.filas().find((item) => item.legajoId === 349);
    expect(propia?.puedeEditar).toBe(false);
    expect(conFacultad?.puedeEditar).toBe(false);
  });

  it('filtra por legajo, apellido o nombre', async () => {
    const component = await crear();

    component.filtro.set('quinteros');
    expect(component.filas().length).toBe(1);
    expect(component.filas()[0].legajoId).toBe(725);

    component.filtro.set('349');
    expect(component.filas().length).toBe(1);
    expect(component.filas()[0].legajoId).toBe(349);
  });
});
