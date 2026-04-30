import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ICONS } from '../../icons';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

export interface KpiChild {
  label: string;
  value: number | string;
  color?: string;
  format?: 'number' | 'currency' | 'percentage' | 'text';
}

export interface KpiConfig {
  label: string;
  value: number | string;
  icon: string;
  format?: 'number' | 'currency' | 'percentage' | 'text';
  prefix?: string;
  suffix?: string;
  color?: string;
  children?: KpiChild[];
  // Diferença vs. mês anterior
  delta?: number;
  deltaFormat?: 'number' | 'currency' | 'percentage' | 'text';
  deltaSuffix?: string;
  betterDirection?: 'up' | 'down';
}

@Component({
  selector: 'app-kpi-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kpi-section.component.html',
  styleUrls: ['./kpi-section.component.scss']
})
export class KpiSectionComponent {
  @Input() title: string = 'Métricas';
  @Input() kpis: KpiConfig[] = [];
  @Input() collapsed: boolean = false;
  @Input() vertical: boolean = false;
  @Input() rowBreakIndex: number | null = null;
  @Input() highlightFirstValue: boolean = false;
  @Input() compactMargin: boolean = false;

  @Output() collapsedChange = new EventEmitter<boolean>();
  @Output() toggleCollapsed = new EventEmitter<boolean>();

  onToggle() {
    this.collapsed = !this.collapsed;
    this.collapsedChange.emit(this.collapsed);
    this.toggleCollapsed.emit(this.collapsed);
  }

  constructor(private sanitizer: DomSanitizer) {}

  // Resolve ícone por nome (com fallback para SVG inline) e marcar como seguro
  getIconSvg(icon: string): SafeHtml | string {
    if (!icon) return '';
    const trimmed = icon.trim();
    const svg = trimmed.startsWith('<svg') ? trimmed : (ICONS[icon] || '');
    return svg ? this.sanitizer.bypassSecurityTrustHtml(svg) : '';
  }

  formatNumber(value: number | string): string {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return numValue.toLocaleString('pt-BR');
  }

  formatValue(kpi: KpiConfig): string {
    const value = kpi.value;

    if (kpi.format === 'currency') {
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      return `R$ ${numValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    if (kpi.format === 'number') {
      return this.formatNumber(value);
    }

    if (kpi.format === 'percentage') {
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      return `${numValue}%`;
    }

    let formattedValue = value.toString();

    if (kpi.prefix) {
      formattedValue = kpi.prefix + formattedValue;
    }

  if (kpi.suffix) {
    formattedValue = formattedValue + kpi.suffix;
  }

  return formattedValue;
  }

  // Um card "único" é aquele sem filhos, sem delta e não-percentual
  isSingleInfo(kpi: KpiConfig): boolean {
    const noChildren = !kpi.children || kpi.children.length === 0;
    const noDelta = kpi.delta === undefined;
    const notPercentage = kpi.format !== 'percentage';
    return noChildren && noDelta && notPercentage;
  }

  // Formatação de valores para subcards (filhos)
  formatChildValue(child: KpiChild): string {
    const value = child.value;

    if (child.format === 'currency') {
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      return `R$ ${numValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    if (child.format === 'number') {
      return this.formatNumber(value);
    }

    if (child.format === 'percentage') {
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      return `${numValue}%`;
    }

    return value.toString();
  }

  // Exibição de delta (diferença vs. mês anterior)
  formatDelta(kpi: KpiConfig): string {
    const d = kpi.delta ?? 0;
    const sign = d >= 0 ? '▲' : '▼';
    const abs = Math.abs(d);
    const fmt = kpi.deltaFormat || kpi.format || 'number';
    let formatted = '';
    if (fmt === 'currency') {
      formatted = `R$ ${abs.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else if (fmt === 'percentage') {
      formatted = `${abs}%`;
    } else if (fmt === 'number') {
      formatted = abs.toLocaleString('pt-BR');
    } else {
      formatted = `${abs}`;
    }
    if (kpi.deltaSuffix) formatted = formatted + ` ${kpi.deltaSuffix}`;
    return `${sign} ${formatted}`;
  }

  isDeltaGood(kpi: KpiConfig): boolean {
    const d = kpi.delta ?? 0;
    const better = kpi.betterDirection || 'up';
    return better === 'up' ? d >= 0 : d <= 0;
  }

  percentValue(kpi: KpiConfig): number {
    const raw = typeof kpi.value === 'string' ? parseFloat(kpi.value) : (kpi.value as number);
    const num = Number.isFinite(raw as number) ? (raw as number) : 0;
  return Math.max(0, Math.min(100, num));
}
}