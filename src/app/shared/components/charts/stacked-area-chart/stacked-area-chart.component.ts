import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stacked-area-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stacked-area-chart.component.html',
  styleUrls: ['./stacked-area-chart.component.scss']
})
export class StackedAreaChartComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() labels: string[] = [];
  @Input() seriesA: number[] = [];
  @Input() seriesB: number[] = [];
  @Input() overlay: number[] = [];
  @Input() colorA = '#16a34a';
  @Input() colorB = '#f59e0b';
  @Input() colorOverlay = '#ffffff';
  @Input() height = 180;
  @Input() width = 520;

  get padding() { return { top: 16, right: 24, bottom: 24, left: 32 }; }
  get innerW(): number { return this.width - this.padding.left - this.padding.right; }
  get innerH(): number { return this.height - this.padding.top - this.padding.bottom; }

  private safe(arr: number[], i: number): number { return typeof arr?.[i] === 'number' ? arr[i] : 0; }
  get seriesSum(): number[] { return this.labels.map((_, i) => this.safe(this.seriesA, i) + this.safe(this.seriesB, i)); }
  get maxY(): number { return Math.max(...this.seriesSum, 0) * 1.15 || 1; }

  x(i: number): number {
    const n = this.labels.length || 1;
    const step = this.innerW / (n - 1);
    return this.padding.left + step * i;
  }
  y(v: number): number {
    const ratio = (v / this.maxY);
    return this.padding.top + this.innerH - ratio * this.innerH;
  }

  areaPath(series: number[], offset: number[] = []): string {
    const n = this.labels.length;
    const points = [] as string[];
    for (let i = 0; i < n; i++) {
      const xv = this.x(i);
      const yv = this.y(series[i] + (offset[i] || 0));
      points.push(`${xv},${yv}`);
    }
    // close shape down to baseline
    const lastX = this.x(n - 1);
    const baseYLast = this.y(offset[n - 1] || 0);
    const baseYFirst = this.y(offset[0] || 0);
    return `${points.join(' ')} ${lastX},${baseYLast} ${this.x(0)},${baseYFirst}`;
  }

  overlayPoints(): string {
    if (!this.overlay?.length) return '';
    const maxOverlay = Math.max(...this.overlay, 1);
    return this.overlay.map((v, i) => {
      const xv = this.x(i);
      const yv = this.padding.top + this.innerH - (this.innerH * (v / maxOverlay));
      return `${xv},${yv}`;
    }).join(' ');
  }
}