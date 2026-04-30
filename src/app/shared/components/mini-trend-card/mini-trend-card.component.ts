import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SparklineChartComponent } from '../sparkline-chart/sparkline-chart.component';
import { ICONS } from '../../icons';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-mini-trend-card',
  standalone: true,
  imports: [CommonModule, SparklineChartComponent],
  templateUrl: './mini-trend-card.component.html',
  styleUrls: ['./mini-trend-card.component.scss']
})
export class MiniTrendCardComponent {
  @Input() icon: string = '';
  @Input() title: string = '';
  @Input() value: number = 0;
  @Input() delta: number = 0;
  @Input() betterDirection: 'up' | 'down' = 'down';
  @Input() format: 'percentage' | 'currency' | 'number' = 'number';
  @Input() labels: string[] = [];
  @Input() series: number[] = [];
  @Input() color: string = 'var(--brand-primary)';
  @Input() variant: 'line' | 'area' = 'line';

  constructor(private sanitizer: DomSanitizer) {}

  get arrow(): string { return this.delta === 0 ? '↔' : (this.delta > 0 ? '▲' : '▼'); }
  get improved(): boolean { return this.betterDirection === 'up' ? this.delta > 0 : this.delta < 0; }
  get colorClass(): 'improve' | 'worse' | 'neutral' {
    if (this.delta === 0) return 'neutral';
    const isImprovement = this.betterDirection === 'up' ? this.delta > 0 : this.delta < 0;
    return isImprovement ? 'improve' : 'worse';
  }

  abs(value: number): number {
    return Math.abs(value);
  }

  formatValue(n: number): string {
    if (this.format === 'currency') return `R$ ${n.toFixed(2)}`;
    if (this.format === 'percentage') return `${n.toFixed(1)}%`;
    return `${n.toFixed(2)}`;
  }

  // Renderiza ícone SVG a partir do registro de ícones
  getIconSvg(icon: string): SafeHtml | string {
    if (!icon) return '';
    const trimmed = icon.trim();
    const svg = trimmed.startsWith('<svg') ? trimmed : (ICONS[icon] || '');
    return svg ? this.sanitizer.bypassSecurityTrustHtml(svg) : '';
  }
}