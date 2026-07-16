import { Component, Input, ContentChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface FormGridColumn {
  title: string;
  width: string;
  align?: 'left' | 'center' | 'right';
}

@Component({
  selector: 'app-form-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './form-grid.component.html',
  styleUrls: ['./form-grid.component.scss']
})
export class FormGridComponent {
  @Input() columns: FormGridColumn[] = [];
  @Input() data: any[] = [];

  @ContentChild(TemplateRef) rowTemplate!: TemplateRef<any>;

  get gridTemplate(): string {
    return this.columns.map(col => col.width).join(' ');
  }
}
