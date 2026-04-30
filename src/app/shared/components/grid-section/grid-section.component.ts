import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, HostListener, TemplateRef } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface GridColumn {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'status' | 'badge' | 'button';
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  format?: string; // ex.: 'dd/MM/yyyy' (futuro)
  // Fixar coluna horizontalmente (congelar) com offset à esquerda
  sticky?: boolean;
  stickyLeft?: number; // em pixels; cumulativo quando várias colunas estão fixas
  // Para colunas tipo botão
  buttonLabel?: string;
  buttonAction?: string;
  buttonType?: 'primary' | 'success' | 'danger' | 'warning' | 'secondary';
  template?: TemplateRef<any>;
}

export interface GridAction {
  action: string;
  label: string;
  icon?: string;
  type?: 'primary' | 'success' | 'danger' | 'warning' | 'secondary';
}

@Component({
  selector: 'app-grid-section',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './grid-section.component.html',
  styleUrls: ['./grid-section.component.scss']
})
export class GridSectionComponent implements OnChanges {
  @Input() title: string = 'Grid';
  @Input() columns: GridColumn[] = [];
  @Input() rows: any[] = [];
  @Input() collapsed: boolean = false;
  // Define se o grid é colapsável; por padrão, NÃO é
  @Input() collapsible: boolean = false;

  // Comportamento de scroll horizontal (padrão: habilitado quando necessário)
  @Input() horizontalScroll: boolean = true;
  // Rolagem vertical interna ao grid e altura máxima configurável
  @Input() verticalScroll: boolean = true;
  @Input() bodyMaxHeight: number | null = 560;
  // Modo tela inteira
  @Input() fullscreen: boolean = false; // entrada inicial
  @Input() fullscreenToggle: boolean = false; // mostra o botão de alternância
  @Output() fullscreenChange = new EventEmitter<boolean>();

  @Input() page: number = 1;
  @Input() pageSize: number = 10;
  @Input() pageSizeOptions: number[] = [10, 25, 50];

  @Input() showActions: boolean = false;
  @Input() actions: GridAction[] = [];

  @Output() collapsedChange = new EventEmitter<boolean>();
  @Output() toggleCollapsed = new EventEmitter<boolean>();
  @Output() sortChange = new EventEmitter<{ key: string; dir: 'asc' | 'desc' }>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();
  @Output() rowClick = new EventEmitter<any>();
  @Output() actionClick = new EventEmitter<{ action: string; row: any }>();

  // Estado interno
  sortKey: string | null = null;
  sortDir: 'asc' | 'desc' = 'asc';
  get pageCount(): number { return Math.ceil(this.rows.length / this.pageSize) || 1; }
  get pagedRows(): any[] {
    const start = (this.page - 1) * this.pageSize;
    return this.rows.slice(start, start + this.pageSize);
  }

  isFullscreen = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['fullscreen']) {
      this.isFullscreen = !!this.fullscreen;
      this.applyBodyScrollLock(this.isFullscreen);
    }
  }

  toggleFullscreen(): void {
    this.isFullscreen = !this.isFullscreen;
    this.fullscreenChange.emit(this.isFullscreen);
    this.applyBodyScrollLock(this.isFullscreen);
  }

  private applyBodyScrollLock(lock: boolean) {
    try {
      document.body.style.overflow = lock ? 'hidden' : '';
    } catch {}
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.isFullscreen) {
      this.toggleFullscreen();
    }
  }

  onToggle(): void {
    this.collapsed = !this.collapsed;
    this.collapsedChange.emit(this.collapsed);
    this.toggleCollapsed.emit(this.collapsed);
  }

  onSort(col: GridColumn): void {
    if (!col.sortable) return;
    if (this.sortKey === col.key) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = col.key;
      this.sortDir = 'asc';
    }
    this.sortChange.emit({ key: col.key, dir: this.sortDir });
  }

  setPageSize(n: number): void {
    this.pageSize = Number(n) || 10;
    this.pageSizeChange.emit(this.pageSize);
    this.page = 1;
  }
  prevPage(): void { if (this.page > 1) { this.page = this.page - 1; this.pageChange.emit(this.page); } }
  nextPage(): void { if (this.page < this.pageCount) { this.page = this.page + 1; this.pageChange.emit(this.page); } }
  firstPage(): void { if (this.page !== 1) { this.page = 1; this.pageChange.emit(this.page); } }
  lastPage(): void { if (this.page !== this.pageCount) { this.page = this.pageCount; this.pageChange.emit(this.page); } }

  cellValue(row: any, col: GridColumn): any { return row?.[col.key]; }

  // TrackBy para otimizar renderização e evitar erros quando usar trackBy no template
  trackByRow(index: number, row: any): any {
    return row?.id ?? index;
  }

  onRowClick(row: any): void { this.rowClick.emit(row); }

  constructor(private sanitizer: DomSanitizer) {}

  onAction(action: string, row: any): void { this.actionClick.emit({ action, row }); }

  getIconSvg(icon?: string): SafeHtml {
    const fallback = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>';
    const svg = (icon && icon.trim()) ? icon : fallback;
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }
}