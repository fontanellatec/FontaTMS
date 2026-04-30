import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface FilterConfig {
  type: 'select' | 'date' | 'text' | 'number';
  label: string;
  key: string;
  options?: { value: any; label: string }[];
  placeholder?: string;
  value?: any;
}

@Component({
  selector: 'app-filter-section',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filter-section.component.html',
  styleUrls: ['./filter-section.component.scss']
})
export class FilterSectionComponent {
  @Input() title: string = 'Filtros';
  @Input() filters: FilterConfig[] = [];
  @Input() collapsed: boolean = true;
  @Input() showActionButtons: boolean = true;
  @Input() actionButtonText: string = 'Aplicar Filtros';
  @Input() clearButtonText: string = 'Limpar';

  @Output() filtersChange = new EventEmitter<any>();
  @Output() collapsedChange = new EventEmitter<boolean>();
  @Output() toggleCollapsed = new EventEmitter<boolean>();
  @Output() applyFilters = new EventEmitter<any>();
  @Output() clearFilters = new EventEmitter<void>();

  onToggle() {
    this.collapsed = !this.collapsed;
    this.collapsedChange.emit(this.collapsed);
    this.toggleCollapsed.emit(this.collapsed);
  }

  onFilterChange(filterKey: string, value: any) {
    const filterValues = this.getFilterValues();
    filterValues[filterKey] = value;
    this.filtersChange.emit(filterValues);
  }

  onInputChange(event: Event, filterKey: string) {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    const value = target?.value || '';
    this.onFilterChange(filterKey, value);
  }

  onApplyFilters() {
    const filterValues = this.getFilterValues();
    this.applyFilters.emit(filterValues);
  }

  onClearFilters() {
    this.filters.forEach(filter => {
      filter.value = filter.type === 'select' ? '' : null;
    });
    this.clearFilters.emit();
  }

  private getFilterValues(): any {
    const values: any = {};
    this.filters.forEach(filter => {
      values[filter.key] = filter.value;
    });
    return values;
  }
}