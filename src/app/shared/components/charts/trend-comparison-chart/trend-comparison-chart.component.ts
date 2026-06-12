import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-trend-comparison-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trend-comparison-chart.component.html',
  styleUrls: ['./trend-comparison-chart.component.scss']
})
export class TrendComparisonChartComponent {
  @Input() title: string = 'Linha de tendência (comparação)';
  @Input() subtitle: string = '';
  @Input() labels: string[] = [];
  @Input() seriesA: number[] = []; // % km vazio (azul)
  @Input() seriesB: number[] = []; // custo por km vazio (vermelho)
  @Input() meta: number | number[] | null = null; // meta fixa ou série meta
  @Input() colorA: string = '#0ea5e9';
  @Input() colorB: string = '#ef4444';
  @Input() metaColor: string = '#94a3b8';
  @Input() yMin?: number;
  @Input() yMax?: number;
  @Input() height: number = 180;
  @Input() width: number = 640;

  hoverIndex: number | null = null;

  get padding(): { left: number; right: number; top: number; bottom: number } {
    return { left: 24, right: 12, top: 18, bottom: 26 };
  }

  private clamp(val: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, val));
  }

  private dataBounds(): { min: number; max: number } {
    const values = [...this.seriesA, ...this.seriesB];
    if (this.meta && Array.isArray(this.meta)) values.push(...this.meta);
    const min = this.yMin ?? Math.min(...values);
    const max = this.yMax ?? Math.max(...values);
    const pad = (max - min) * 0.08;
    return { min: min - pad, max: max + pad };
  }

  private scaleY(val: number, min: number, max: number): number {
    const h = this.height - this.padding.top - this.padding.bottom;
    return this.padding.top + (1 - (val - min) / (max - min)) * h;
  }
  private scaleX(idx: number, count: number): number {
    const w = this.width - this.padding.left - this.padding.right;
    if (count <= 1) return this.padding.left + w / 2;
    return this.padding.left + (idx / (count - 1)) * w;
  }

  get pointsA(): { x: number; y: number }[] {
    const { min, max } = this.dataBounds();
    return this.seriesA.map((v, i) => ({ x: this.scaleX(i, this.seriesA.length), y: this.scaleY(v, min, max) }));
  }
  get pointsB(): { x: number; y: number }[] {
    const { min, max } = this.dataBounds();
    return this.seriesB.map((v, i) => ({ x: this.scaleX(i, this.seriesB.length), y: this.scaleY(v, min, max) }));
  }
  get pointsMeta(): { x: number; y: number }[] | null {
    const { min, max } = this.dataBounds();
    if (typeof this.meta === 'number') {
      const y = this.scaleY(this.meta, min, max);
      const x0 = this.padding.left;
      const x1 = this.width - this.padding.right;
      return [{ x: x0, y }, { x: x1, y }];
    } else if (Array.isArray(this.meta)) {
      const metaArr = this.meta as number[];
      return metaArr.map((v, i) => ({ x: this.scaleX(i, metaArr.length), y: this.scaleY(v, min, max) }));
    }
    return null;
  }

  get polylineA(): string {
    return this.pointsA.map(p => `${p.x},${p.y}`).join(' ');
  }
  get polylineB(): string {
    return this.pointsB.map(p => `${p.x},${p.y}`).join(' ');
  }
  get polylineMeta(): string | null {
    const pts = this.pointsMeta;
    return pts ? pts.map(p => `${p.x},${p.y}`).join(' ') : null;
  }
  get areaA(): string {
    if (!this.pointsA.length) return '';
    const baselineY = this.height - this.padding.bottom;
    const start = `${this.pointsA[0].x},${baselineY}`;
    const mid = this.pointsA.map(p => `${p.x},${p.y}`).join(' ');
    const end = `${this.pointsA[this.pointsA.length - 1].x},${baselineY}`;
    return `${start} ${mid} ${end}`;
  }

  onMouseMove(evt: MouseEvent): void {
    const rect = (evt.target as SVGElement).getBoundingClientRect();
    const x = evt.clientX - rect.left;
    const w = this.width - this.padding.left - this.padding.right;
    const count = Math.max(this.seriesA.length, this.seriesB.length);
    const rel = this.clamp(x - this.padding.left, 0, w);
    const idx = Math.round((rel / w) * (count - 1));
    this.hoverIndex = this.clamp(idx, 0, count - 1);
  }
  onMouseLeave(): void { this.hoverIndex = null; }

  get tooltip(): { x: number; y: number; label: string; a?: number; aDelta?: number; b?: number; bDelta?: number } | null {
    if (this.hoverIndex == null) return null;
    const i = this.hoverIndex;
    const a = this.seriesA[i];
    const b = this.seriesB[i];
    const aPrev = i > 0 ? this.seriesA[i - 1] : undefined;
    const bPrev = i > 0 ? this.seriesB[i - 1] : undefined;
    const label = this.labels[i] ?? `#${i + 1}`;
    const pxA = this.pointsA[i];
    const pxB = this.pointsB[i];
    const x = (pxA?.x ?? pxB?.x ?? this.padding.left) + 6;
    const y = Math.min(pxA?.y ?? Infinity, pxB?.y ?? Infinity) - 8;
    return {
      x, y, label,
      a, aDelta: aPrev != null ? +(a - aPrev).toFixed(2) : undefined,
      b, bDelta: bPrev != null ? +(b - bPrev).toFixed(2) : undefined
    };
  }
}