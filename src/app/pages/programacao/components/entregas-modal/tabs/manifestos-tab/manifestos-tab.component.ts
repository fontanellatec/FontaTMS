import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent, FormGridComponent, FormGridColumn } from '@shared/components';
import { ManifestoGroup } from '../../../../models/programacao.model';

@Component({
  selector: 'app-manifestos-tab',
  templateUrl: './manifestos-tab.component.html',
  standalone: true,
  imports: [
    CommonModule,
    ButtonComponent,
    FormGridComponent
  ]
})
export class ManifestosTabComponent {
  @Input() manifestosGroups: ManifestoGroup[] = [];
  @Output() encerrar = new EventEmitter<{ i: number; j: number }>();
  @Output() cancelar = new EventEmitter<{ i: number; j: number }>();
  @Output() imprimir = new EventEmitter<{ i: number; j: number }>();
  @Output() fechar = new EventEmitter<void>();

  columns: FormGridColumn[] = [
    { title: 'Manifesto', width: '0.9fr' },
    { title: 'Data Emissão', width: '1fr' },
    { title: 'Origem', width: '1fr' },
    { title: 'Destino', width: '1fr' },
    { title: 'Status', width: '0.9fr' },
    { title: 'Encerrar', width: '40px', align: 'center' },
    { title: 'Cancelar', width: '40px', align: 'center' },
    { title: 'Imprimir', width: '40px', align: 'center' }
  ];
}
