import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FilterSectionComponent, FilterConfig } from '../../shared/components/filter-section/filter-section.component';
import { KpiSectionComponent, KpiConfig } from '../../shared/components/kpi-section/kpi-section.component';
import { ActionButtonComponent, ActionButtonConfig } from '../../shared/components/action-button/action-button.component';
import { GridSectionComponent, GridColumn } from '../../shared/components/grid-section/grid-section.component';
import { TemplateRef, ViewChild, AfterViewInit } from '@angular/core';
import { TabModalComponent, TabConfig } from '../../shared/components/tab-modal/tab-modal.component';
import { ChangeDetectorRef } from '@angular/core';

interface ProgramacaoRow {
  dParados: number;
  tempoFora: string; // integer days as string
  frota: string;
  localizacao: { cidade: string; uf: string };
  motorista: string;
  situacaoVeiculo: string;
  origem: string;
  inicioViagem: string;
  destino: string;
  pEntrega: string;
  pViagem: string;
  totalReceitas: number;
  totalDiario: number;
  observacao: string;
  receitasPVOR: number;
  situacaoMotorista: string;
  tipoConjuntoVeiculo: string;
  tipoOperacaoFrota: string;
  ultManutencao: string;
  falta: number;
  folga: number;
  jornada: string;
  entregas: number;
  qtdReceita?: number;
}

@Component({
  selector: 'app-programacao',
  templateUrl: './programacao.component.html',
  styleUrls: ['./programacao.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FilterSectionComponent,
    KpiSectionComponent,
    ActionButtonComponent,
    GridSectionComponent,
    TabModalComponent
  ]
})
export class ProgramacaoComponent implements OnInit, AfterViewInit {
  constructor(private cdr: ChangeDetectorRef) {}
  public Math = Math;

  // Filtros e KPIs
  filtersCollapsed = true;
  kpisCollapsed = false;
  totalMotoristas = 0;
  veiculosEmRota = 0;
  veiculosParados = 0;
  receitaTotal = 0;

  filterConfigs: FilterConfig[] = [
    { type: 'date', label: 'Data Início', key: 'dataInicio', placeholder: 'Selecione a data' },
    { type: 'date', label: 'Data Recebida', key: 'dataRecebida', placeholder: 'Selecione a data' },
    { type: 'select', label: 'Envio SEFAZ', key: 'envioSefaz', options: [
      { value: 'nao-enviado', label: 'Não enviado' },
      { value: 'enviado', label: 'Enviado' }
    ]},
    { type: 'select', label: 'Ranking Diário', key: 'rankingDiario', options: [
      { value: 'alto', label: 'Alto' },
      { value: 'medio', label: 'Médio' },
      { value: 'baixo', label: 'Baixo' }
    ]},
    { type: 'text', label: 'Frota', key: 'frota', placeholder: 'Digite o número da frota' },
    { type: 'text', label: 'Veículo', key: 'veiculo', placeholder: 'Digite a placa do veículo' },
    { type: 'text', label: 'Coordenador', key: 'coordenador', placeholder: 'Nome do coordenador' },
    { type: 'text', label: 'Gestor', key: 'gestor', placeholder: 'Nome do gestor' },
    { type: 'text', label: 'Motorista', key: 'motorista', placeholder: 'Nome do motorista' },
    { type: 'text', label: 'Cidade', key: 'cidade', placeholder: 'Nome da cidade' },
    { type: 'select', label: 'Situação Veículo', key: 'situacaoVeiculo', options: [
      { value: 'em-rota', label: 'Em Rota' },
      { value: 'parado', label: 'Parado' },
      { value: 'manutencao', label: 'Manutenção' }
    ]},
    { type: 'select', label: 'Situação Motorista', key: 'situacaoMotorista', options: [
      { value: 'trabalhando', label: 'Trabalhando' },
      { value: 'folga', label: 'Folga' },
      { value: 'ferias', label: 'Férias' }
    ]},
    { type: 'select', label: 'Tipo Operação Frota', key: 'tipoOperacaoFrota', options: [
      { value: 'transferencia', label: 'Transferência' },
      { value: 'distribuicao', label: 'Distribuição' },
      { value: 'coleta', label: 'Coleta' }
    ]},
    { type: 'number', label: 'Tempo Mín. Fora (d)', key: 'tempoMinFora', placeholder: 'Dias mínimos' }
  ];

  kpiConfigs: KpiConfig[] = [
    { label: 'Total de Frotas', value: this.totalMotoristas, icon: 'users', format: 'number', color: '#3b82f6' },
    { label: 'Veiculos em Rota', value: this.veiculosEmRota, icon: 'route', format: 'number', color: '#10b981' },
    { label: 'Veiculos Vazios', value: this.veiculosParados, icon: 'stop-circle', format: 'number', color: '#f59e0b' },
    { label: 'Receita Total', value: this.receitaTotal, icon: 'currency', format: 'currency', color: '#059669' }
  ];

  actionButtonConfigs: ActionButtonConfig[] = [];

  // Dados
  useMockData = true;
  rows: ProgramacaoRow[] = [];

  // Estado de filtros
  filtroDataInicio: string | null = null;
  filtroDataRecebida: string | null = null;
  filtroEnvioSefaz: string = '';
  filtroRankingDiario: string = '';
  filtroFrota: string = '';
  filtroVeiculo: string = '';
  filtroCoordenador: string = '';
  filtroGestor: string = '';
  filtroMotorista: string = '';
  filtroCidade: string = '';
  filtroSituacaoVeiculo: string = '';
  filtroSituacaoMotorista: string = '';
  filtroTipoOperacaoFrota: string = '';
  filtroTempoMinFora: string = '';

  get filtered(): ProgramacaoRow[] {
    let data = this.rows;
    if (this.filtroEnvioSefaz) { /* filtro exemplo */ }
    if (this.filtroRankingDiario) { /* filtro exemplo */ }
    if (this.filtroFrota) data = data.filter(r => r.frota.includes(this.filtroFrota));
    if (this.filtroMotorista) data = data.filter(r => r.motorista.toLowerCase().includes(this.filtroMotorista.toLowerCase()));
    if (this.filtroCidade) data = data.filter(r => r.localizacao.cidade.toLowerCase().includes(this.filtroCidade.toLowerCase()));
    if (this.filtroSituacaoVeiculo) data = data.filter(r => r.situacaoVeiculo === this.filtroSituacaoVeiculo);
    if (this.filtroSituacaoMotorista) data = data.filter(r => r.situacaoMotorista === this.filtroSituacaoMotorista);
    if (this.filtroTipoOperacaoFrota) data = data.filter(r => r.tipoOperacaoFrota === this.filtroTipoOperacaoFrota);
    if (this.filtroTempoMinFora) {
      const min = Number(this.filtroTempoMinFora) || 0;
      data = data.filter(r => (Number(this.tempoForaDiasInt(r.tempoFora)) || 0) >= min);
    }
    return data;
  }

  page = 1;
  pageSize = 25;
  pageSizeOptions = [25, 50, 250];

  get paged(): ProgramacaoRow[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filtered.slice(start, start + this.pageSize);
  }
  get pageCount(): number {
    const total = this.filtered.length;
    return Math.max(1, Math.ceil(total / this.pageSize));
  }
  nextPage(): void { if (this.page < this.pageCount) this.page++; }
  prevPage(): void { if (this.page > 1) this.page--; }
  firstPage(): void { this.page = 1; }
  lastPage(): void { this.page = this.pageCount; }

  // Ações por linha
  verRota(r: ProgramacaoRow): void { console.log('Ver rota', r); }

  // Modal Entregas - estado e templates
  entregasModalOpen = false;
  entregasActiveTabId = 'conhecimentos';
  entregasTabs: TabConfig[] = [];
  entregasRow: ProgramacaoRow | null = null;

  // NOVO: dados agrupados para a aba Conhecimentos
  entregasPVGroups: Array<{
    pvNumero: string;
    emissao: string;
    conhecimentos: Array<{
      numero: string;
      armazemPrev: string;
      formaFinal: boolean;
      armazenagem: boolean;
      dataEntrega: string;
      armazem: string;
      observacao: string;
    }>;
  }> = [];

  // Dados da aba Plano Viagem
  planoViagemRows: Array<{
    pvNumero: string;
    emissao: string;
    origem: string;
    destino: string;
    valor: string;
    dataEntrega?: string;
    horaEntrega?: string;
  }> = [];

  // Outras Receitas: mesmo layout de Plano Viagem
  outrasReceitasRows: Array<{
    recNumero: string;
    emissao: string;
    origem: string;
    destino: string;
    valor: string;
    dataEntrega?: string;
    horaEntrega?: string;
  }> = [];

  salvarPV(index: number): void {
    const pv = this.planoViagemRows[index];
    console.log('Salvar Plano de Viagem', pv.pvNumero, 'Data:', pv.dataEntrega, 'Hora:', pv.horaEntrega);
  }

  salvarOR(index: number): void {
    const or = this.outrasReceitasRows[index];
    console.log('Salvar Outra Receita', or.recNumero, 'Data:', or.dataEntrega, 'Hora:', or.horaEntrega);
  }

  @ViewChild('conhecimentosTpl') conhecimentosTpl!: TemplateRef<any>;
  @ViewChild('planoViagemTpl') planoViagemTpl!: TemplateRef<any>;
  @ViewChild('outrasReceitasTpl') outrasReceitasTpl!: TemplateRef<any>;
  @ViewChild('manifestosTpl') manifestosTpl!: TemplateRef<any>;
  @ViewChild('encerrarManifestoTpl') encerrarManifestoTpl!: TemplateRef<any>;
  @ViewChild('cancelarManifestoTpl') cancelarManifestoTpl!: TemplateRef<any>;

  // Utilitários da aba Conhecimentos
  generateEntregaGroups(r: ProgramacaoRow) {
    const base = Number(r.frota || '1000');
    const makeConhecimento = (idx: number) => ({
      numero: String(40000000 + base + idx),
      armazemPrev: idx % 2 === 0 ? 'Ex: A1' : '',
      formaFinal: true,
      armazenagem: idx % 3 === 0,
      dataEntrega: '',
      armazem: '',
      observacao: ''
    });
    const group = (pvOffset: number, items: number) => ({
      pvNumero: `UN ${String(770 + pvOffset).padStart(6, '0')}`,
      emissao: new Date(2025, 6, 7 + pvOffset).toISOString().slice(0, 10),
      conhecimentos: Array.from({ length: items }, (_, i) => makeConhecimento(i + pvOffset))
    });
    return [group(0, 3), group(73, 2), group(80, 2)];
  }

  salvarGrupo(idx: number) {
    const grupo = this.entregasPVGroups[idx];
    console.log('Salvar grupo', grupo);
  }

  fecharGrupo(idx: number) {
    console.log('Fechar grupo', this.entregasPVGroups[idx]);
  }

  private formatTempoForaAsDays(t: string): string {
    const val = this.tempoForaDiasInt(t);
    const n = typeof val === 'string' ? Number(val) : val;
    return String(n || 0);
  }

  private tempoForaDiasInt(t: string): number | string {
    if (!t) return 0;
    const plain = t.trim();
    if (/^\d+$/.test(plain)) return Number(plain);
    const dMatch = plain.match(/(\d+)d/i);
    const hMatch = plain.match(/(\d+)h/i);
    const d = dMatch ? Number(dMatch[1]) : 0;
    const h = hMatch ? Number(hMatch[1]) : 0;
    return d + (h / 24);
  }

  gridCollapsed = false;
  gridColumns: GridColumn[] = [
    { key: 'dParados', label: 'D.Parados', type: 'number', align: 'center', sortable: true, width: '100px', sticky: true, stickyLeft: 0 },
    { key: 'tempoFora', label: 'T.Fora', type: 'number', align: 'center', sortable: true, width: '120px', sticky: true, stickyLeft: 100 },
    { key: 'frota', label: 'Frota', align: 'center', sortable: true, width: '120px', sticky: true, stickyLeft: 220 },
    { key: 'motorista', label: 'Motorista', sortable: true, width: '160px', sticky: true, stickyLeft: 340 },
    { key: 'situacaoVeiculo', label: 'Situação Veículo', type: 'status', sortable: true, width: '160px', sticky: true, stickyLeft: 500 },
    { key: 'origem', label: 'Origem', sortable: true },
    { key: 'inicioViagem', label: 'I.Viagem', type: 'date', sortable: true },
    { key: 'destino', label: 'Destino', sortable: true },
    { key: 'localizacao', label: 'Localização', sortable: true },
    { key: 'pEntrega', label: 'P.Entrega', type: 'date', sortable: true },
    { key: 'pViagem', label: 'P.Viagem', align: 'center', sortable: true },
    { key: 'totalReceitas', label: 'Total Receitas', type: 'number', align: 'right', sortable: true },
    { key: 'totalDiario', label: 'Total Diário', type: 'number', align: 'right', sortable: true },
    { key: 'observacao', label: 'Observação' },
    { key: 'entregas', label: 'Entregas', type: 'button', align: 'center', buttonLabel: 'Ver', buttonAction: 'abrir-entregas', buttonType: 'secondary' },
    { key: 'qtdReceita', label: 'QTD Receita', type: 'number', align: 'right', sortable: true },
    { key: 'situacaoMotorista', label: 'Situação Motorista', sortable: true },
    { key: 'tipoConjuntoVeiculo', label: 'Tipo Conjunto Veículo', sortable: true },
    { key: 'tipoOperacaoFrota', label: 'Tipo Operação Frota', sortable: true },
    { key: 'ultManutencao', label: 'Última Manutenção', type: 'date', sortable: true },
    { key: 'falta', label: 'Falta', type: 'number', align: 'center', sortable: true },
    { key: 'folga', label: 'Folga', type: 'number', align: 'center', sortable: true },
    { key: 'jornada', label: 'Jornada', type: 'button', align: 'center', buttonLabel: 'Abrir', buttonAction: 'abrir-jornada', buttonType: 'primary' }
  ];

  get gridRows(): any[] {
    return this.paged.map(row => ({
      ...row,
      tempoFora: Number(this.formatTempoForaAsDays(row.tempoFora)),
      localizacao: `${row.localizacao.cidade}/${row.localizacao.uf}`
    }));
  }

  onGridAction(evt: { action: string; row: any }): void {
    switch (evt.action) {
      case 'abrir-entregas':
        this.abrirEntregas(evt.row as ProgramacaoRow);
        break;
      case 'abrir-jornada':
        this.abrirJornada(evt.row as ProgramacaoRow);
        break;
    }
  }

  onActionButtonClick(action: string): void { console.log('Ação:', action); }
  abrirEntregas(r: ProgramacaoRow): void {
    this.entregasRow = r;
    this.entregasActiveTabId = 'conhecimentos';
    // Gerar mock de PVs com conhecimentos agrupados
    this.entregasPVGroups = this.generateEntregaGroups(r);
    // Gerar linhas da aba Plano Viagem a partir dos grupos
    this.planoViagemRows = this.entregasPVGroups.map(g => ({
      pvNumero: g.pvNumero,
      emissao: g.emissao,
      origem: r.origem || 'Criciúma - SC',
      destino: r.destino || 'Santa Gertrudes - SP',
      valor: 'R$' + (4500 + Math.floor(Math.random()*800)).toFixed(2),
      dataEntrega: '',
      horaEntrega: ''
    }));
    // Outras Receitas: gerar linhas com o mesmo layout
    this.outrasReceitasRows = this.entregasPVGroups.map(g => ({
      recNumero: 'OR ' + (g.pvNumero.replace('UN ', '')), // só para identificar
      emissao: g.emissao,
      origem: r.origem || 'Criciúma - SC',
      destino: r.destino || 'Santa Gertrudes - SP',
      valor: 'R$' + (3500 + Math.floor(Math.random()*600)).toFixed(2),
      dataEntrega: '',
      horaEntrega: ''
    }));
    // Gerar grupos de Manifestos
    this.manifestosGroups = this.generateManifestoGroups(r);
    this.entregasModalOpen = true;
  }

  fecharEntregas(): void {
    this.entregasModalOpen = false;
    this.entregasRow = null;
    this.entregasPVGroups = [];
    this.planoViagemRows = [];
    this.outrasReceitasRows = [];
    this.manifestosGroups = [];
  }
  confirmarEntregas(): void {
    console.log('Confirmar entregas para frota', this.entregasRow?.frota);
    this.fecharEntregas();
  }

  abrirJornada(r: ProgramacaoRow): void { console.log('Abrir Jornada (modal)', r); }

  // Métodos para controle dos filtros
  toggleFilters(): void { this.filtersCollapsed = !this.filtersCollapsed; }

  limparFiltros(): void {
    this.filtroDataInicio = null;
    this.filtroDataRecebida = null;
    this.filtroEnvioSefaz = '';
    this.filtroRankingDiario = '';
    this.filtroFrota = '';
    this.filtroVeiculo = '';
    this.filtroCoordenador = '';
    this.filtroGestor = '';
    this.filtroMotorista = '';
    this.filtroCidade = '';
    this.filtroSituacaoVeiculo = '';
    this.filtroSituacaoMotorista = '';
    this.filtroTipoOperacaoFrota = '';
    this.filtroTempoMinFora = '';
  }

  aplicarFiltros(): void { this.page = 1; }
  toggleKpis(): void { this.kpisCollapsed = !this.kpisCollapsed; }

  private calcularMetricas(): void {
    const data = this.filtered;
    this.totalMotoristas = data.length;
    this.veiculosEmRota = data.filter(r => r.situacaoVeiculo === 'Em Rota').length;
    this.veiculosParados = data.filter(r => r.situacaoVeiculo === 'Parado').length;
    this.receitaTotal = data.reduce((sum, r) => sum + r.totalReceitas, 0);
    this.updateKpiValues();
  }

  private updateKpiValues(): void {
    this.kpiConfigs = [
      { label: 'Total de Frotas', value: this.totalMotoristas, icon: 'users', format: 'number', color: '#3b82f6' },
      { label: 'Veiculos em Rota', value: this.veiculosEmRota, icon: 'route', format: 'number', color: '#10b981' },
      { label: 'Veiculos Vazios', value: this.veiculosParados, icon: 'stop-circle', format: 'number', color: '#f59e0b' },
      { label: 'Receita Total', value: this.receitaTotal, icon: 'currency', format: 'currency', color: '#059669' }
    ];
  }

  onFiltersChange(filterValues: any): void {
    this.filtroFrota = filterValues.frota || '';
    this.filtroMotorista = filterValues.motorista || '';
    this.filtroCidade = filterValues.cidade || '';
    this.filtroSituacaoVeiculo = filterValues.situacaoVeiculo || '';
    this.filtroSituacaoMotorista = filterValues.situacaoMotorista || '';
    this.filtroTipoOperacaoFrota = filterValues.tipoOperacaoFrota || '';
    this.filtroTempoMinFora = filterValues.tempoMinFora || '';
    this.calcularMetricas();
  }

  onApplyFilters(filterValues: any): void { this.onFiltersChange(filterValues); this.aplicarFiltros(); }

  ngOnInit(): void {
    this.rows = generateMockRows(120);
    this.calcularMetricas();
  }

  ngAfterViewInit(): void {
    this.entregasTabs = [
      { id: 'conhecimentos', label: 'Conhecimentos', template: this.conhecimentosTpl },
      { id: 'plano-viagem', label: 'Plano Viagem', template: this.planoViagemTpl },
      { id: 'outras-receitas', label: 'Outras Receitas', template: this.outrasReceitasTpl },
      { id: 'manifestos', label: 'Manifestos', template: this.manifestosTpl }
    ];
    // Modais compactas de Manifestos
    this.encerrarTabs = [ { id: 'form', label: 'Encerrar', template: this.encerrarManifestoTpl } ];
    this.cancelarTabs = [ { id: 'form', label: 'Cancelar', template: this.cancelarManifestoTpl } ];
    this.cdr.detectChanges();
  }

  // Estado das modais compactas (Manifestos)
  encerrarModalOpen = false;
  cancelarModalOpen = false;
  encerrarActiveTabId = 'form';
  cancelarActiveTabId = 'form';
  encerrarTabs: TabConfig[] = [];
  cancelarTabs: TabConfig[] = [];
  encerrarCtx: { i: number; j: number; data: string; estado: string; cidade: string } | null = null;
  cancelarCtx: { i: number; j: number; justificativa: string } | null = null;

  estadosUF: string[] = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'];
  cidadesPorUF: Record<string, string[]> = {
    'SP': ['São Paulo','Campinas','Santos','Sorocaba','Ribeirão Preto'],
    'RJ': ['Rio de Janeiro','Niterói','Campos','Volta Redonda'],
    'BA': ['Salvador','Camaçari','Feira de Santana','Ilhéus'],
    'PR': ['Curitiba','Londrina','Maringá'],
    'SC': ['Florianópolis','Criciúma','Joinville','Blumenau'],
    'SE': ['Aracaju','Nossa Senhora do Socorro','Itabaiana'],
  };
  get encerrarCidades(): string[] { const uf = this.encerrarCtx?.estado || 'SP'; return this.cidadesPorUF[uf] || []; }

  private parseUF(place: string | undefined): string | null {
    if (!place) return null;
    const m = place.match(/[-–]\s*([A-Z]{2})$/);
    return m ? m[1] : null;
  }

  abrirEncerrarManifesto(i: number, j: number): void {
    const m = this.manifestosGroups[i]?.manifestos[j];
    const today = new Date().toISOString().slice(0,10);
    const ufFromDestino = this.parseUF(m?.destino || '');
    const estado = ufFromDestino || 'SP';
    const cidadeDefault = (this.cidadesPorUF[estado] || [''])[0] || '';
    this.encerrarCtx = { i, j, data: today, estado, cidade: cidadeDefault };
    this.encerrarModalOpen = true;
  }
  onChangeEstadoEncerrar(): void {
    if (!this.encerrarCtx) return;
    const opts = this.cidadesPorUF[this.encerrarCtx.estado] || [];
    this.encerrarCtx.cidade = opts[0] || '';
  }
  fecharEncerrarManifesto(): void {
    this.encerrarModalOpen = false;
    this.encerrarCtx = null;
  }
  confirmarEncerrarManifesto(): void {
    const ctx = this.encerrarCtx; if (!ctx) return;
    const m = this.manifestosGroups[ctx.i]?.manifestos[ctx.j];
    if (!m) return;
    m.cidadeEncerramento = ctx.cidade;
    (m as any).encerramentoUF = ctx.estado;
    (m as any).encerramentoData = ctx.data;
    this.encerrarManifesto(ctx.i, ctx.j);
    this.fecharEncerrarManifesto();
  }

  get encerrarGroup() {
    const i = this.encerrarCtx?.i;
    return (i === undefined || i === null) ? null : (this.manifestosGroups[i] || null);
  }
  get encerrarManifestoSel() {
    const ctx = this.encerrarCtx; if (!ctx) return null;
    const g = this.manifestosGroups[ctx.i];
    return g ? (g.manifestos[ctx.j] || null) : null;
  }

  abrirCancelarManifesto(i: number, j: number): void {
    this.cancelarCtx = { i, j, justificativa: '' };
    this.cancelarModalOpen = true;
  }
  fecharCancelarManifesto(): void {
    this.cancelarModalOpen = false;
    this.cancelarCtx = null;
  }
  confirmarCancelarManifesto(): void {
    const ctx = this.cancelarCtx; if (!ctx) return;
    const m = this.manifestosGroups[ctx.i]?.manifestos[ctx.j];
    if (!m) return;
    m.status = 'Cancelado';
    m.justificativaCancelamento = ctx.justificativa || '';
    this.cancelarModalOpen = false;
    this.cancelarCtx = null;
    console.log('Cancelar manifesto', m.numero, 'PV', this.manifestosGroups[ctx.i].pvNumero, 'Justificativa:', m.justificativaCancelamento);
  }

  // Dados da aba Manifestos
  manifestosGroups: Array<{
    pvNumero: string;
    emissao: string;
    manifestos: Array<{
      numero: string;
      emissao: string;
      origem: string;
      destino: string;
      status: string;
      cidadeEncerramento?: string;
      justificativaCancelamento?: string;
      chaveAcesso?: string;
      encerramentoUF?: string;
      encerramentoData?: string;
    }>;
  }> = [];

  encerrarManifesto(i: number, j: number): void {
    const m = this.manifestosGroups[i]?.manifestos[j];
    if (!m) return;
    m.status = 'Encerrado';
    console.log('Encerrar manifesto', m.numero, 'PV', this.manifestosGroups[i].pvNumero, 'Data:', m.encerramentoData, 'UF:', m.encerramentoUF, 'Cidade:', m.cidadeEncerramento);
  }

  imprimirManifesto(i: number, j: number): void {
    const m = this.manifestosGroups[i]?.manifestos[j];
    if (!m) return;
    console.log('Imprimir manifesto', m.numero, 'PV', this.manifestosGroups[i].pvNumero);
  }

  // Geração de dados de Manifestos (mock)
  private generateManifestoGroups(r: ProgramacaoRow) {
    const base = Number(r.frota || '1000');
    const makeChave = () => Array.from({length:44}, () => Math.floor(Math.random()*10)).join('');
    const makeManifesto = (idx: number) => ({
      numero: String(43300000 + base + idx),
      emissao: new Date(2025, 5 + (idx % 3), 11 + idx).toISOString().slice(0, 10),
      origem: r.origem || 'Criciúma - SC',
      destino: idx % 2 === 0 ? (r.destino || 'Camaçari - BA') : 'São Paulo - SP',
      status: ['Autorizado', 'Encerrado'][idx % 2],
      chaveAcesso: makeChave()
    });
    const group = (pvOffset: number, items: number) => ({
      pvNumero: `UN ${String(770 + pvOffset).padStart(6, '0')}`,
      emissao: new Date(2025, 6, 7 + pvOffset).toISOString().slice(0, 10),
      manifestos: Array.from({ length: items }, (_, i) => makeManifesto(i + pvOffset))
    });
    return [group(0, 3), group(73, 2)];
  }
}

function generateMockRows(count: number): ProgramacaoRow[] {
  const cidades = [
    { cidade: 'São Paulo', uf: 'SP' },
    { cidade: 'Curitiba', uf: 'PR' },
    { cidade: 'Belo Horizonte', uf: 'MG' },
    { cidade: 'Porto Alegre', uf: 'RS' },
    { cidade: 'Campinas', uf: 'SP' }
  ];
  const motoristas = ['João Silva', 'Maria Souza', 'Pedro Santos', 'Ana Lima', 'Carlos Oliveira'];
  const destinos = ['Rio de Janeiro/RJ', 'Salvador/BA', 'Fortaleza/CE', 'Recife/PE', 'Florianópolis/SC'];

  const rows: ProgramacaoRow[] = [];
  for (let i = 0; i < count; i++) {
    const tempoForaInt = 1 + ((i * 7) % 15); // 1..15
    const loc = cidades[i % cidades.length];
    rows.push({
      dParados: (i % 5),
      tempoFora: String(tempoForaInt),
      frota: String(1000 + i),
      localizacao: { cidade: loc.cidade, uf: loc.uf },
      motorista: motoristas[i % motoristas.length],
      situacaoVeiculo: i % 3 === 0 ? 'Parado' : 'Em Rota',
      origem: `${loc.cidade}/${loc.uf}`,
      inicioViagem: '2024-09-01 08:00',
      destino: destinos[i % destinos.length],
      pEntrega: '2024-09-03',
      pViagem: '2d',
      totalReceitas: 10000 + (i * 37),
      totalDiario: 500 + (i * 5),
      observacao: '—',
      receitasPVOR: 3000 + (i * 13),
      situacaoMotorista: i % 4 === 0 ? 'Folga' : 'Trabalhando',
      tipoConjuntoVeiculo: 'Carreta',
      tipoOperacaoFrota: i % 2 === 0 ? 'Transferência' : 'Distribuição',
      ultManutencao: '2024-08-15',
      falta: i % 2,
      folga: i % 3,
      jornada: 'Normal',
      entregas: (i % 4) + 1,
      qtdReceita: (i % 7) + 1,
    });
  }
  return rows;

}