import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuConfigService, MenuItem, MenuKey } from '@core/services/menu-config.service';
import { PageLayoutComponent, ButtonComponent } from '@shared/components';

@Component({
  selector: 'app-menu-config',
  templateUrl: './menu-config-list.component.html',
  styleUrls: ['./menu-config-list.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, PageLayoutComponent, ButtonComponent]
})
export class MenuConfigComponent implements OnInit {
  items: MenuItem[] = [];
  enabledMap: Record<MenuKey, boolean> = {} as any;

  categories = [
    {
      title: 'Painéis & Rastreamento',
      keys: ['torre-controle', 'rastreamento', 'timeline-logistica']
    },
    {
      title: 'Gestão Operacional',
      keys: ['programacao']
    },
    {
      title: 'Viagens & Fretes',
      keys: ['controle-intencao-viagem']
    }
  ];

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

  get groupedItems() {
    return this.categories.map(cat => ({
      title: cat.title,
      items: this.items.filter(it => cat.keys.includes(it.key))
    }));
  }

  getEnabledCount(items: MenuItem[]): number {
    return items.filter(it => this.isEnabled(it.key)).length;
  }
}