import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ICONS } from '../../../icons';
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
    let classes = ['inline-flex items-center gap-2 font-medium cursor-pointer transition-all duration-200 text-decoration-none w-auto max-w-fit relative overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed hover:-translate-y-px hover:shadow-[0_2px_8px_rgba(0,0,0,0.1)]'];
    
    const type = button.type || 'primary';
    if (type === 'primary') {
      classes.push('bg-[#086A54] border border-[#086A54] text-white hover:bg-[#086A54] hover:border-[#086A54]');
    } else if (type === 'secondary') {
      classes.push('bg-surface-secondary border border-border text-text');
    } else if (type === 'success') {
      classes.push('bg-[#16a34a] border border-[#16a34a] text-white');
    } else if (type === 'danger') {
      classes.push('bg-[#dc2626] border border-[#dc2626] text-white');
    } else if (type === 'warning') {
      classes.push('bg-[#f59e0b] border border-[#f59e0b] text-[#1f2937]');
    }

    const size = button.size || 'medium';
    if (size === 'small') {
      classes.push('py-1.5 px-3 text-xs rounded-md');
    } else if (size === 'medium') {
      classes.push('py-2 px-4 text-sm rounded-lg');
    } else if (size === 'large') {
      classes.push('py-2.5 px-[18px] text-base rounded-lg');
    }

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