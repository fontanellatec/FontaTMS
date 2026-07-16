import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, HostListener, TemplateRef } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface GridColumn {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'status' | 'badge' | 'button' | 'currency';
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

  // Novas propriedades de integração e carregamento
  @Input() serverSide: boolean = false;
  @Input() totalRows: number | null = null;
  @Input() loading: boolean = false;

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

  get processedRows(): any[] {
    if (!this.rows) return [];
    let list = [...this.rows];
    if (!this.serverSide && this.sortKey) {
      const dir = this.sortDir === 'asc' ? 1 : -1;
      list.sort((a, b) => {
        const valA = a?.[this.sortKey!];
        const valB = b?.[this.sortKey!];

        // Se for campo de data ou string no formato YYYY-MM-DD
        const col = this.columns.find(c => c.key === this.sortKey);
        if (col?.type === 'date' || (typeof valA === 'string' && valA.match(/^\d{4}-\d{2}-\d{2}/))) {
          const timeA = valA ? new Date(valA).getTime() : 0;
          const timeB = valB ? new Date(valB).getTime() : 0;
          return (timeA - timeB) * dir;
        }

        // Se for numérico
        if (typeof valA === 'number' && typeof valB === 'number') {
          return (valA - valB) * dir;
        }

        // Strings / Outros
        const strA = String(valA ?? '');
        const strB = String(valB ?? '');
        return strA.localeCompare(strB, 'pt-BR') * dir;
      });
    }
    return list;
  }

  get pageCount(): number {
    if (this.serverSide) {
      return Math.ceil((this.totalRows ?? this.rows.length) / this.pageSize) || 1;
    }
    return Math.ceil(this.processedRows.length / this.pageSize) || 1;
  }

  get totalRecords(): number {
    if (this.serverSide) {
      return this.totalRows ?? (this.rows ? this.rows.length : 0);
    }
    return this.processedRows ? this.processedRows.length : 0;
  }

  get startRecord(): number {
    if (this.totalRecords === 0) return 0;
    return (this.page - 1) * this.pageSize + 1;
  }

  get endRecord(): number {
    const end = this.page * this.pageSize;
    const total = this.totalRecords;
    return end > total ? total : end;
  }

  get pagedRows(): any[] {
    if (this.serverSide) {
      return this.rows;
    }
    const start = (this.page - 1) * this.pageSize;
    return this.processedRows.slice(start, start + this.pageSize);
  }

  // Gera a lista de botões numéricos da paginação (LIFT & UX)
  get visiblePages(): (number | string)[] {
    const total = this.pageCount;
    const current = this.page;
    const pages: (number | string)[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) {
        pages.push('...');
      }
      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);
      for (let i = start; i <= end; i++) {
        if (pages.indexOf(i) === -1) pages.push(i);
      }
      if (current < total - 2) {
        pages.push('...');
      }
      if (pages.indexOf(total) === -1) pages.push(total);
    }
    return pages;
  }

  goToPage(p: number | string): void {
    if (typeof p === 'number') {
      this.page = p;
      this.pageChange.emit(this.page);
    }
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
    this.page = 1;
    this.pageChange.emit(this.page);
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

  cellValue(row: any, col: GridColumn): any {
    const val = row?.[col.key];
    if (val && typeof val === 'object') {
      return val.nome || val.label || val.descricao || JSON.stringify(val);
    }
    return val;
  }

  formatCell(row: any, col: GridColumn): string {
    const val = this.cellValue(row, col);
    if (val === undefined || val === null || val === '') return '';

    if (col.type === 'currency') {
      const num = Number(val);
      return !isNaN(num) ? 'R$ ' + num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '';
    }

    if (col.type === 'number') {
      const num = Number(val);
      return !isNaN(num) ? num.toLocaleString('pt-BR') : String(val);
    }

    return String(val);
  }

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