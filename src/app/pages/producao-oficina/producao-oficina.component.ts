import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Estrutura inspirada na imagem do ERP
type StatusBadge = 'ok' | 'pendente' | 'alerta' | 'aprovado';
type CellState = 'empty' | 'blue' | 'orange' | 'green' | 'star' | 'x';

interface Etapas {
  cav: CellState; pn: CellState; ras: CellState; al: CellState; lav: CellState; pint: CellState; cq: CellState; car: CellState; pn2: CellState; lav2: CellState; ta: CellState; lo: CellState;
}

interface ProducaoRow {
  selected?: boolean;
  frota: number | string;
  placa: string;
  tipoConjuntoVeiculo: string;
  observacao?: string;
  tipo: 'MANUTENCAO' | 'Outros';
  oficina?: string;
  situacaoVeiculo?: string;
  data: string; // dd/MM/yyyy
  dias: number;
  prazo: string; // dd/MM/yyyy
  situacao: StatusBadge[];
  prioridade: 'Baixa' | 'Média' | 'Alta';
  finalizado?: boolean;
  etapas: Etapas;
}

@Component({
  selector: 'app-producao-oficina',
  templateUrl: './producao-oficina.component.html',
  styleUrls: ['./producao-oficina.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class ProducaoOficinaComponent {
  Math = Math;

  // Abas (como no ERP): Principal, Prioridade, Concluído
  activeTab: 'principal' | 'prioridade' | 'concluido' = 'principal';

  // Filtros (conforme imagem ERP)
  fDataEntrada = '';
  fPrazo = '';
  fFrota = '';
  fPlaca = '';
  fTipo: 'Todos' | 'MANUTENCAO' | 'Outros' = 'Todos';
  fSituacaoVeiculo = '';
  fSituacao: 'Todos' | StatusBadge = 'Todos';
  fTipoConjuntoVeiculo = '';
  fDescricao = '';
  fOficina = '';

  // Opções dinamicamente derivadas dos dados
  get tipoConjuntoOptions(): string[] {
    return Array.from(new Set(this.rows.map(r => r.tipoConjuntoVeiculo))).sort();
  }
  get oficinasOptions(): string[] {
    return Array.from(new Set(this.rows.map(r => r.oficina || ''))).filter(Boolean).sort();
  }
  get situacaoOptions(): ("Todos" | StatusBadge)[] {
    return ['Todos', 'ok', 'pendente', 'alerta', 'aprovado'];
  }
  get tipoOptions(): ('Todos' | 'MANUTENCAO' | 'Outros')[] {
    return ['Todos', 'MANUTENCAO', 'Outros'];
  }
  get situacaoVeiculoOptions(): string[] {
    return Array.from(new Set(this.rows.map(r => r.situacaoVeiculo || ''))).filter(Boolean).sort();
  }

  rows: ProducaoRow[] = [
    { frota: 1714, placa: 'SUA3F80 - QIP7231', tipoConjuntoVeiculo: 'RODOTREM 25M', observacao: '', tipo: 'MANUTENCAO', oficina: 'CRICIUMA', situacaoVeiculo: 'Na oficina', data: '17/10/2025', dias: 1, prazo: '24/10/2025', situacao: ['alerta','ok'], prioridade: 'Média', finalizado: false, etapas: { cav:'blue', pn:'orange', ras:'blue', al:'blue', lav:'blue', pint:'blue', cq:'blue', car:'orange', pn2:'blue', lav2:'blue', ta:'blue', lo:'green' }},
    { frota: 1355, placa: 'RYE0F30 - RYB9C78', tipoConjuntoVeiculo: 'RODOTREM SIDER', observacao: '', tipo: 'MANUTENCAO', oficina: 'CRICIUMA', situacaoVeiculo: 'Na oficina', data: '17/10/2025', dias: 1, prazo: '24/10/2025', situacao: ['ok'], prioridade: 'Alta', finalizado: false, etapas: { cav:'blue', pn:'blue', ras:'blue', al:'blue', lav:'blue', pint:'blue', cq:'blue', car:'orange', pn2:'blue', lav2:'blue', ta:'blue', lo:'green' }},
    { frota: 1653, placa: 'RYL4F30 - SXD9G62', tipoConjuntoVeiculo: 'CARRETA 6 EIXOS', observacao: '', tipo: 'MANUTENCAO', oficina: 'CRICIUMA', situacaoVeiculo: 'Na oficina', data: '17/10/2025', dias: 1, prazo: '24/10/2025', situacao: ['ok'], prioridade: 'Média', finalizado: false, etapas: { cav:'blue', pn:'blue', ras:'blue', al:'blue', lav:'blue', pint:'blue', cq:'blue', car:'orange', pn2:'blue', lav2:'orange', ta:'blue', lo:'green' }},
    { frota: 1318, placa: 'RXT6F30 - QJR3708', tipoConjuntoVeiculo: 'RODOTREM 30M', observacao: '', tipo: 'MANUTENCAO', oficina: 'CRICIUMA', situacaoVeiculo: 'Na oficina', data: '17/10/2025', dias: 1, prazo: '24/10/2025', situacao: ['alerta'], prioridade: 'Alta', finalizado: false, etapas: { cav:'blue', pn:'blue', ras:'blue', al:'blue', lav:'blue', pint:'blue', cq:'blue', car:'orange', pn2:'blue', lav2:'blue', ta:'blue', lo:'green' }},
    { frota: 1396, placa: 'RYM9F30 - RYA1B73', tipoConjuntoVeiculo: 'CARRETA 7 EIXOS', observacao: 'CWS', tipo: 'MANUTENCAO', oficina: 'CRICIUMA', situacaoVeiculo: 'Na oficina', data: '17/10/2025', dias: 1, prazo: '24/10/2025', situacao: ['ok'], prioridade: 'Baixa', finalizado: false, etapas: { cav:'blue', pn:'blue', ras:'blue', al:'blue', lav:'blue', pint:'blue', cq:'blue', car:'orange', pn2:'blue', lav2:'blue', ta:'blue', lo:'green' }},
    { frota: 915, placa: 'QJR9D40 - QIP3328', tipoConjuntoVeiculo: 'RODOTREM SIDER', observacao: '', tipo: 'MANUTENCAO', oficina: 'CRICIUMA', situacaoVeiculo: 'Na oficina', data: '17/10/2025', dias: 1, prazo: '24/10/2025', situacao: ['ok'], prioridade: 'Média', finalizado: false, etapas: { cav:'blue', pn:'blue', ras:'blue', al:'blue', lav:'blue', pint:'blue', cq:'blue', car:'orange', pn2:'blue', lav2:'blue', ta:'blue', lo:'green' }},
    { frota: 1039, placa: 'RKW7D10 - RAF4739', tipoConjuntoVeiculo: 'RODOTREM 30M', observacao: '', tipo: 'MANUTENCAO', oficina: 'CRICIUMA', situacaoVeiculo: 'Na oficina', data: '17/10/2025', dias: 1, prazo: '24/10/2025', situacao: ['ok'], prioridade: 'Média', finalizado: false, etapas: { cav:'blue', pn:'blue', ras:'blue', al:'blue', lav:'blue', pint:'blue', cq:'blue', car:'orange', pn2:'blue', lav2:'blue', ta:'blue', lo:'green' }},
    { frota: 1675, placa: 'RYL6F70 - MML0B94', tipoConjuntoVeiculo: 'RODOTREM SIDER', observacao: '', tipo: 'MANUTENCAO', oficina: 'CRICIUMA', situacaoVeiculo: 'Na oficina', data: '17/10/2025', dias: 1, prazo: '24/10/2025', situacao: ['ok'], prioridade: 'Média', finalizado: false, etapas: { cav:'blue', pn:'blue', ras:'blue', al:'blue', lav:'blue', pint:'blue', cq:'blue', car:'orange', pn2:'blue', lav2:'orange', ta:'blue', lo:'green' }}
  ];

  // Filtro por aba + filtros da barra
  get filtered(): ProducaoRow[] {
    let data = this.rows;
    // Aplicar filtros
    const qData = this.fDataEntrada.trim().toLowerCase();
    const qPrazo = this.fPrazo.trim().toLowerCase();
    const qFrota = this.fFrota.trim().toLowerCase();
    const qPlaca = this.fPlaca.trim().toLowerCase();
    const qTipoCv = this.fTipoConjuntoVeiculo.trim().toLowerCase();
    const qDesc = this.fDescricao.trim().toLowerCase();
    const qOficina = this.fOficina.trim().toLowerCase();
    const qSitVeh = this.fSituacaoVeiculo.trim().toLowerCase();

    if (qData) data = data.filter(r => (r.data || '').toLowerCase().includes(qData));
    if (qPrazo) data = data.filter(r => (r.prazo || '').toLowerCase().includes(qPrazo));
    if (qFrota) data = data.filter(r => String(r.frota).toLowerCase().includes(qFrota));
    if (qPlaca) data = data.filter(r => r.placa.toLowerCase().includes(qPlaca));
    if (this.fTipo !== 'Todos') data = data.filter(r => r.tipo === this.fTipo);
    if (this.fSituacao !== 'Todos') data = data.filter(r => r.situacao.includes(this.fSituacao as StatusBadge));
    if (qTipoCv) data = data.filter(r => r.tipoConjuntoVeiculo.toLowerCase().includes(qTipoCv));
    if (qDesc) data = data.filter(r => (r.observacao || '').toLowerCase().includes(qDesc));
    if (qOficina) data = data.filter(r => (r.oficina || '').toLowerCase().includes(qOficina));
    if (qSitVeh) data = data.filter(r => (r.situacaoVeiculo || '').toLowerCase().includes(qSitVeh));

    if (this.activeTab === 'prioridade') {
      // Mostrar apenas linhas marcadas (checkadas)
      return data.filter(r => !!r.selected);
    }
    if (this.activeTab === 'concluido') {
      return data.filter(r => r.finalizado);
    }
    // Aba principal: todos, com os checkados primeiro
    return data.slice().sort((a, b) => Number(!!b.selected) - Number(!!a.selected));
  }

  // Paginação simples
  page = 1;
  pageSize = 25;
  pageSizeOptions = [25, 50, 250];

  get paged(): ProducaoRow[] {
    const data = this.filtered;
    const start = (this.page - 1) * this.pageSize;
    return data.slice(start, start + this.pageSize);
  }
  get pageCount(): number {
    const total = this.filtered.length;
    return Math.max(1, Math.ceil(total / this.pageSize));
  }
  nextPage(): void { if (this.page < this.pageCount) this.page++; }
  prevPage(): void { if (this.page > 1) this.page--; }
  firstPage(): void { this.page = 1; }
  lastPage(): void { this.page = this.pageCount; }

  // Ações
  pesquisar(): void { /* filtros são reativos; semântica do botão */ }
  limparFiltros(): void {
    this.fDataEntrada = '';
    this.fPrazo = '';
    this.fFrota = '';
    this.fPlaca = '';
    this.fTipo = 'Todos';
    this.fSituacaoVeiculo = '';
    this.fSituacao = 'Todos';
    this.fTipoConjuntoVeiculo = '';
    this.fDescricao = '';
    this.fOficina = '';
  }

  // Máscara de data dd/MM/aaaa e integração com datepicker nativo
  private maskDate(value: string): string {
    const digits = (value || '').replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  }

  onDateInput(field: 'fDataEntrada' | 'fPrazo', ev: Event): void {
    const target = ev.target as HTMLInputElement;
    (this as any)[field] = this.maskDate(target.value);
  }

  onNativeDateChange(field: 'fDataEntrada' | 'fPrazo', value: string): void {
    if (!value) { (this as any)[field] = ''; return; }
    const [yyyy, mm, dd] = value.split('-');
    (this as any)[field] = `${dd}/${mm}/${yyyy}`;
  }

  // Classes para células de etapas
  etapaClass(state: CellState): string {
    switch (state) {
      case 'blue': return 'cell blue';
      case 'orange': return 'cell orange';
      case 'green': return 'cell green';
      case 'star': return 'cell star';
      case 'x': return 'cell x';
      default: return 'cell';
    }
  }
  // Controle de modal de situação
  modalOpen = false;
  modalRow: ProducaoRow | null = null;
  modalCodigoProducaoOficina = '008201';

  // Paginação da modal
  modalPage = 1;
  modalPageSize = 100;
  modalPageSizeOptions = [10, 25, 50, 100];

  private stateToStatus(state: CellState): { text: string; color: 'blue' | 'orange' | 'green' | 'gray' | 'red'; star: boolean } {
    switch (state) {
      case 'blue': return { text: 'Nova', color: 'blue', star: false };
      case 'orange': return { text: 'Execução', color: 'orange', star: false };
      case 'green': return { text: 'Concluída', color: 'green', star: false };
      case 'star': return { text: 'Execução', color: 'orange', star: true };
      case 'x': return { text: 'Cancelada', color: 'red', star: false };
      default: return { text: '—', color: 'gray', star: false };
    }
  }

  private buildModalItems(row: ProducaoRow): Array<{ frota: number | string; placa: string; os: string; data: string; setor: string; tipo: 'Tração' | 'Reboque'; oficina: string; statusText: string; statusColor: string; star: boolean }> {
    const baseOs = 771640;
    const items: any[] = [];
    const placaCod = (row.placa || '').split(' - ')[0] || row.placa;
    const pushItem = (setor: string, tipo: 'Tração' | 'Reboque', state: CellState, idx: number) => {
      const st = this.stateToStatus(state);
      items.push({
        frota: row.frota,
        placa: placaCod,
        os: String(baseOs + idx),
        data: row.data,
        setor,
        tipo,
        oficina: row.oficina || '',
        statusText: st.text,
        statusColor: st.color,
        star: st.star
      });
    };
    // Ordem conforme o print
    pushItem('LAVAÇÃO', 'Tração', row.etapas.lav, 7);
    pushItem('CAVALO / MECÂNICA', 'Tração', row.etapas.cav, 9);
    pushItem('PNEUS', 'Tração', row.etapas.pn, 10);
    pushItem('RASTREAMENTO', 'Tração', row.etapas.ras, 11);
    pushItem('CONTROLE DE QUALIDADE', 'Tração', row.etapas.cq, 12);
    pushItem('PINTURA', 'Tração', row.etapas.pint, 13);
    pushItem('LAVAÇÃO', 'Reboque', row.etapas.lav2, 14);
    pushItem('CARRETA / MECÂNICA', 'Reboque', row.etapas.car, 15);
    pushItem('PNEUS', 'Reboque', row.etapas.pn2, 16);
    pushItem('LONA', 'Reboque', row.etapas.ta, 17);
    pushItem('CHECKLIST', 'Tração', row.etapas.lo, 18);
    return items;
  }

  get modalItems(): any[] {
    if (!this.modalRow) return [];
    return this.buildModalItems(this.modalRow);
  }
  get modalItemsPaged(): any[] {
    const data = this.modalItems;
    const start = (this.modalPage - 1) * this.modalPageSize;
    return data.slice(start, start + this.modalPageSize);
  }
  get modalItemsPageCount(): number {
    const total = this.modalItems.length;
    return Math.max(1, Math.ceil(total / this.modalPageSize));
  }
  modalNextPage(): void { if (this.modalPage < this.modalItemsPageCount) this.modalPage++; }
  modalPrevPage(): void { if (this.modalPage > 1) this.modalPage--; }
  modalFirstPage(): void { this.modalPage = 1; }
  modalLastPage(): void { this.modalPage = this.modalItemsPageCount; }

  primaryStatus(row: ProducaoRow): StatusBadge | null {
    if (!row?.situacao || row.situacao.length === 0) return null;
    const order: StatusBadge[] = ['alerta', 'pendente', 'aprovado', 'ok'];
    for (const s of order) if (row.situacao.includes(s)) return s;
    return row.situacao[0] || null;
  }

  openSituacaoModal(row: ProducaoRow): void {
    this.modalRow = row;
    this.modalOpen = true;
    this.modalPage = 1;
    this.modalPageSize = 100;
    this.modalCodigoProducaoOficina = '008201';
  }

  closeModal(): void {
    this.modalOpen = false;
    this.modalRow = null;
  }

  // Modal de edição de célula (data/observação)
  editOpen = false;
  editType: 'prazo' | 'observacao' | 'tipo' | null = null;
  editRow: ProducaoRow | null = null;
  editDateMasked = '';
  editObsText = '';
  editTipo: 'MANUTENCAO' | 'Outros' | '' = '';

  openEdit(row: ProducaoRow, type: 'prazo' | 'observacao' | 'tipo'): void {
    this.editOpen = true;
    this.editType = type;
    this.editRow = row;
    if (type === 'prazo') {
      this.editDateMasked = row.prazo || '';
    } else if (type === 'observacao') {
      this.editObsText = row.observacao || '';
    } else if (type === 'tipo') {
      this.editTipo = row.tipo || '';
    }
  }

  closeEdit(): void {
    this.editOpen = false;
    this.editType = null;
    this.editRow = null;
    this.editDateMasked = '';
    this.editObsText = '';
    this.editTipo = '';
  }

  saveEdit(): void {
    if (!this.editRow || !this.editType) return;
    if (this.editType === 'prazo') {
      this.editRow.prazo = this.editDateMasked;
    } else if (this.editType === 'observacao') {
      this.editRow.observacao = this.editObsText;
    } else if (this.editType === 'tipo') {
      if (this.editTipo) {
        this.editRow.tipo = this.editTipo as ('MANUTENCAO' | 'Outros');
      }
    }
    this.closeEdit();
  }

  onEditDateInput(ev: Event): void {
    const target = ev.target as HTMLInputElement;
    this.editDateMasked = this.maskDate(target.value);
  }

  onEditNativeDateChange(value: string): void {
    if (!value) { this.editDateMasked = ''; return; }
    const [yyyy, mm, dd] = value.split('-');
    this.editDateMasked = `${dd}/${mm}/${yyyy}`;
  }

  toNativeDate(masked: string): string {
    // Convert dd/mm/yyyy -> yyyy-mm-dd for the native date input
    const parts = (masked || '').split('/');
    if (parts.length !== 3) return '';
    const [dd, mm, yyyy] = parts;
    if (yyyy?.length !== 4 || mm?.length !== 2 || dd?.length !== 2) return '';
    return `${yyyy}-${mm}-${dd}`;
  }
}