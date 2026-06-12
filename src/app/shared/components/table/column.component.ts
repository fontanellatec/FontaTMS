import { Component, Input, ContentChild, TemplateRef } from '@angular/core';

@Component({
  selector: 'app-column',
  standalone: true,
  template: ''
})
export class ColumnComponent {
  @Input() header: string = '';
  @Input() field: string = '';
  @Input() align: 'left' | 'center' | 'right' = 'left';
  @Input() width: string = '';
  @Input() sortable: string = ''; // Chave de ordenação

  @ContentChild(TemplateRef) cellTemplate?: TemplateRef<any>;
}
