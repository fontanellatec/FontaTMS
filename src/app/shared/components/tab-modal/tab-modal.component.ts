import { Component, EventEmitter, HostListener, Input, Output, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TabConfig {
  id: string;
  label: string;
  icon?: string; // opcional para futuro uso
  template: TemplateRef<any>;
}

@Component({
  selector: 'app-tab-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tab-modal.component.html',
  styleUrls: ['./tab-modal.component.scss']
})
export class TabModalComponent {
  @Input() title = '';
  @Input() open = false;
  @Output() openChange = new EventEmitter<boolean>();

  @Input() size: 'sm' | 'md' | 'lg' | 'xl' = 'lg';
  @Input() tabs: TabConfig[] = [];

  @Input() activeTabId?: string;
  @Output() activeTabIdChange = new EventEmitter<string>();

  get currentTab(): TabConfig | undefined {
    const id = this.activeTabId || this.tabs[0]?.id;
    return this.tabs.find(t => t.id === id);
  }

  // Adiciona um getter seguro para uso no template
  get hasMultipleTabs(): boolean {
    return Array.isArray(this.tabs) && this.tabs.length > 1;
  }

  setActive(id: string) {
    this.activeTabId = id;
    this.activeTabIdChange.emit(id);
  }

  close() {
    this.open = false;
    this.openChange.emit(false);
  }

  @HostListener('document:keydown.escape') onEsc() {
    if (this.open) this.close();
  }
}