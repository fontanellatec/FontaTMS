import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ICONS } from '../../../icons';

@Component({
  selector: 'app-btn',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss']
})
export class ButtonComponent {
  @Input() variant: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'icon' = 'primary';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() icon?: string; // Nome do ícone no ICONS ou SVG completo

  @Output() click = new EventEmitter<MouseEvent>();

  constructor(private sanitizer: DomSanitizer) {}

  onClick(event: MouseEvent) {
    if (!this.disabled) {
      this.click.emit(event);
    } else {
      event.stopPropagation();
      event.preventDefault();
    }
  }

  getButtonClass(): string {
    const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed select-none cursor-pointer';
    
    // Variantes de cores e bordas usando Tailwind CSS
    let variantClasses = '';
    if (this.variant === 'primary') {
      variantClasses = 'bg-brand-primary text-white border border-brand-primary hover:bg-brand-primary-hover hover:border-brand-primary-hover hover:-translate-y-px hover:shadow-sm active:translate-y-0';
    } else if (this.variant === 'secondary') {
      variantClasses = 'bg-transparent text-text border border-border hover:bg-surface-secondary hover:border-border/80 hover:-translate-y-px hover:shadow-sm active:translate-y-0';
    } else if (this.variant === 'danger') {
      variantClasses = 'bg-error text-white border border-error hover:bg-error-dark hover:border-error-dark hover:-translate-y-px hover:shadow-sm active:translate-y-0';
    } else if (this.variant === 'success') {
      variantClasses = 'bg-success text-white border border-success hover:bg-success-dark hover:border-success-dark hover:-translate-y-px hover:shadow-sm active:translate-y-0';
    } else if (this.variant === 'warning') {
      variantClasses = 'bg-warning text-white border border-warning hover:bg-amber-700 hover:border-amber-700 hover:-translate-y-px hover:shadow-sm active:translate-y-0';
    } else if (this.variant === 'icon') {
      variantClasses = 'p-1.5 text-text-secondary hover:text-text hover:bg-surface border border-transparent rounded-lg transition-colors active:scale-95';
    }

    // Tamanhos e Arredondamento
    let sizeClasses = '';
    if (this.variant === 'icon') {
      sizeClasses = 'rounded-lg';
    } else {
      if (this.size === 'sm') {
        sizeClasses = 'py-1.5 px-3 text-xs gap-1.5 rounded-md';
      } else if (this.size === 'md') {
        sizeClasses = 'py-2 px-4 text-sm gap-2 rounded-lg';
      } else if (this.size === 'lg') {
        sizeClasses = 'py-2.5 px-5 text-base gap-2.5 rounded-lg';
      }
    }

    return `${baseClasses} ${variantClasses} ${sizeClasses}`;
  }

  getIconSvg(): SafeHtml | null {
    if (!this.icon) return null;
    const trimmed = this.icon.trim();
    if (trimmed.startsWith('<svg')) {
      return this.sanitizer.bypassSecurityTrustHtml(trimmed);
    }
    const svgFromConfig = ICONS[trimmed];
    if (svgFromConfig) {
      return this.sanitizer.bypassSecurityTrustHtml(svgFromConfig);
    }
    return null;
  }
}
