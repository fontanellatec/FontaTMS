import { Component, TemplateRef, ViewChild, AfterViewInit, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FilterSectionComponent } from '../../shared/components/filter-section/filter-section.component';
import { KpiSectionComponent } from '../../shared/components/kpi-section/kpi-section.component';
import { ActionButtonComponent } from '../../shared/components/action-button/action-button.component';
import { GridSectionComponent, GridColumn, GridAction } from '../../shared/components/grid-section/grid-section.component';
import { TabModalComponent, TabConfig } from '../../shared/components/tab-modal/tab-modal.component';

// Interfaces locais para configuração
interface FilterConfig {
  type: 'select' | 'date' | 'text' | 'number';
  label: string;
  key: string;
  options?: { value: any; label: string }[];
  placeholder?: string;
  value?: any;
}

interface KpiConfig {
  label: string;
  value: number | string;
  icon: string;
  format?: 'number' | 'currency' | 'percentage' | 'text';
  prefix?: string;
  suffix?: string;
  color?: string;
}

interface ActionButtonConfig {
  label: string;
  icon?: string;
  type?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  action: string;
}

interface FleetRecord {
  frota: string;
  veiculo: string;
  tipoConjuntoVeiculo: string;
  situacaoVeiculo: string;
  tipoOperacaoFrota: string;
  motorista: string;
  situacaoMotorista: string;
  categoriaMotorista: string;
  gestor: string;
  vinculo?: string;
}

@Component({
  selector: 'erp-controle-frota',
  standalone: true,
  imports: [CommonModule, FormsModule, FilterSectionComponent, KpiSectionComponent, ActionButtonComponent, GridSectionComponent, TabModalComponent],
  templateUrl: './controle-frota.component.html',
  styleUrls: ['./controle-frota.component.scss']
})
export class ControleFrotaComponent implements AfterViewInit, OnInit {
  // Filtros - declarados primeiro para evitar erros de inicialização
  filtroDataBase = '';
  filtroFrota = '';
  filtroTipoOperacaoFrota = '';
  filtroTipoConjuntoVeiculo = '';
  filtroSituacaoVeiculo = '';
  filtroSituacaoMotorista = '';
  filtroCategoriaMotorista = '';
  filtroVeiculo = '';
  filtroMotorista = '';

  // Configurações dos componentes genéricos
  title = 'Filtros';
  filters: FilterConfig[] = [
    {
      type: 'date',
      label: 'Data Base',
      key: 'filtroDataBase',
      value: this.filtroDataBase
    },
    {
      type: 'select',
      label: 'Frota',
      key: 'filtroFrota',
      value: this.filtroFrota,
      options: [
        { value: '', label: 'Selecione' },
        { value: '88', label: '88' },
        { value: '273', label: '273' },
        { value: '319', label: '319' },
        { value: '410', label: '410' },
        { value: '551', label: '551' },
        { value: '568', label: '568' },
        { value: '773', label: '773' },
        { value: '982', label: '982' }
      ]
    },
    {
      type: 'select',
      label: 'Tipo Operação Frota',
      key: 'filtroTipoOperacaoFrota',
      value: this.filtroTipoOperacaoFrota,
      options: [
        { value: '', label: 'Selecione' },
        { value: 'LOG - XG05', label: 'LOG - XG05' },
        { value: 'DISTRIBUIÇÃO URBANA', label: 'DISTRIBUIÇÃO URBANA' },
        { value: 'LOG - CS', label: 'LOG - CS' },
        { value: 'TRANSFERÊNCIA', label: 'TRANSFERÊNCIA' },
        { value: 'LOG - CR', label: 'LOG - CR' }
      ]
    },
    {
      type: 'select',
      label: 'Tipo Conjunto Veículo',
      key: 'filtroTipoConjuntoVeiculo',
      value: this.filtroTipoConjuntoVeiculo,
      options: [
        { value: '', label: 'Selecione' },
        { value: 'RODOTREM', label: 'RODOTREM' },
        { value: 'BITREM', label: 'BITREM' },
        { value: 'LS', label: 'LS' },
        { value: 'CARRETA', label: 'CARRETA' }
      ]
    },
    {
      type: 'select',
      label: 'Situação Veículo',
      key: 'filtroSituacaoVeiculo',
      value: this.filtroSituacaoVeiculo,
      options: [
        { value: '', label: 'Selecione' },
        { value: 'MANUTENÇÃO', label: 'MANUTENÇÃO' },
        { value: 'SEM MOTORISTA', label: 'SEM MOTORISTA' },
        { value: 'EM ROTA', label: 'EM ROTA' },
        { value: 'EM VIAGEM', label: 'EM VIAGEM' },
        { value: 'PARADO', label: 'PARADO' }
      ]
    },
    {
      type: 'select',
      label: 'Situação Motorista',
      key: 'filtroSituacaoMotorista',
      value: this.filtroSituacaoMotorista,
      options: [
        { value: '', label: 'Selecione' },
        { value: 'Aguardando Descarga', label: 'Aguardando Descarga' },
        { value: 'Em viagem', label: 'Em viagem' },
        { value: 'Disponível', label: 'Disponível' },
        { value: 'Folga', label: 'Folga' },
        { value: 'Suspenso', label: 'Suspenso' }
      ]
    },
    {
      type: 'select',
      label: 'Categoria Motorista',
      key: 'filtroCategoriaMotorista',
      value: this.filtroCategoriaMotorista,
      options: [
        { value: '', label: 'Selecione' },
        { value: 'Categoria I', label: 'Categoria I' },
        { value: 'Categoria II', label: 'Categoria II' }
      ]
    },
    {
      type: 'text',
      label: 'Veículo',
      key: 'filtroVeiculo',
      value: this.filtroVeiculo,
      placeholder: 'Digite o veículo'
    },
    {
      type: 'text',
      label: 'Motorista',
      key: 'filtroMotorista',
      value: this.filtroMotorista,
      placeholder: 'Digite o motorista'
    }
  ];

  kpiTitle = 'Métricas de Controle de Frota';
  kpis: KpiConfig[] = [
    {
      label: 'Total Veículos',
      value: '8',
      icon: 'truck',
      color: '#3b82f6'
    },
    {
      label: 'Em Rota',
      value: '3',
      icon: 'route',
      color: '#10b981'
    },
    {
      label: 'Manutenção',
      value: '2',
      icon: 'wrench',
      color: '#f59e0b'
    },
    {
      label: 'Disponíveis',
      value: '3',
      icon: 'check-circle',
      color: '#06b6d4'
    }
  ];

  actionTitle = 'Ações';
  buttons: ActionButtonConfig[] = [
    {
      label: 'Adicionar Filtro',
      icon: 'plus',
      type: 'primary',
      action: 'addFilter'
    },
    {
      label: 'Limpar',
      icon: 'refresh',
      type: 'secondary',
      action: 'clearFilters'
    }
  ];

  // Segmento ativo
  segmento: 'Veiculo' | 'Motorista' = 'Veiculo';

  // Dados mockados (placeholder até integração)
  records: FleetRecord[] = [
    { frota: '88', veiculo: 'EHB1222', tipoConjuntoVeiculo: 'RODOTREM', situacaoVeiculo: 'MANUTENÇÃO', tipoOperacaoFrota: 'LOG - XG05', motorista: 'ALEXANDRE DA SILVA LEMES', situacaoMotorista: 'Aguardando Descarga', categoriaMotorista: 'Categoria II', gestor: 'Marcio Sauter', vinculo: 'Ativo' },
    { frota: '273', veiculo: 'MTI780 - QWX2032', tipoConjuntoVeiculo: 'BITREM', situacaoVeiculo: 'SEM MOTORISTA', tipoOperacaoFrota: 'DISTRIBUIÇÃO URBANA', motorista: '—', situacaoMotorista: '—', categoriaMotorista: 'Categoria I', gestor: 'Marcio Sauter', vinculo: 'Inativo' },
    { frota: '319', veiculo: 'RX3460', tipoConjuntoVeiculo: 'LS', situacaoVeiculo: 'EM ROTA', tipoOperacaoFrota: 'LOG - CS', motorista: 'JOÃO SILVA', situacaoMotorista: 'Em viagem', categoriaMotorista: 'Categoria II', gestor: 'Samuel de Mello Alves', vinculo: 'Ativo' },
    { frota: '410', veiculo: 'MV1638', tipoConjuntoVeiculo: 'RODOTREM', situacaoVeiculo: 'EM ROTA', tipoOperacaoFrota: 'TRANSFERÊNCIA', motorista: 'GUILHERME', situacaoMotorista: 'Disponível', categoriaMotorista: 'Categoria I', gestor: 'Marcio Sauter', vinculo: 'Ativo' },
    { frota: '551', veiculo: 'MV1650', tipoConjuntoVeiculo: 'BITREM', situacaoVeiculo: 'EM VIAGEM', tipoOperacaoFrota: 'DISTRIBUIÇÃO URBANA', motorista: 'ALAN COLONEGO', situacaoMotorista: 'Em viagem', categoriaMotorista: 'Categoria II', gestor: 'Guilherme Master Mattos', vinculo: 'Ativo' },
    { frota: '568', veiculo: 'QQ2161', tipoConjuntoVeiculo: 'CARRETA', situacaoVeiculo: 'PARADO', tipoOperacaoFrota: 'LOG - CR', motorista: 'MATEUS', situacaoMotorista: 'Folga', categoriaMotorista: 'Categoria I', gestor: 'Anderson Pedroso', vinculo: 'Suspenso' },
    { frota: '773', veiculo: 'QPW840', tipoConjuntoVeiculo: 'BITREM', situacaoVeiculo: 'EM ROTA', tipoOperacaoFrota: 'DISTRIBUIÇÃO URBANA', motorista: 'ALAN COLONEGO', situacaoMotorista: 'Em viagem', categoriaMotorista: 'Categoria II', gestor: 'Marcio Sauter', vinculo: 'Ativo' },
    { frota: '982', veiculo: 'PPP9650 - PJP777 - GGP9900', tipoConjuntoVeiculo: 'BITREM', situacaoVeiculo: 'MANUTENÇÃO', tipoOperacaoFrota: 'LOG - XG05', motorista: 'GABRIEL', situacaoMotorista: 'Suspenso', categoriaMotorista: 'Categoria I', gestor: 'Marcio Sauter', vinculo: 'Suspenso' }
  ];

  // Paginação
  page = 1;
  pageSizeOptions = [10, 20, 50];
  pageSize = 10;

  // Expor Math para uso no template
  Math = Math;

  // --- Modal de Vínculo ---
  vinculoModalOpen = false;
  vinculoTab: 'Motorista' | 'Gestor' | 'Engate' | 'TipoConjunto' = 'Motorista';
  @ViewChild('tplMotorista', { static: true }) tplMotorista!: TemplateRef<any>;
  @ViewChild('tplGestor', { static: true }) tplGestor!: TemplateRef<any>;
  @ViewChild('tplEngate', { static: true }) tplEngate!: TemplateRef<any>;
  @ViewChild('tplTipoConjunto', { static: true }) tplTipoConjunto!: TemplateRef<any>;

  vinculoTabs: TabConfig[] = [];

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // Popular tabs antes da primeira checagem para evitar NG0100
    this.vinculoTabs = [
      { id: 'Motorista', label: 'Motorista', template: this.tplMotorista },
      { id: 'Gestor', label: 'Gestor', template: this.tplGestor },
      { id: 'Engate', label: 'Engate', template: this.tplEngate },
      { id: 'TipoConjunto', label: 'Tipo Conjunto', template: this.tplTipoConjunto }
    ];
  }

  ngAfterViewInit(): void {
    // Nada aqui agora; tabs já foram populadas em ngOnInit
  }
  selectedRecord: FleetRecord | null = null;
  vinculoKeepMotorista = false;
  vinculo = {
    data: '',
    hora: '',
    tipo: 'Saída',
    veiculo1: '',
    veiculo2: '',
    motoristaTelefone: '',
    motoristaNome: '',
    situacaoMotorista: '',
    dataInicio: '',
    dataFim: '',
    // Campos da aba Gestor
    gestorId: '',
    gestorNome: '',
    tipoOperacaoFrota: '',
    tipoConjuntoVeiculo: ''
  };

  // Engate: estado de UI e DnD
  engateVehiclePlate = '';
  engateSlots: (string | null)[] = [];
  engateQuery = '';
  engateDragOverIndex: number | null = null; // -1 para área disponível
  allPlates: string[] = [];
  // Placas mockadas extras para Engate (Mercosul/convencional)
  mockExtraPlates: string[] = [
    'ABC1234','DEF5678','GHI9012','JKL3456','MNO7890',
    'PQR1122','STU3344','VWX5566','YZA7788','BCD9900',
    'EHB1222','MV1638','QWX2032','RX3460','TRK2024',
    'CAB0001','TRL0002','TRL0003','CAR1234','LS5678'
  ];
  engateTipo: string = '';

  get platesFiltered(): string[] {
    const q = this.engateQuery.trim().toLowerCase();
    const arr = this.allPlates;
    if (!q) return arr;
    return arr.filter(p => p.toLowerCase().includes(q));
  }

  private formatDate(d: Date): string {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }
  private formatTime(d: Date): string {
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  get filtered(): FleetRecord[] {
    const df = this.filtroDataBase.trim().toLowerCase();
    const fF = this.filtroFrota.trim().toLowerCase();
    const fT = this.filtroTipoOperacaoFrota.trim().toLowerCase();
    const fC = this.filtroTipoConjuntoVeiculo.trim().toLowerCase();
    const fSV = this.filtroSituacaoVeiculo.trim().toLowerCase();
    const fSM = this.filtroSituacaoMotorista.trim().toLowerCase();
    const fCat = this.filtroCategoriaMotorista.trim().toLowerCase();
    const fV = this.filtroVeiculo.trim().toLowerCase();
    const fM = this.filtroMotorista.trim().toLowerCase();

    // Data base (df) é informativo; sem filtro hard aqui
    return this.records.filter(r =>
      (!fF || r.frota.toLowerCase().includes(fF)) &&
      (!fT || r.tipoOperacaoFrota.toLowerCase().includes(fT)) &&
      (!fC || r.tipoConjuntoVeiculo.toLowerCase().includes(fC)) &&
      (!fSV || r.situacaoVeiculo.toLowerCase().includes(fSV)) &&
      (!fSM || r.situacaoMotorista.toLowerCase().includes(fSM)) &&
      (!fCat || r.categoriaMotorista.toLowerCase().includes(fCat)) &&
      (!fV || r.veiculo.toLowerCase().includes(fV)) &&
      (!fM || r.motorista.toLowerCase().includes(fM))
    );
  }

  get pageCount(): number { return Math.max(1, Math.ceil(this.filtered.length / this.pageSize)); }
  get paged(): FleetRecord[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filtered.slice(start, start + this.pageSize);
  }

  pesquisar(): void { /* filtros são reativos; sem ação adicional */ }

  setSegmento(seg: 'Veiculo' | 'Motorista'): void { this.segmento = seg; }

  firstPage(): void { this.page = 1; }
  prevPage(): void { this.page = Math.max(1, this.page - 1); }
  nextPage(): void { this.page = Math.min(this.pageCount, this.page + 1); }
  lastPage(): void { this.page = this.pageCount; }

  setPageSize(sz: number): void { this.pageSize = Number(sz); this.page = 1; }

  vincular(r: FleetRecord): void {
    this.selectedRecord = r;
    const now = new Date();
    this.vinculo.data = this.formatDate(now);
    this.vinculo.hora = this.formatTime(now);
    this.vinculo.tipo = 'Saída';
    const parts = r.veiculo.split(/\s*-\s*|\s+/).filter(Boolean);
    this.vinculo.veiculo1 = parts[0] || '';
    this.vinculo.veiculo2 = parts[1] || '';
    this.vinculo.motoristaNome = r.motorista === '—' ? '' : r.motorista;
    this.vinculo.situacaoMotorista = r.situacaoMotorista || '';
    this.vinculo.dataInicio = '';
    this.vinculo.dataFim = '';
    this.vinculoKeepMotorista = false;
    // Popular campos da aba Gestor
    this.vinculo.gestorId = '';
    this.vinculo.gestorNome = r.gestor || '';
    this.vinculo.tipoOperacaoFrota = r.tipoOperacaoFrota || '';
    this.vinculoTab = 'Motorista';
    this.vinculoModalOpen = true;

    // Inicializa Engate conforme registro
    this.initEngateFromRecord(r);
  }

  // Engate helpers
  private getEngateSlotCount(): number {
    // Fixar em 3 reboques conforme requisito
    return 3;
  }

  private computeAllPlates(): void {
    const type = (this.engateTipo || '').toUpperCase();
    const set = new Set<string>();
    for (const rec of this.records) {
      if (type && !rec.tipoConjuntoVeiculo.toUpperCase().includes(type)) continue;
      const tokens = rec.veiculo.split(/\s*-\s*|\s+/).filter(Boolean);
      for (const t of tokens) {
        const v = t.toUpperCase();
        if (/^[A-Z0-9]{3,8}$/.test(v)) set.add(v);
      }
    }
    // Unir mock extras ao conjunto
    for (const p of this.mockExtraPlates) {
      const v = (p || '').toUpperCase();
      if (/^[A-Z0-9]{3,8}$/.test(v)) set.add(v);
    }
    this.allPlates = Array.from(set).sort();
  }

  private initEngateFromRecord(r: FleetRecord): void {
    const tokens = r.veiculo.split(/\s*-\s*|\s+/).filter(Boolean);
    this.engateVehiclePlate = tokens[0] || '';
    // Ajustar tipo inicial de engate conforme registro
    const tp = (r.tipoConjuntoVeiculo || '').toUpperCase();
    this.engateTipo = tp.includes('RODOTREM') ? 'Rodotrem'
                    : tp.includes('BITREM') ? 'Bitrem'
                    : tp.includes('CARRETA') ? 'Carreta'
                    : 'LS';
    const count = this.getEngateSlotCount();
    this.engateSlots = Array(count).fill(null);
    for (let i = 0; i < count; i++) {
      this.engateSlots[i] = tokens[i + 1] || null;
    }
    this.computeAllPlates();
  }

  isPlateAssigned(p: string): boolean { return this.engateSlots.includes(p); }

  assignPlateToSlot(p: string, i: number): void {
    // Se já estiver em outro slot, move
    const currentIdx = this.engateSlots.indexOf(p);
    if (currentIdx >= 0 && currentIdx !== i) {
      this.engateSlots[currentIdx] = null;
    }
    this.engateSlots[i] = p;
  }

  assignToNextSlot(p: string): void {
    if (this.isPlateAssigned(p)) return;
    for (let i = 0; i < this.engateSlots.length; i++) {
      if (!this.engateSlots[i]) { this.engateSlots[i] = p; return; }
    }
  }

  clearSlot(i: number): void { this.engateSlots[i] = null; }
  removePlate(p: string): void {
    const idx = this.engateSlots.indexOf(p);
    if (idx >= 0) this.engateSlots[idx] = null;
  }

  onPlateDragStart(p: string, ev: DragEvent): void {
    ev.dataTransfer?.setData('text/plain', p);
    if (ev.dataTransfer) ev.dataTransfer.effectAllowed = 'move';
  }

  onSlotDragEnter(i: number, ev: DragEvent): void { ev.preventDefault(); this.engateDragOverIndex = i; }
  onSlotDragLeave(i: number): void { if (this.engateDragOverIndex === i) this.engateDragOverIndex = null; }
  onSlotDragOver(i: number, ev: DragEvent): void { ev.preventDefault(); }
  onSlotDrop(i: number, ev: DragEvent): void {
    ev.preventDefault();
    const p = (ev.dataTransfer?.getData('text/plain') || '').trim();
    if (!p) return;
    this.assignPlateToSlot(p, i);
    this.engateDragOverIndex = null;
  }

  onAvailableDragEnter(ev: DragEvent): void { ev.preventDefault(); this.engateDragOverIndex = -1; }
  onAvailableDragLeave(): void { if (this.engateDragOverIndex === -1) this.engateDragOverIndex = null; }
  onAvailableDragOver(ev: DragEvent): void { ev.preventDefault(); }
  onAvailableDrop(ev: DragEvent): void {
    ev.preventDefault();
    const p = (ev.dataTransfer?.getData('text/plain') || '').trim();
    if (!p) return;
    this.removePlate(p);
    this.engateDragOverIndex = null;
  }

  onChangeEngateTipo(type: string): void {
    this.engateTipo = type || '';
    this.computeAllPlates();
  }

  // Sincronização dos campos de Veículo com o board de Engate
  onChangeVeiculo1(value: string): void {
    this.engateVehiclePlate = (value || '').trim().toUpperCase();
  }
  onChangeVeiculo2(value: string): void {
    const v = (value || '').trim().toUpperCase();
    // Garante que o primeiro reboque reflita a segunda placa editada
    if (!this.engateSlots || this.engateSlots.length === 0) {
      this.engateSlots = Array(this.getEngateSlotCount()).fill(null);
    }
    this.engateSlots[0] = v || null;
  }

  fecharVinculoModal(): void { this.vinculoModalOpen = false; }
  setVinculoTab(tab: 'Motorista' | 'Gestor' | 'Engate' | 'TipoConjunto'): void { this.vinculoTab = tab; }
  salvarVinculo(): void {
    console.log('Salvar vínculo', { record: this.selectedRecord, vinculo: this.vinculo, keepMotorista: this.vinculoKeepMotorista, tab: this.vinculoTab, engate: { vehicle: this.engateVehiclePlate, slots: this.engateSlots } });
    this.vinculoModalOpen = false;
  }

  // Métodos para lidar com eventos dos componentes genéricos
  onFiltersChange(filters: any) {
    filters.forEach((filter: any) => {
      switch (filter.key) {
        case 'filtroDataBase':
          this.filtroDataBase = filter.value;
          break;
        case 'filtroFrota':
          this.filtroFrota = filter.value;
          break;
        case 'filtroTipoOperacaoFrota':
          this.filtroTipoOperacaoFrota = filter.value;
          break;
        case 'filtroTipoConjuntoVeiculo':
          this.filtroTipoConjuntoVeiculo = filter.value;
          break;
        case 'filtroSituacaoVeiculo':
          this.filtroSituacaoVeiculo = filter.value;
          break;
        case 'filtroSituacaoMotorista':
          this.filtroSituacaoMotorista = filter.value;
          break;
        case 'filtroCategoriaMotorista':
          this.filtroCategoriaMotorista = filter.value;
          break;
        case 'filtroVeiculo':
          this.filtroVeiculo = filter.value;
          break;
        case 'filtroMotorista':
          this.filtroMotorista = filter.value;
          break;
      }
    });
  }

  onActionButtonClick(action: string) {
    switch (action) {
      case 'addFilter':
        this.adicionarFiltro();
        break;
      case 'clearFilters':
        this.limparFiltros();
        break;
    }
  }

  adicionarFiltro() {
    console.log('Adicionar filtro clicado');
  }

  limparFiltros() {
    this.filtroDataBase = '';
    this.filtroFrota = '';
    this.filtroTipoOperacaoFrota = '';
    this.filtroTipoConjuntoVeiculo = '';
    this.filtroSituacaoVeiculo = '';
    this.filtroSituacaoMotorista = '';
    this.filtroCategoriaMotorista = '';
    this.filtroVeiculo = '';
    this.filtroMotorista = '';
    
    // Atualizar os valores nos arrays de configuração
    this.filters = this.filters.map(filter => ({
      ...filter,
      value: ''
    }));
  }

  // Estado de colapso das seções
  filtersCollapsed = true;
  kpisCollapsed = false;

  // Métodos de toggle das seções
  toggleFilters(): void { this.filtersCollapsed = !this.filtersCollapsed; }
  toggleKpis(): void { this.kpisCollapsed = !this.kpisCollapsed; }

  // Grid padronizado
  gridCollapsed = false;
  gridColumns: GridColumn[] = [
    { key: 'frota', label: 'Frota', sortable: true, width: '100px', align: 'center', sticky: true, stickyLeft: 0 },
    { key: 'veiculo', label: 'Veículo', sortable: true, width: '140px', sticky: true, stickyLeft: 100 },
    { key: 'tipoConjuntoVeiculo', label: 'Tipo Conjunto Veículo', sortable: true, width: '160px', sticky: true, stickyLeft: 240 },
    { key: 'situacaoVeiculo', label: 'Situação Veículo', type: 'status', sortable: true, width: '160px', sticky: true, stickyLeft: 400 },
    { key: 'tipoOperacaoFrota', label: 'Tipo Operação Frota', sortable: true, width: '180px', sticky: true, stickyLeft: 560 },
    { key: 'motorista', label: 'Motorista', sortable: true },
    { key: 'situacaoMotorista', label: 'Situação Motorista', sortable: true },
    { key: 'categoriaMotorista', label: 'Categoria Motorista', sortable: true },
    { key: 'gestor', label: 'Gestor', sortable: true }
  ];

  gridActions: GridAction[] = [
    { action: 'vincular', label: 'Vincular', type: 'primary' }
  ];

  onGridAction(evt: { action: string; row: FleetRecord }): void {
    if (evt.action === 'vincular') {
      this.vincular(evt.row);
    }
  }
}