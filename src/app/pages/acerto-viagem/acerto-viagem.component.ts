import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ItemDetalhe {
  id: string;
  data: string;
  tipo?: string;
  descricao?: string;
  litros?: number;
  local?: string;
  valor: number;
  checked: boolean;
}

interface Registro {
  numero: string;
  inicioAcerto: string;
  fimAcerto: string;
  veiculo: string;
  motorista: string;
  gestor?: string;
  receita: number;
  abastecimento: number;
  despesas: number;
  adiantamentos: number;
  pedagios: number;
  danoPatrimonial: number;
  bonus: number;
  concluido: boolean;
  finalizado: boolean;
  itensReceita: ItemDetalhe[];
  itensAbastecimento: ItemDetalhe[];
  itensDespesa: ItemDetalhe[];
  itensAdiantamento: ItemDetalhe[];
  itensPedagio: ItemDetalhe[];
  itensDanoPatrimonial: ItemDetalhe[];
  itensBonus: ItemDetalhe[];
}

@Component({
  selector: 'app-acerto-viagem',
  templateUrl: './acerto-viagem.component.html',
  styleUrls: ['./acerto-viagem.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class AcertoViagemComponent {
  Math = Math;

  // Filtros
  periodoDe = '';
  periodoAte = '';
  inicioDe = '';
  inicioAte = '';
  fimDe = '';
  fimAte = '';
  filtroNumero = '';
  filtroPlaca = '';
  filtroMotorista = '';
  filtroGestor = '';

  // Paginação
  page = 1;
  pageSizeOptions = [10, 25, 50];
  pageSize = 10;
  pageCount = 1;
  paged: Registro[] = [];

  // Dados
  dados: Registro[] = [];
  filtered: Registro[] = [];

  // Modal
  modalOpen = false;
  modalType: 'receita' | 'abastecimento' | 'despesa' | 'adiantamento' | 'pedagio' | 'danoPatrimonial' | 'bonus' | null = null;
  modalTitle = '';
  modalItems: ItemDetalhe[] = [];
  modalRegistro: Registro | null = null;

  // Propriedades para notificação
  notificacao: { mensagem: string; tipo: 'success' | 'error' | 'info'; visivel: boolean } = {
    mensagem: '',
    tipo: 'info',
    visivel: false
  };

  // Modal de confirmação para concluir
  modalConcluirOpen = false;
  registroParaConcluir: Registro | null = null;

  // Configuração dinâmica do modal
  modalMidLabel: string = 'Tipo';
  modalColumnsTemplate: string = '40px 1fr 2fr 1fr';
  modalShowLitros: boolean = false;

  constructor() {
    this.dados = this.criarMocks(35);
    this.filtered = [...this.dados];
    this.atualizarPaginacao();
  }

  // Helpers de mock
  private formatDate(d: Date): string {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  private criarItem(id: string, data: Date, tipo: string, valor: number): ItemDetalhe {
    return { id, data: this.formatDate(data), tipo, valor, checked: true };
  }

  private mockItens(prefixo: string, qtd: number, baseValor: number, baseDate: Date, tipos: string[]): ItemDetalhe[] {
    const itens: ItemDetalhe[] = [];
    for (let i = 0; i < qtd; i++) {
      const dia = new Date(baseDate);
      dia.setDate(baseDate.getDate() + i);
      const variacao = (i % 3) * (baseValor * 0.04);
      const tipo = tipos[i % tipos.length];
      itens.push(this.criarItem(`${prefixo}-${i+1}`, dia, tipo, +(baseValor + variacao).toFixed(2)));
    }
    return itens;
  }

  soma(itens: ItemDetalhe[] | undefined): number { return (itens || []).reduce((acc, it) => acc + it.valor, 0); }

  private criarMocks(qtd: number): Registro[] {
    const res: Registro[] = [];
    for (let i = 0; i < qtd; i++) {
      const num = (5238 - i).toString();
      const inicio = this.formatDate(new Date(2024, 5, 1 + i));
      const fim = this.formatDate(new Date(2024, 5, 3 + i));
      const motorista = [
        'Vinícius Melo', 'Camila Rocha', 'Marcelo Dias', 'Juliana Alves', 'Eduardo Ramos',
        'Patrícia Souza', 'Lucas Martins', 'Fernanda Lima', 'Bruno Costa', 'Ana Paula'
      ][i % 10];
      const veiculo = ['QSR567', 'NOP3456', 'KLM345', 'HU2034', 'BCD0M12', 'WDAK8K0', 'STU789', 'MN0S567', 'XKJ456', 'GH1234'][i % 10];

      // base dates por tipo (apenas representativo)
      const baseReceita = new Date(2024, 5, 28 + (i % 3));
      const baseAbastecimento = new Date(2024, 5, 28 + (i % 4));
      const baseDespesa = new Date(2024, 5, 27 + (i % 2));
      const baseAdiantamento = new Date(2024, 5, 29);
      const basePedagio = new Date(2024, 5, 30);
      const baseDano = new Date(2024, 5, 26);
      const baseBonus = new Date(2024, 6, 1);

      let itensReceita = this.mockItens('Receita', 4, 4000, baseReceita, ['Plano de Viagem','Conhecimento','Outras Receitas','Receita Manual']);
      let itensAbastecimento = this.mockItens('Abastecimento', 3, 800, baseAbastecimento, ['DIESEL','ARLA 32','DIESEL']);
      let itensDespesa = this.mockItens('Despesa', 3, 560, baseDespesa, ['Troca de óleo','Lavagem','Manutenção']);
      let itensAdiantamento = this.mockItens('Adiantamento', 2, 720, baseAdiantamento, ['Pagamento de chapa','Descarregamento']);
      let itensPedagio = this.mockItens('Pedágio', 2, 140, basePedagio, ['Pedágio SP','Pedágio RJ']);
      let itensDanoPatrimonial = this.mockItens('Dano', 2, 380, baseDano, ['Avaria cabine','Para-brisa']);
      let itensBonus = this.mockItens('Bônus', 2, 220, baseBonus, ['Pontualidade','Economia combustível']);

      // Ajustes por tipo para colunas dinâmicas
      const litrosVals = [150, 180, 210];
      itensAbastecimento = itensAbastecimento.map((it, idx) => ({ ...it, litros: litrosVals[idx % litrosVals.length] }));
      itensDespesa = itensDespesa.map((it) => ({ ...it, descricao: it.tipo, tipo: undefined }));
      itensAdiantamento = itensAdiantamento.map((it) => ({ ...it, descricao: it.tipo, tipo: undefined }));
      itensPedagio = itensPedagio.map((it) => ({ ...it, local: it.tipo, tipo: undefined }));
      itensDanoPatrimonial = itensDanoPatrimonial.map((it) => ({ ...it, descricao: it.tipo, tipo: undefined }));
      itensBonus = itensBonus.map((it) => ({ ...it, descricao: it.tipo, tipo: undefined }));

      res.push({
        numero: num,
        inicioAcerto: inicio,
        fimAcerto: fim,
        veiculo,
        motorista,
        gestor: 'Gestor Padrão',
        receita: +this.soma(itensReceita).toFixed(2),
        abastecimento: +this.soma(itensAbastecimento).toFixed(2),
        despesas: +this.soma(itensDespesa).toFixed(2),
        adiantamentos: +this.soma(itensAdiantamento).toFixed(2),
        pedagios: +this.soma(itensPedagio).toFixed(2),
        danoPatrimonial: +this.soma(itensDanoPatrimonial).toFixed(2),
        bonus: +this.soma(itensBonus).toFixed(2),
        concluido: i % 2 === 0,
        finalizado: i % 3 === 0,
        itensReceita,
        itensAbastecimento,
        itensDespesa,
        itensAdiantamento,
        itensPedagio,
        itensDanoPatrimonial,
        itensBonus,
      });
    }
    return res;
  }

  // Ações de tabela// Ações
  toggleConcluir(r: Registro) { r.concluido = !r.concluido; }
  
  // Método para mostrar notificação
  mostrarNotificacao(mensagem: string, tipo: 'success' | 'error' | 'info') {
    this.notificacao = { mensagem, tipo, visivel: true };
    setTimeout(() => {
      this.notificacao.visivel = false;
    }, 3000);
  }

  abrirModalConcluir(r: Registro) {
    this.registroParaConcluir = r;
    this.modalConcluirOpen = true;
  }

  fecharModalConcluir() {
    this.modalConcluirOpen = false;
    this.registroParaConcluir = null;
  }

  confirmarConcluir() {
    if (this.registroParaConcluir) {
      // Adiciona feedback visual
      const button = document.querySelector('.btn-success') as HTMLButtonElement;
      if (button) {
        button.disabled = true;
        button.innerHTML = `
          <svg class="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 2a10 10 0 0 1 10 10"/>
          </svg>
          Processando...
        `;
      }

      // Simula processamento
      setTimeout(() => {
        if (this.registroParaConcluir) {
          // Marca como "Para Concluir" na tela
          this.registroParaConcluir.concluido = true;
          
          // Notificação de sucesso
          this.mostrarNotificacao('Concluído com sucesso.', 'success');
        }
        this.fecharModalConcluir();
      }, 1000);
    }
  }  toggleFinalizar(r: Registro) { r.finalizado = !r.finalizado; }
  gerarDocumento(r: Registro) { console.log('Gerar documento para', r.numero); }

  // Filtros
  pesquisar() {
    const periodoIni = this.parseDate(this.periodoDe);
    const periodoFim = this.parseDate(this.periodoAte);
    const inicioIni = this.parseDate(this.inicioDe);
    const inicioFim = this.parseDate(this.inicioAte);
    const fimIni = this.parseDate(this.fimDe);
    const fimFim = this.parseDate(this.fimAte);

    this.filtered = this.dados.filter(d => {
      const dInicio = this.parseDate(d.inicioAcerto)!;
      const dFim = this.parseDate(d.fimAcerto)!;

      const inPeriodo = (!periodoIni || dInicio >= periodoIni) && (!periodoFim || dFim <= periodoFim);
      const inInicio = (!inicioIni || dInicio >= inicioIni) && (!inicioFim || dInicio <= inicioFim);
      const inFim = (!fimIni || dFim >= fimIni) && (!fimFim || dFim <= fimFim);

      const textoOk = (
        (!this.filtroNumero || d.numero.includes(this.filtroNumero)) &&
        (!this.filtroPlaca || d.veiculo.toLowerCase().includes(this.filtroPlaca.toLowerCase())) &&
        (!this.filtroMotorista || d.motorista.toLowerCase().includes(this.filtroMotorista.toLowerCase())) &&
        (!this.filtroGestor || (d.gestor || '').toLowerCase().includes(this.filtroGestor.toLowerCase()))
      );

      return inPeriodo && inInicio && inFim && textoOk;
    });

    this.page = 1;
    this.atualizarPaginacao();
  }

  // Paginação
  setPageSize(size: number) { this.pageSize = +size; this.page = 1; this.atualizarPaginacao(); }
  prevPage() { if (this.page > 1) { this.page--; this.atualizarPaginacao(); } }
  nextPage() { if (this.page < this.pageCount) { this.page++; this.atualizarPaginacao(); } }

  private atualizarPaginacao() {
    this.pageCount = Math.max(1, Math.ceil(this.filtered.length / this.pageSize));
    const start = (this.page - 1) * this.pageSize;
    this.paged = this.filtered.slice(start, start + this.pageSize);
  }

  // Modal
  abrirModal(tipo: 'receita' | 'abastecimento' | 'despesa' | 'adiantamento' | 'pedagio' | 'danoPatrimonial' | 'bonus', r: Registro) {
    this.modalRegistro = r;
    this.modalType = tipo;
    const titulos: Record<string, string> = {
      receita: 'Receitas do Período',
      abastecimento: 'Abastecimentos do Período',
      despesa: 'Despesas do Período',
      adiantamento: 'Adiantamentos do Período',
      pedagio: 'Pedágios do Período',
      danoPatrimonial: 'Danos Patrimoniais do Período',
      bonus: 'Bônus do Período',
    };
    this.modalTitle = `${titulos[tipo]} • Acerto ${r.numero}`;

    // Configura colunas dinâmicas
    this.modalShowLitros = tipo === 'abastecimento';
    this.modalMidLabel = tipo === 'pedagio'
      ? 'Local'
      : (tipo === 'despesa' || tipo === 'adiantamento' || tipo === 'danoPatrimonial' || tipo === 'bonus')
        ? 'Descrição'
        : 'Tipo';
    this.modalColumnsTemplate = this.modalShowLitros ? '40px 1fr 2fr 0.8fr 1fr' : '40px 1fr 2fr 1fr';

    this.modalItems = this.getItemsByType(r, tipo).map(it => ({ ...it, checked: true }));
    // Evita clique inicial fechar o modal imediatamente via backdrop
    setTimeout(() => { this.modalOpen = true; }, 0);
  }

  confirmarModal() {
    this.modalOpen = false;
    this.modalRegistro = null;
    this.modalItems = [];
    this.modalType = null;
  }

  fecharModal() {
    this.modalOpen = false;
    this.modalRegistro = null;
    this.modalItems = [];
    this.modalType = null;
  }

  trackById(_i: number, item: ItemDetalhe) { return item.id; }

  getMidValue(item: ItemDetalhe): string | number {
    switch (this.modalType) {
      case 'receita':
      case 'abastecimento':
        return item.tipo || '';
      case 'pedagio':
        return item.local || '';
      case 'despesa':
      case 'adiantamento':
      case 'danoPatrimonial':
      case 'bonus':
        return item.descricao || '';
      default:
        return '';
    }
  }

  private getItemsByType(r: Registro, tipo: string): ItemDetalhe[] {
    switch (tipo) {
      case 'receita': return r.itensReceita;
      case 'abastecimento': return r.itensAbastecimento;
      case 'despesa': return r.itensDespesa;
      case 'adiantamento': return r.itensAdiantamento;
      case 'pedagio': return r.itensPedagio;
      case 'danoPatrimonial': return r.itensDanoPatrimonial;
      case 'bonus': return r.itensBonus;
      default: return [];
    }
  }

  // Util
  formatMoney(v: number): string { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }

  private parseDate(val?: string): Date | null {
    if (!val) return null;
    const m = val.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (!m) return null;
    const d = new Date(+m[3], +m[2] - 1, +m[1]);
    return isNaN(d.getTime()) ? null : d;
  }

  exportCSV() { console.log('Export CSV'); }
  printList() { window.print(); }
 
  // Modal de finalização
  modalFinalizarOpen = false;
  registroParaFinalizar: Registro | null = null;
  justificativas: Record<string, string> = {};
  novoBonusTipo: string = 'Bônus';
  novoBonusDescricao: string = '';
  novoBonusValor: number | null = null;
 
  abrirModalFinalizar(r: Registro) {
    this.registroParaFinalizar = r;
    this.modalFinalizarOpen = true;
  }
 
  fecharModalFinalizar() {
    this.modalFinalizarOpen = false;
    this.registroParaFinalizar = null;
    this.novoBonusTipo = 'Bônus';
    this.novoBonusDescricao = '';
    this.novoBonusValor = null;
  }
 
  adicionarBonus() {
    if (!this.registroParaFinalizar) return;
    const valor = Number(this.novoBonusValor || 0);
    if (!valor) return;
    const id = 'bonus-' + Date.now() + '-' + Math.random().toString(36).slice(2);
    this.registroParaFinalizar.itensBonus.push({
      id,
      data: new Date().toLocaleDateString('pt-BR'),
      tipo: this.novoBonusTipo || 'Bônus',
      descricao: this.novoBonusDescricao || this.novoBonusTipo || 'Bônus',
      valor,
      checked: true
    });
    this.novoBonusDescricao = '';
    this.novoBonusValor = null;
  }
 
  confirmarFinalizar() {
    if (this.registroParaFinalizar) {
      const button = document.querySelector('.modal-backdrop .btn.btn-success') as HTMLButtonElement;
      if (button) {
        button.disabled = true;
        button.innerHTML = `
          <svg class="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 2a10 10 0 0 1 10 10"/>
          </svg>
          Processando...
        `;
      }
      setTimeout(() => {
        if (this.registroParaFinalizar) {
          this.registroParaFinalizar.finalizado = true;
          this.mostrarNotificacao('Finalizado com sucesso.', 'success');
        }
        this.fecharModalFinalizar();
      }, 800);
    }
  }
 }