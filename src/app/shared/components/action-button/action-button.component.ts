import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ICONS } from '../../icons';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

export interface ActionButtonConfig {
  label: string;
  icon?: string;
  type?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  action: string;
}

@Component({
  selector: 'app-action-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './action-button.component.html',
  styleUrls: ['./action-button.component.scss']
})
export class ActionButtonComponent {
  @Input() title: string = 'Ações';
  @Input() buttons: ActionButtonConfig[] = [];
  @Input() collapsed: boolean = false;
  @Input() alignment: 'left' | 'center' | 'right' = 'right';
  @Input() showHeader: boolean = true;

  @Output() toggleCollapsed = new EventEmitter<void>();
  @Output() buttonClick = new EventEmitter<string>();

  constructor(private sanitizer: DomSanitizer) {}

  onToggle() {
    this.toggleCollapsed.emit();
  }

  onButtonClick(action: string) {
    this.buttonClick.emit(action);
  }

  getButtonClass(button: ActionButtonConfig): string {
    let classes = ['action-btn'];
    if (button.type) classes.push(`btn-${button.type}`); else classes.push('btn-primary');
    if (button.size) classes.push(`btn-${button.size}`); else classes.push('btn-medium');
    if (button.disabled) classes.push('btn-disabled');
    if (button.loading) classes.push('btn-loading');
    return classes.join(' ');
  }

  // Resolve ícone por nome (com fallback para SVG inline) e marcar como seguro
  getIconSvg(icon?: string): SafeHtml | string {
    if (!icon) return '';
    const trimmed = icon.trim();
    const svg = trimmed.startsWith('<svg') ? trimmed : (ICONS[icon] || '');
    return svg ? this.sanitizer.bypassSecurityTrustHtml(svg) : '';
  }
}