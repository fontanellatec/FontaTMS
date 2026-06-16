import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ScatterPoint { x: number; y: number; size?: number; label?: string; color?: string; }

@Component({
  selector: 'app-scatter-plot',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './scatter-plot.component.html',
  styleUrls: ['./scatter-plot.component.scss']
})
export class ScatterPlotComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() points: ScatterPoint[] = [];
  @Input() xLabel = 'KM vazio';
  @Input() yLabel = 'Custo por KM';
  @Input() height = 220;
  @Input() width = 520;

  get padding() { return { top: 24, right: 24, bottom: 32, left: 48 }; }
  get innerW(): number { return this.width - this.padding.left - this.padding.right; }
  get innerH(): number { return this.height - this.padding.top - this.padding.bottom; }

  get minX(): number { return Math.min(...this.points.map(p => p.x), 0); }
  get maxX(): number { return Math.max(...this.points.map(p => p.x), 1); }
  get minY(): number { return Math.min(...this.points.map(p => p.y), 0); }
  get maxY(): number { return Math.max(...this.points.map(p => p.y), 1); }

  x(v: number): number {
    const ratio = (v - this.minX) / (this.maxX - this.minX || 1);
    return this.padding.left + ratio * this.innerW;
  }
  y(v: number): number {
    const ratio = (v - this.minY) / (this.maxY - this.minY || 1);
    return this.padding.top + this.innerH - ratio * this.innerH;
  }
  r(size?: number): number {
    const s = size ?? 1;
    return Math.max(4, Math.min(14, s * 8));
  }
}