import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonComponent, InputTextComponent, InputDateComponent, InputTimeComponent, FormGridComponent, FormGridColumn } from '@shared/components';
import { PlanoViagemRow } from '../../../../models/programacao.model';
import { ProgramacaoService } from '../../../../services/programacao.service';

@Component({
  selector: 'app-plano-viagem-tab',
  templateUrl: './plano-viagem-tab.component.html',
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
export class PlanoViagemTabComponent {
  private readonly programacaoService = inject(ProgramacaoService);

  @Input() planoViagemRows: PlanoViagemRow[] = [];
  @Output() fechar = new EventEmitter<void>();

  columns: FormGridColumn[] = [
    { title: 'Data Emissão', width: '1fr' },
    { title: 'Origem', width: '1fr' },
    { title: 'Destino', width: '1fr' },
    { title: 'Valor', width: '1fr' },
    { title: 'Data Entrega', width: '1fr' },
    { title: 'Hora Entrega', width: '120px' }
  ];

  salvarPV(index: number): void {
    const pv = this.planoViagemRows[index];
    this.programacaoService.salvarPlanoViagem(pv.pvNumero, pv.dataEntrega || '', pv.horaEntrega || '').subscribe({
      next: () => console.log('Plano de Viagem salvo com sucesso'),
      error: (err) => console.error('Erro ao salvar plano de viagem', err)
    });
  }
}
