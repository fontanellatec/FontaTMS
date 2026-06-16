import { Component, input, signal, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ICONS } from '../../../icons';

export interface DropdownItem {
  label: string;
  routerLink?: string | any[];
  icon?: string;
  action?: () => void;
}

@Component({
  selector: 'app-dropdown-btn',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dropdown-button.component.html',
  styleUrls: ['./dropdown-button.component.scss']
})
export class DropdownButtonComponent {
  label = input.required<string>();
  items = input.required<DropdownItem[]>();
  variant = input<'primary' | 'secondary' | 'danger' | 'success' | 'warning'>('primary');
  size = input<'sm' | 'md' | 'lg'>('md');
  disabled = input<boolean>(false);
  icon = input<string>('');

  isOpen = signal<boolean>(false);

  constructor(
    private elementRef: ElementRef,
    private sanitizer: DomSanitizer
  ) {}

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    if (!this.disabled()) {
      this.isOpen.update(val => !val);
    }
  }

  onItemClick(item: DropdownItem, event: Event): void {
    this.isOpen.set(false);
    if (item.action) {
      item.action();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  getButtonClass(): string {
    const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed select-none cursor-pointer';
    
    let variantClasses = '';
    const v = this.variant();
    if (v === 'primary') {
      variantClasses = 'bg-brand-primary text-white border border-brand-primary hover:bg-brand-primary-hover hover:border-brand-primary-hover hover:-translate-y-px hover:shadow-sm active:translate-y-0';
    } else if (v === 'secondary') {
      variantClasses = 'bg-transparent text-text border border-border hover:bg-surface-secondary hover:border-border/80 hover:-translate-y-px hover:shadow-sm active:translate-y-0';
    } else if (v === 'danger') {
      variantClasses = 'bg-error text-white border border-error hover:bg-error-dark hover:border-error-dark hover:-translate-y-px hover:shadow-sm active:translate-y-0';
    } else if (v === 'success') {
      variantClasses = 'bg-success text-white border border-success hover:bg-success-dark hover:border-success-dark hover:-translate-y-px hover:shadow-sm active:translate-y-0';
    } else if (v === 'warning') {
      variantClasses = 'bg-warning text-white border border-warning hover:bg-amber-700 hover:border-amber-700 hover:-translate-y-px hover:shadow-sm active:translate-y-0';
    }

    let sizeClasses = '';
    const sz = this.size();
    if (sz === 'sm') {
      sizeClasses = 'py-1.5 px-3 text-xs gap-1.5 rounded-md';
    } else if (sz === 'md') {
      sizeClasses = 'py-2 px-4 text-sm gap-2 rounded-lg';
    } else if (sz === 'lg') {
      sizeClasses = 'py-2.5 px-5 text-base gap-2.5 rounded-lg';
    }

    return `${baseClasses} ${variantClasses} ${sizeClasses}`;
  }

  getIconSvg(): SafeHtml | null {
    const iconName = this.icon();
    if (!iconName) return null;
    const trimmed = iconName.trim();
    if (trimmed.startsWith('<svg')) {
      return this.sanitizer.bypassSecurityTrustHtml(trimmed);
    }
    const svgFromConfig = ICONS[trimmed];
    if (svgFromConfig) {
      return this.sanitizer.bypassSecurityTrustHtml(svgFromConfig);
    }
    return null;
  }

  getItemIcon(item: DropdownItem): SafeHtml | null {
    if (!item.icon) return null;
    const trimmed = item.icon.trim();
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
