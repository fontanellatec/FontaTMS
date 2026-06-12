import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TemplateRef, ViewChild, AfterViewInit } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import {
  FilterSectionComponent,
  FilterConfig,
  PageLayoutComponent,
  KpiSectionComponent,
  KpiConfig,
  ActionButtonComponent,
  ActionButtonConfig,
  GridSectionComponent,
  GridColumn,
  TabModalComponent,
  TabConfig,
  ButtonComponent
} from '@shared/components';
import { ProgramacaoRow, PlanoViagemGroup, PlanoViagemRow, OutraReceitaRow, ManifestoGroup } from '../models/programacao.model';
import { ProgramacaoService } from '../services/programacao.service';

@Component({
  selector: 'app-programacao',
  templateUrl: './programacao-list.component.html',
  styleUrls: ['./programacao-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FilterSectionComponent,
    KpiSectionComponent,
    ActionButtonComponent,
    GridSectionComponent,
    TabModalComponent,
    PageLayoutComponent,
    ButtonComponent
  ]
})
export class ProgramacaoComponent implements OnInit, AfterViewInit {
  constructor(
    private cdr: ChangeDetectorRef,
    private programacaoService: ProgramacaoService
  ) { }
  public Math = Math;

  loading = false;
  filtersCollapsed = true;
  kpisCollapsed = false;
  totalMotoristas = 0;
  veiculosEmRota = 0;
  veiculosParados = 0;
  receitaTotal = 0;

  filterConfigs: FilterConfig[] = [
    { type: 'date', label: 'Data Início', key: 'dataInicio', placeholder: 'Selecione a data' },
    { type: 'date', label: 'Data Recebida', key: 'dataRecebida', placeholder: 'Selecione a data' },
    {
      type: 'select', label: 'Envio SEFAZ', key: 'envioSefaz', options: [
        { value: 'nao-enviado', label: 'Não enviado' },
        { value: 'enviado', label: 'Enviado' }
      ]
    },
    {
      type: 'select', label: 'Ranking Diário', key: 'rankingDiario', options: [
        { value: 'alto', label: 'Alto' },
        { value: 'medio', label: 'Médio' },
        { value: 'baixo', label: 'Baixo' }
      ]
    },
    { type: 'text', label: 'Frota', key: 'frota', placeholder: 'Digite o número da frota' },
    { type: 'text', label: 'Veículo', key: 'veiculo', placeholder: 'Digite a placa do veículo' },
    { type: 'text', label: 'Coordenador', key: 'coordenador', placeholder: 'Nome do coordenador' },
    { type: 'text', label: 'Gestor', key: 'gestor', placeholder: 'Nome do gestor' },
    { type: 'text', label: 'Motorista', key: 'motorista', placeholder: 'Nome do motorista' },
    { type: 'text', label: 'Cidade', key: 'cidade', placeholder: 'Nome da cidade' },
    {
      type: 'select', label: 'Situação Veículo', key: 'situacaoVeiculo', options: [
        { value: 'em-rota', label: 'Em Rota' },
        { value: 'parado', label: 'Parado' },
        { value: 'manutencao', label: 'Manutenção' }
      ]
    },
    {
      type: 'select', label: 'Situação Motorista', key: 'situacaoMotorista', options: [
        { value: 'trabalhando', label: 'Trabalhando' },
        { value: 'folga', label: 'Folga' },
        { value: 'ferias', label: 'Férias' }
      ]
    },
    {
      type: 'select', label: 'Tipo Operação Frota', key: 'tipoOperacaoFrota', options: [
        { value: 'transferencia', label: 'Transferência' },
        { value: 'distribuicao', label: 'Distribuição' },
        { value: 'coleta', label: 'Coleta' }
      ]
    },
    { type: 'number', label: 'Tempo Mín. Fora (d)', key: 'tempoMinFora', placeholder: 'Dias mínimos' }
  ];

  kpiConfigs: KpiConfig[] = [
    { label: 'Total de Frotas', value: this.totalMotoristas, icon: 'users', format: 'number', color: '#3b82f6' },
    { label: 'Veiculos em Rota', value: this.veiculosEmRota, icon: 'route', format: 'number', color: '#10b981' },
    { label: 'Veiculos Vazios', value: this.veiculosParados, icon: 'stop-circle', format: 'number', color: '#f59e0b' },
    { label: 'Receita Total', value: this.receitaTotal, icon: 'currency', format: 'currency', color: '#059669' }
  ];

  actionButtonConfigs: ActionButtonConfig[] = [];

  useMockData = true;
  rows: ProgramacaoRow[] = [];

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
    if (this.filtroEnvioSefaz) { }
    if (this.filtroRankingDiario) { }
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

  verRota(r: ProgramacaoRow): void { console.log('Ver rota', r); }

  entregasModalOpen = false;
  entregasActiveTabId = 'conhecimentos';
  entregasTabs: TabConfig[] = [];
  entregasRow: ProgramacaoRow | null = null;

  entregasPVGroups: PlanoViagemGroup[] = [];
  planoViagemRows: PlanoViagemRow[] = [];
  outrasReceitasRows: OutraReceitaRow[] = [];

  salvarPV(index: number): void {
    const pv = this.planoViagemRows[index];
    this.programacaoService.salvarPlanoViagem(pv.pvNumero, pv.dataEntrega || '', pv.horaEntrega || '').subscribe({
      next: () => console.log('Plano de Viagem salvo com sucesso'),
      error: (err) => console.error('Erro ao salvar plano de viagem', err)
    });
  }

  salvarOR(index: number): void {
    const or = this.outrasReceitasRows[index];
    this.programacaoService.salvarOutraReceita(or.recNumero, or.dataEntrega || '', or.horaEntrega || '').subscribe({
      next: () => console.log('Outra Receita salva com sucesso'),
      error: (err) => console.error('Erro ao salvar outra receita', err)
    });
  }

  @ViewChild('conhecimentosTpl') conhecimentosTpl!: TemplateRef<any>;
  @ViewChild('planoViagemTpl') planoViagemTpl!: TemplateRef<any>;
  @ViewChild('outrasReceitasTpl') outrasReceitasTpl!: TemplateRef<any>;
  @ViewChild('manifestosTpl') manifestosTpl!: TemplateRef<any>;
  @ViewChild('encerrarManifestoTpl') encerrarManifestoTpl!: TemplateRef<any>;
  @ViewChild('cancelarManifestoTpl') cancelarManifestoTpl!: TemplateRef<any>;

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
    this.loading = true;
    this.cdr.detectChanges();
    this.programacaoService.getDetalhesFrota(r.frota).subscribe({
      next: (detalhes) => {
        this.entregasPVGroups = detalhes.entregasPVGroups || [];
        this.planoViagemRows = detalhes.planoViagemRows || [];
        this.outrasReceitasRows = detalhes.outrasReceitasRows || [];
        this.manifestosGroups = detalhes.manifestosGroups || [];
        this.entregasModalOpen = true;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao buscar detalhes da frota', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
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

  aplicarFiltros(): void {
    this.page = 1;
    this.loadProgramacoes();
  }
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
    this.loadProgramacoes();
  }

  loadProgramacoes(): void {
    this.loading = true;
    this.cdr.detectChanges();
    this.programacaoService.getProgramacoes().subscribe({
      next: (data) => {
        this.rows = data || [];
        this.calcularMetricas();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  ngAfterViewInit(): void {
    this.entregasTabs = [
      { id: 'conhecimentos', label: 'Conhecimentos', template: this.conhecimentosTpl },
      { id: 'plano-viagem', label: 'Plano Viagem', template: this.planoViagemTpl },
      { id: 'outras-receitas', label: 'Outras Receitas', template: this.outrasReceitasTpl },
      { id: 'manifestos', label: 'Manifestos', template: this.manifestosTpl }
    ];
    this.encerrarTabs = [{ id: 'form', label: 'Encerrar', template: this.encerrarManifestoTpl }];
    this.cancelarTabs = [{ id: 'form', label: 'Cancelar', template: this.cancelarManifestoTpl }];
    this.cdr.detectChanges();
  }

  encerrarModalOpen = false;
  cancelarModalOpen = false;
  encerrarActiveTabId = 'form';
  cancelarActiveTabId = 'form';
  encerrarTabs: TabConfig[] = [];
  cancelarTabs: TabConfig[] = [];
  encerrarCtx: { i: number; j: number; data: string; estado: string; cidade: string } | null = null;
  cancelarCtx: { i: number; j: number; justificativa: string } | null = null;

  estadosUF: string[] = ['AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO'];
  cidadesPorUF: Record<string, string[]> = {
    'SP': ['São Paulo', 'Campinas', 'Santos', 'Sorocaba', 'Ribeirão Preto'],
    'RJ': ['Rio de Janeiro', 'Niterói', 'Campos', 'Volta Redonda'],
    'BA': ['Salvador', 'Camaçari', 'Feira de Santana', 'Ilhéus'],
    'PR': ['Curitiba', 'Londrina', 'Maringá'],
    'SC': ['Florianópolis', 'Criciúma', 'Joinville', 'Blumenau'],
    'SE': ['Aracaju', 'Nossa Senhora do Socorro', 'Itabaiana'],
  };
  get encerrarCidades(): string[] { const uf = this.encerrarCtx?.estado || 'SP'; return this.cidadesPorUF[uf] || []; }

  private parseUF(place: string | undefined): string | null {
    if (!place) return null;
    const m = place.match(/[-–]\s*([A-Z]{2})$/);
    return m ? m[1] : null;
  }

  abrirEncerrarManifesto(i: number, j: number): void {
    const m = this.manifestosGroups[i]?.manifestos[j];
    const today = new Date().toISOString().slice(0, 10);
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

    this.programacaoService.encerrarManifesto(m.numero, ctx.data, ctx.estado, ctx.cidade).subscribe({
      next: () => {
        m.status = 'Encerrado';
        m.cidadeEncerramento = ctx.cidade;
        m.encerramentoUF = ctx.estado;
        m.encerramentoData = ctx.data;
        console.log('Manifesto encerrado com sucesso');
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erro ao encerrar manifesto', err)
    });
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

    this.programacaoService.cancelarManifesto(m.numero, ctx.justificativa || '').subscribe({
      next: () => {
        m.status = 'Cancelado';
        m.justificativaCancelamento = ctx.justificativa || '';
        console.log('Manifesto cancelado com sucesso');
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erro ao cancelar manifesto', err)
    });
    this.cancelarModalOpen = false;
    this.cancelarCtx = null;
  }

  manifestosGroups: ManifestoGroup[] = [];

  imprimirManifesto(i: number, j: number): void {
    const m = this.manifestosGroups[i]?.manifestos[j];
    if (!m) return;
    console.log('Imprimir manifesto', m.numero, 'PV', this.manifestosGroups[i].pvNumero);
  }
}