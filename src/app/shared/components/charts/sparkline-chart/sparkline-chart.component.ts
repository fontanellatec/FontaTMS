import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sparkline-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sparkline-chart.component.html',
  styleUrls: ['./sparkline-chart.component.scss']
})
export class SparklineChartComponent {
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() series: number[] = [];
  @Input() labels: string[] = [];
  @Input() color: string = 'var(--brand-primary)';
  @Input() variant: 'line' | 'area' = 'area';
  @Input() height: number = 100; // px
  @Input() yMin?: number;
  @Input() yMax?: number;

  get viewBox(): string {
    return '0 0 100 40';
  }

  private getBounds(): { min: number; max: number } {
    const values = this.series && this.series.length ? this.series : [0];
    const min = this.yMin ?? Math.min(...values);
    const max = this.yMax ?? Math.max(...values);
    const pad = (max - min) * 0.08 || 1; // small padding for aesthetics
    return { min: min - pad, max: max + pad };
  }

  private mapPoint(i: number, value: number, count: number, min: number, max: number): [number, number] {
    const x = (i / (count - 1)) * 100;
    const range = max - min || 1;
    const yNorm = (value - min) / range; // 0..1
    const y = 40 - (yNorm * 34 + 3); // keep some top/bottom margin
    return [Number(x.toFixed(2)), Number(y.toFixed(2))];
  }

  get points(): string {
    const { min, max } = this.getBounds();
    const pts: string[] = [];
    const count = this.series.length || 1;
    for (let i = 0; i < count; i++) {
      const [x, y] = this.mapPoint(i, this.series[i] ?? 0, count, min, max);
      pts.push(`${x},${y}`);
    }
    return pts.join(' ');
  }

  get areaPoints(): string {
    // Build polygon: line points + bottom right + bottom left
    const line = this.points;
    if (!line) return '';
    return `${line} 100,40 0,40`;
  }
}