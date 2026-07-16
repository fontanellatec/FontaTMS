import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonComponent, InputTextComponent, CheckboxComponent, FormGridComponent, FormGridColumn } from '@shared/components';
import { PlanoViagemGroup } from '../../../../models/programacao.model';
import { ProgramacaoService } from '../../../../services/programacao.service';

@Component({
  selector: 'app-conhecimentos-tab',
  templateUrl: './conhecimentos-tab.component.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonComponent,
    InputTextComponent,
    CheckboxComponent,
    FormGridComponent
  ]
})
export class ConhecimentosTabComponent {
  private readonly programacaoService = inject(ProgramacaoService);

  @Input() pvGroups: PlanoViagemGroup[] = [];

  columns: FormGridColumn[] = [
    { title: 'Conhecimento', width: '0.9fr' },
    { title: 'Armazém Previsão', width: '1fr' },
    { title: 'Forma Entrega', width: '1fr' },
    { title: 'Data Entrega', width: '1fr' },
    { title: 'Armazém', width: '1fr' },
    { title: 'Observação', width: '2fr' },
    { title: 'Ação', width: '40px', align: 'center' }
  ];

  salvarGrupo(idx: number): void {
    const grupo = this.pvGroups[idx];
    console.log('Salvar grupo (via ConhecimentosTab)', grupo);
    // Aqui você pode estender chamando o programacaoService se houver endpoint futuro
  }

  removerConhecimento(pvIdx: number, conIdx: number): void {
    const pv = this.pvGroups[pvIdx];
    if (pv && pv.conhecimentos) {
      pv.conhecimentos.splice(conIdx, 1);
      console.log('Conhecimento removido. PV atualizado:', pv);
    }
  }
}
