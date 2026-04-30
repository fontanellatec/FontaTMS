import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuConfigService, MenuItem, MenuKey } from '../../core/menu-config.service';

@Component({
  selector: 'app-menu-config',
  templateUrl: './menu-config.component.html',
  styleUrls: ['./menu-config.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class MenuConfigComponent implements OnInit {
  items: MenuItem[] = [];
  enabledMap: Record<MenuKey, boolean> = {} as any;

  constructor(private menu: MenuConfigService) {}

  ngOnInit(): void {
    this.items = this.menu.getAllMenuItems();
    this.refresh();
  }

  refresh(): void {
    this.enabledMap = this.menu.getEnabledMap();
  }

  isEnabled(key: MenuKey): boolean {
    return this.enabledMap[key] ?? true;
  }

  onToggle(key: MenuKey, enabled: boolean): void {
    this.menu.setEnabled(key, enabled);
    this.refresh();
  }

  showAll(): void {
    this.menu.setAll(true);
    this.refresh();
  }

  hideAll(): void {
    this.menu.setAll(false);
    this.refresh();
  }
}