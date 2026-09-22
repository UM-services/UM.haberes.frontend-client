import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface MenuItem {
  label: string;
  path: string;
  iconSvg?: string;
}

export interface MenuGroup<T = MenuItem> {
  title: string;
  iconSvg?: string;
  items: T[];
}

@Component({
  selector: 'ui-sidebar',
  templateUrl: './sidebar.html',
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class SidebarComponent {
  @Input() moduleName = "Haberes";
  @Input() menuItems: MenuItem[] = [];
  @Input() menuGroups: MenuGroup[] = [];

  expandedGroups = new Set<string>();

  toggleGroup(title: string): void {
    if (this.expandedGroups.has(title)) {
      this.expandedGroups.delete(title);
    } else {
      this.expandedGroups.add(title);
    }
  }

  isGroupExpanded(title: string): boolean {
    return this.expandedGroups.has(title);
  }
}
