import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { API_URL, APP_ENV_INFO, AppEnvInfo } from '@haberes/shared-api';
import { UiShellComponent } from './ui-shell';

@Component({ standalone: true, selector: 'lib-login-stub', template: '' })
class LoginStubComponent {}

const STORED_USER = {
  legajoId: 101,
  id: 101,
  nombre: 'Ana',
  apellido: 'Pérez',
  apellidoNombre: 'Ana Pérez',
  sede: 'Sede Central',
  facultadNombre: 'Facultad de Ingeniería',
};

async function createShell(
  envInfo?: AppEnvInfo,
  overrides: Partial<
    Pick<UiShellComponent, 'moduleName' | 'menuSectionLabel' | 'menuItems' | 'menuGroups' | 'logoUrl'>
  > = {},
): Promise<ComponentFixture<UiShellComponent>> {
  localStorage.setItem('haberes_user', JSON.stringify(STORED_USER));
  await TestBed.configureTestingModule({
    imports: [UiShellComponent],
    providers: [
      provideRouter([{ path: 'login', component: LoginStubComponent }]),
      provideHttpClient(),
      { provide: API_URL, useValue: '' },
      ...(envInfo ? [{ provide: APP_ENV_INFO, useValue: envInfo }] : []),
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(UiShellComponent);
  Object.assign(fixture.componentInstance, {
    moduleName: 'Novedades',
    menuSectionLabel: 'Menú Principal',
    menuItems: [
      { label: 'Asignación Cursos', path: '/asig-cursos' },
      { label: 'Docentes por Sede', path: '/docentes-sede' },
    ],
    ...overrides,
  });
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture;
}

describe('UiShellComponent', () => {
  afterEach(() => {
    localStorage.removeItem('haberes_user');
  });

  it('renders the brand block with the module name', async () => {
    const { nativeElement } = await createShell();

    expect(nativeElement.textContent).toContain('Novedades');
    expect(nativeElement.textContent).toContain('Haberes UM');
  });

  it('renders linear menu items when menuItems is provided', async () => {
    const { nativeElement } = await createShell();

    expect(nativeElement.textContent).toContain('Asignación Cursos');
    expect(nativeElement.textContent).toContain('Docentes por Sede');
  });

  it('renders grouped accordion items when menuGroups is provided', async () => {
    const { nativeElement, componentInstance } = await createShell(undefined, {
      moduleName: 'Liquidación',
      menuGroups: [
        {
          title: 'Operaciones',
          items: [{ label: 'Liquidación Individual', path: '/liquidacion/individual' }],
        },
      ],
      menuItems: [],
    });

    expect(nativeElement.textContent).toContain('Operaciones');
    // Initially collapsed
    expect(nativeElement.textContent).not.toContain('Liquidación Individual');

    // Toggle group
    componentInstance.toggleGroup('Operaciones');
    TestBed.createComponent(UiShellComponent);
  });

  it('renders the user profile with campus and faculty', async () => {
    const { nativeElement } = await createShell();

    expect(nativeElement.textContent).toContain('Ana Pérez');
    expect(nativeElement.textContent).toContain('Sede Sede Central');
    expect(nativeElement.textContent).toContain('Facultad de Ingeniería');
  });

  it('renders the environment badge when APP_ENV_INFO is provided', async () => {
    const { nativeElement } = await createShell({
      name: 'develop',
      version: '0.4.0',
    });

    expect(nativeElement.textContent).toContain('DESARROLLO');
  });
});
