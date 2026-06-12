import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-grouped-column-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './grouped-column-chart.component.html',
  styleUrls: ['./grouped-column-chart.component.scss']
})
export class GroupedColumnChartComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() labels: string[] = [];
  @Input() fuel: number[] = [];
  @Input() toll: number[] = [];
  @Input() overlayPerc: number[] = [];
  @Input() colorFuel = '#16a34a';
  @Input() colorToll = '#ef4444';
  @Input() colorOverlay = '#0ea5e9';
  @Input() height = 160;
  @Input() width = 520;

  get seriesTotal(): number[] {
    return this.labels.map((_, i) => (this.safe(this.fuel[i]) + this.safe(this.toll[i])));
  }
  private safe(v: number | undefined): number { return typeof v === 'number' ? v : 0; }

  get maxY(): number {
    const maxTotal = Math.max(...this.seriesTotal, 0);
    return maxTotal > 0 ? maxTotal * 1.15 : 1;
  }

  get padding() { return { top: 16, right: 24, bottom: 24, left: 32 }; }
  get innerW(): number { return this.width - this.padding.left - this.padding.right; }
  get innerH(): number { return this.height - this.padding.top - this.padding.bottom; }

  x(i: number): number {
    const n = this.labels.length || 1;
    const step = this.innerW / n;
    return this.padding.left + step * i + step * 0.5;
  }
  y(v: number): number {
    const ratio = (v / this.maxY);
    return this.padding.top + this.innerH - ratio * this.innerH;
  }

  colWidth(): number {
    const n = this.labels.length || 1;
    return Math.max(12, (this.innerW / n) * 0.6);
  }

  fuelRect(i: number) {
    const x = this.x(i) - this.colWidth() / 2;
    const hFuel = this.innerH * (this.safe(this.fuel[i]) / this.maxY);
    const yFuel = this.padding.top + this.innerH - hFuel;
    return { x, y: yFuel, w: this.colWidth(), h: hFuel };
  }
  tollRect(i: number) {
    const x = this.x(i) - this.colWidth() / 2;
    const hFuel = this.innerH * (this.safe(this.fuel[i]) / this.maxY);
    const hToll = this.innerH * (this.safe(this.toll[i]) / this.maxY);
    const yToll = this.padding.top + this.innerH - hFuel - hToll;
    return { x, y: yToll, w: this.colWidth(), h: hToll };
  }

  overlayPoints(): string {
    if (!this.overlayPerc?.length) return '';
    const maxPerc = Math.max(...this.overlayPerc, 1);
    return this.overlayPerc.map((v, i) => {
      const xv = this.x(i);
      const yv = this.padding.top + this.innerH - (this.innerH * (v / maxPerc));
      return `${xv},${yv}`;
    }).join(' ');
  }
}