import { Component } from '@angular/core';
import { MenuGroup, UiShellComponent } from '@haberes/ui-layout';
import { MENU_GROUPS } from './menu-options.data';

@Component({
  standalone: true,
  imports: [UiShellComponent],
  selector: 'app-root',
  template: `
    <ui-shell
      moduleName="Liquidación"
      menuSectionLabel="Menú Liquidación"
      [menuGroups]="menuGroups"
    />
  `,
})
export class AppComponent {
  title = 'liquidacion';

  readonly menuGroups: MenuGroup[] = [
    {
      title: 'Principal',
      iconSvg:
        'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
      items: [
        {
          label: 'Panel Principal',
          path: '/inicio',
          iconSvg:
            'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
        },
      ],
    },
    ...MENU_GROUPS,
  ];
}