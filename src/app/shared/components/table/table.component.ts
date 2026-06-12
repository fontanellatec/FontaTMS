import { Component, Input, Output, EventEmitter, ContentChildren, QueryList, AfterContentInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ColumnComponent } from './column.component';
import { ButtonComponent } from '../common/button/button.component';

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss']
})
export class TableComponent implements AfterContentInit {
  @Input() data: any[] = [];
  
  // Controle de paginação
  @Input() page: number = 1;
  @Input() pageSize: number = 10;
  @Input() pageSizeOptions: number[] = [10, 25, 50];

  // Configuração visual
  @Input() bodyMaxHeight: string | null = '560px';

  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();
  @Output() sortChange = new EventEmitter<{ key: string; dir: 'asc' | 'desc' }>();
  @Output() rowClick = new EventEmitter<any>();

  @ContentChildren(ColumnComponent) columns!: QueryList<ColumnComponent>;

  sortKey: string | null = null;
  sortDir: 'asc' | 'desc' = 'asc';

  ngAfterContentInit() {
    // Colunas carregadas via ContentChildren
  }

  get pageCount(): number {
    return Math.ceil(this.data.length / this.pageSize) || 1;
  }

  get pagedData(): any[] {
    const start = (this.page - 1) * this.pageSize;
    return this.data.slice(start, start + this.pageSize);
  }

  onSort(col: ColumnComponent) {
    if (!col.sortable) return;
    
    if (this.sortKey === col.sortable) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = col.sortable;
      this.sortDir = 'asc';
    }
    
    this.sortChange.emit({ key: this.sortKey, dir: this.sortDir });
  }

  setPageSize(size: any) {
    const numericSize = Number(size);
    this.pageSize = numericSize;
    this.pageSizeChange.emit(numericSize);
    this.setPage(1);
  }

  setPage(p: number) {
    if (p >= 1 && p <= this.pageCount) {
      this.page = p;
      this.pageChange.emit(p);
    }
  }

  onRowClick(row: any) {
    this.rowClick.emit(row);
  }

  getFieldValue(row: any, field: string): any {
    if (!field) return '';
    return row[field];
  }
}
