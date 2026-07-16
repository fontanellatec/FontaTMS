import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonComponent, InputTextComponent, InputDateComponent, InputTimeComponent, FormGridComponent, FormGridColumn } from '@shared/components';
import { OutraReceitaRow } from '../../../../models/programacao.model';
import { ProgramacaoService } from '../../../../services/programacao.service';

@Component({
  selector: 'app-outras-receitas-tab',
  templateUrl: './outras-receitas-tab.component.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonComponent,
    InputTextComponent,
    InputDateComponent,
    InputTimeComponent,
    FormGridComponent
  ]
})
export class OutrasReceitasTabComponent {
  private readonly programacaoService = inject(ProgramacaoService);

  @Input() outrasReceitasRows: OutraReceitaRow[] = [];
  @Output() fechar = new EventEmitter<void>();

  columns: FormGridColumn[] = [
    { title: 'Data Emissão', width: '1fr' },
    { title: 'Origem', width: '1fr' },
    { title: 'Destino', width: '1fr' },
    { title: 'Valor', width: '1fr' },
    { title: 'Data Entrega', width: '1fr' },
    { title: 'Hora Entrega', width: '120px' }
  ];

  salvarOR(index: number): void {
    const or = this.outrasReceitasRows[index];
    this.programacaoService.salvarOutraReceita(or.recNumero, or.dataEntrega || '', or.horaEntrega || '').subscribe({
      next: () => console.log('Outra Receita salva com sucesso'),
      error: (err) => console.error('Erro ao salvar outra receita', err)
    });
  }
}
