import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import { ApiService } from '../../core/api.service';
import { FilterSectionComponent, FilterConfig } from '../../shared/components/filter-section/filter-section.component';
import { KpiSectionComponent, KpiConfig } from '../../shared/components/kpi-section/kpi-section.component';

interface EnderecoCompleto { uf: string; cidade: string; rua?: string; numero?: string; bairro?: string; complemento?: string; }
interface IntencaoViagem {
  codigo?: string;
  origem: EnderecoCompleto;
  destino: EnderecoCompleto;
  pesoKg: number;
  tipoCarga?: string;
  dataColeta?: string;
  dataEntrega?: string;
  observacoes?: string;
  valorPreCarga?: number;
  usuarioLancador?: string;
}
interface Veiculo {
  placa: string;
  localizacao: string;
  tipo?: string;
  situacao?: string;
  frotaNumero?: string;
  tipoConjunto?: string;
  ultimaDescarga?: string;
  destinoCidade?: string;
  destinoUf?: string;
  coordenador?: string;
}
interface Vinculo { intencao: IntencaoViagem; veiculo: Veiculo; status: 'pendente' | 'vinculado' | 'em_rota' | 'concluido'; confirmado?: boolean; viagemId?: string; motorista?: string; }

@Component({
  selector: 'erp-controle-intencao-viagem',
  standalone: true,
  imports: [CommonModule, FormsModule, FilterSectionComponent, KpiSectionComponent],
  templateUrl: './controle-intencao-viagem.component.html',
  styleUrls: ['./controle-intencao-viagem.component.scss']
})
export class ControleIntencaoViagemComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly useApi = false;
  selectedTab: 'criar' | 'confirmados' = 'criar';
  filtroOrigem = '';
  filtroDestino = '';
  filtroStatus = 'Todos';
  filtroTipoVeiculo = 'Todos';

  // Estado e configuração do componente de filtros reutilizável
  filtersCollapsed = true;
  filterConfigs: FilterConfig[] = [
    { type: 'text', label: 'Origem', key: 'origem', placeholder: 'UF/Cidade', value: '' },
    { type: 'text', label: 'Destino', key: 'destino', placeholder: 'UF/Cidade', value: '' },
    {
      type: 'select', label: 'Status', key: 'status', placeholder: 'Todos', value: '',
      options: [
        { value: 'pendente', label: 'Pendente' },
        { value: 'vinculado', label: 'Vinculado' },
        { value: 'em_rota', label: 'Em rota' },
        { value: 'concluido', label: 'Concluído' }
      ]
    },
    {
      type: 'select', label: 'Tipo Veículo', key: 'tipoVeiculo', placeholder: 'Todos', value: '',
      options: [
        { value: 'Leve', label: 'Leve' },
        { value: 'VUC', label: 'VUC' },
        { value: 'Toco', label: 'Toco' },
        { value: 'Carreta', label: 'Carreta' }
      ]
    }
  ];

  // KPIs padronizados
  get kpiConfigs(): KpiConfig[] {
    return [
      { label: 'Pré-Cargas', value: this.countIntencoes, icon: 'plus', format: 'number' },
      { label: 'Vinculados', value: this.countVinculados, icon: 'truck', format: 'number' },
      { label: 'Em rota', value: this.countEmRota, icon: 'route', format: 'number' },
      { label: 'Concluídos', value: this.countConcluidos, icon: 'check-circle', format: 'number' },
    ];
  }

  intencoes: IntencaoViagem[] = [];
  veiculos: Veiculo[] = [];
  vinculos: Vinculo[] = [];

  // Veículos disponíveis na aba "Criar vínculos":
  // esconde veículos que possuem ao menos um vínculo confirmado
  get veiculosDisponiveis(): Veiculo[] {
    const bloqueados = new Set<Veiculo>();
    for (const v of this.vinculos) {
      if (v.confirmado) bloqueados.add(v.veiculo);
    }
    const base = this.veiculos.filter(v => !bloqueados.has(v));
    if (this.lockedIntencaoIndex !== null) {
      const i = this.intencoes[this.lockedIntencaoIndex];
      if (i) return base.filter(v => this.isVeiculoProximoDaOrigem(v, i));
    }
    return base;
  }

  selecionadaIntencaoIndex: number | null = null;
  selecionadoVeiculoIndex: number | null = null;
  lockedIntencaoIndex: number | null = null;
  lockedVeiculoIndex: number | null = null;

  private intencoesKey = 'intencoesViagem';
  private vinculosKey = 'controleVinculos';
  private viagensKey = 'viagensData';

  private map?: L.Map;
  private markersLayer: L.LayerGroup = L.layerGroup();
  private routesLayer: L.LayerGroup = L.layerGroup();
  private vinculoMarkerRefs = new Map<number, { origin?: L.Marker; dest?: L.Marker; truck?: L.Marker; route?: L.Polyline }>();

  // Mapa da modal
  private modalMap?: L.Map;
  private modalMarkersLayer: L.LayerGroup = L.layerGroup();
  private modalRoutesLayer: L.LayerGroup = L.layerGroup();
  modalRouteTotalKm: number = 0;
  modalRouteEtaHoras: number = 0;
  modalRouteOrderedPoints: string[] = [];

  private truckIcon: L.DivIcon = L.divIcon({
    className: 'truck-marker-icon',
    html: '<div class="truck-marker">🚚</div>',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });

  private originIcon: L.DivIcon = L.divIcon({
    className: 'poi-icon',
    html: `
      <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,.35));">
        <path d="M12 2l9 4-9 4-9-4 9-4z" fill="#60a5fa" stroke="#ffffff" stroke-width="0.8"/>
        <path d="M21 6v8l-9 4v-8l9-4z" fill="#2563eb" stroke="#ffffff" stroke-width="0.8"/>
        <path d="M3 6v8l9 4v-8L3 6z" fill="#1d4ed8" stroke="#ffffff" stroke-width="0.8"/>
      </svg>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10]
  });
  private destIcon: L.DivIcon = L.divIcon({
    className: 'poi-icon',
    html: `
      <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,.35));">
        <path d="M12 2l9 4-9 4-9-4 9-4z" fill="#fbbf24" stroke="#ffffff" stroke-width="0.8"/>
        <path d="M21 6v8l-9 4v-8l9-4z" fill="#d97706" stroke="#ffffff" stroke-width="0.8"/>
        <path d="M3 6v8l9 4v-8L3 6z" fill="#b45309" stroke="#ffffff" stroke-width="0.8"/>
      </svg>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10]
  });

  private readonly viagemStatuses = ['Em rota', 'Atrasado', 'Pendente', 'Concluído'] as const;
  private typeCheck = null as unknown as (typeof this.viagemStatuses)[number];
  private getViagensFromStorage(): any[] {
    try { const raw = localStorage.getItem(this.viagensKey); return raw ? JSON.parse(raw) : []; } catch { return []; }
  }
  private saveViagens(rows: any[]): void { localStorage.setItem(this.viagensKey, JSON.stringify(rows)); }
  private nextViagemId(existing: any[]): string {
    const prefix = 'VIA-';
    let max = 0;
    for (const r of existing) {
      if (r && typeof r.id === 'string' && r.id.startsWith(prefix)) {
        const num = parseInt(r.id.slice(prefix.length), 10);
        if (!isNaN(num)) max = Math.max(max, num);
      }
    }
    const next = String(max + 1).padStart(4, '0');
    return `${prefix}${next}`;
  }
  private createViagemFromVinculo(v: Vinculo): string {
    const rows = this.getViagensFromStorage();
    const id = this.nextViagemId(rows);
    const origem = `${v.intencao.origem.cidade}${v.intencao.origem.uf ? ' - ' + v.intencao.origem.uf : ''}`;
    const destino = `${v.intencao.destino.cidade}${v.intencao.destino.uf ? ' - ' + v.intencao.destino.uf : ''}`;
    const row = { id, status: 'Pendente', eta: '—', motorista: (v.motorista && v.motorista.trim()) ? v.motorista.trim() : '—', veiculo: v.veiculo.placa || '—', origem, destino };
    rows.unshift(row);
    this.saveViagens(rows);
    return id;
  }

  onSelecionarOuLockarIntencao(index: number): void {
    this.selecionadaIntencaoIndex = index;
    this.lockedIntencaoIndex = this.lockedIntencaoIndex === index ? null : index;
  }

  private isVeiculoProximoDaOrigem(veiculo: Veiculo, intencao: IntencaoViagem): boolean {
    if (!veiculo || !intencao || !intencao.origem) return false;
    const origemUF = (intencao.origem.uf || '').toUpperCase();
    const origemCidade = (intencao.origem.cidade || '').toLowerCase();
    const destCidade = (veiculo.destinoCidade || '').toLowerCase();
    const destUf = (veiculo.destinoUf || this.CITY_TO_UF[veiculo.destinoCidade || ''] || '').toUpperCase();

    // Considera compatível se origem da carga bate com destino do veículo (UF ou cidade)
    if (origemUF && destUf && origemUF === destUf) return true;
    if (origemCidade && destCidade && origemCidade === destCidade) return true;
    return false;
  }

  private isIntencaoProximaDoDestinoVeiculo(intencao: IntencaoViagem, veiculo: Veiculo): boolean {
    if (!veiculo || !intencao || !intencao.origem) return false;
    const origemUF = (intencao.origem.uf || '').toUpperCase();
    const origemCidade = (intencao.origem.cidade || '').toLowerCase();
    const destCidade = (veiculo.destinoCidade || '').toLowerCase();
    const destUf = (veiculo.destinoUf || this.CITY_TO_UF[veiculo.destinoCidade || ''] || '').toUpperCase();

    if (origemUF && destUf && origemUF === destUf) return true;
    if (origemCidade && destCidade && origemCidade === destCidade) return true;
    return false;
  }

  motoristaModalOpen = false;
  motoristaModalForIndex: number | null = null;
  motoristaTemp = '';
  openMotoristaModalFor(idx: number): void { this.motoristaModalForIndex = idx; this.motoristaTemp = this.vinculos[idx]?.motorista || ''; this.motoristaModalOpen = true; }
  closeMotoristaModal(): void { this.motoristaModalOpen = false; this.motoristaModalForIndex = null; this.motoristaTemp = ''; }
  saveMotorista(): void {
    if (this.motoristaModalForIndex === null) return;
    const v = this.vinculos[this.motoristaModalForIndex];
    if (!v) { this.closeMotoristaModal(); return; }
    const nome = (this.motoristaTemp || '').trim();
    if (nome) { v.motorista = nome; this.saveVinculos(); }
    this.closeMotoristaModal();
  }

  private readonly UF_COORDS: Record<string, [number, number]> = {
    'AC': [-10.02, -67.81], 'AL': [-9.65, -35.74], 'AP': [0.04, -51.07], 'AM': [-3.12, -60.02],
    'BA': [-12.97, -38.50], 'CE': [-3.73, -38.52], 'DF': [-15.78, -47.93], 'ES': [-20.32, -40.29],
    'GO': [-16.67, -49.25], 'MA': [-2.53, -44.30], 'MG': [-19.92, -43.94], 'MS': [-20.47, -54.62],
    'MT': [-15.60, -56.10], 'PA': [-1.45, -48.49], 'PB': [-7.12, -34.88], 'PR': [-25.43, -49.27],
    'PE': [-8.05, -34.90], 'PI': [-5.09, -42.80], 'RJ': [-22.90, -43.20], 'RN': [-5.80, -35.21],
    'RO': [-8.76, -63.90], 'RR': [2.82, -60.67], 'RS': [-30.03, -51.23], 'SC': [-27.59, -48.54],
    'SE': [-10.91, -37.07], 'SP': [-23.55, -46.63], 'TO': [-10.18, -48.33]
  };
  private readonly CITY_COORDS: Record<string, [number, number]> = {
    'Sao Paulo': [-23.5505, -46.6333],
    'Rio de Janeiro': [-22.9068, -43.1729],
    'Curitiba': [-25.4284, -49.2733],
    'Joinville': [-26.3044, -48.8487],
    'Caxias do Sul': [-29.1678, -51.1794],
    'Feira de Santana': [-12.2664, -38.9663],
    'Anapolis': [-16.3281, -48.9534],
    'Joao Pessoa': [-7.1153, -34.8610],
    'Uberlandia': [-18.9146, -48.2754],
    'Itacoatiara': [-3.1431, -58.4449],
    'Blumenau': [-26.9155, -49.0707],
    'Sobral': [-3.6891, -40.3480],
    'Belo Horizonte': [-19.9167, -43.9345],
    'Brasilia': [-15.7939, -47.8828],
    'Florianopolis': [-27.5949, -48.5482],
    'Porto Alegre': [-30.0346, -51.2177],
    'Salvador': [-12.9777, -38.5016],
    'Recife': [-8.0476, -34.8770],
    'Fortaleza': [-3.7319, -38.5267],
    'Manaus': [-3.1190, -60.0217],
    'Campinas': [-22.9056, -47.0608],
    'Goiânia': [-16.6869, -49.2648],
    'Goiania': [-16.6869, -49.2648],
    'Sao Luis': [-2.5297, -44.3028],
    'Vitoria': [-20.3155, -40.3128],
    'Maceio': [-9.6658, -35.7350],
    'Aracaju': [-10.9472, -37.0731],
    'Teresina': [-5.0919, -42.8034],
    'Palmas': [-10.1840, -48.3336],
    'Natal': [-5.7945, -35.2110]
  };

  private readonly CITY_TO_UF: Record<string, string> = {
    'São Paulo': 'SP', 'Rio de Janeiro': 'RJ', 'Curitiba': 'PR', 'Porto Alegre': 'RS',
    'Belo Horizonte': 'MG', 'Salvador': 'BA', 'Brasília': 'DF',
    'Joinville': 'SC', 'Caxias do Sul': 'RS', 'Feira de Santana': 'BA', 'Anápolis': 'GO',
    'João Pessoa': 'PB', 'Uberlândia': 'MG', 'Itacoatiara': 'AM', 'Blumenau': 'SC',
    'Sobral': 'CE', 'Campinas': 'SP', 'Goiânia': 'GO', 'São Luís': 'MA',
    'Vitória': 'ES', 'Maceió': 'AL', 'Aracaju': 'SE', 'Teresina': 'PI',
    'Palmas': 'TO', 'Natal': 'RN', 'Florianópolis': 'SC', 'Recife': 'PE', 'Fortaleza': 'CE',
    'Manaus': 'AM'
  };

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    // Inicializa valores dos filtros configurados a partir do estado atual
    this.syncFilterConfigValues();
    this.vinculos = this.getVinculosFromStorage();
    if (this.useApi) { this.loadIntencoesFromApi(); this.loadVeiculosFromApi(); }
    else { this.loadIntencoesMock(); this.loadVeiculosMock(); }
    // Garante que cargas já vinculadas não apareçam em "Disponíveis"
    this.removeLinkedIntencoes();
  }

  get countIntencoes(): number { return this.intencoes.length; }
  // KPI "Vinculados" passa a contar apenas os confirmados
  get countVinculados(): number { return this.vinculos.filter(v => v.confirmado === true).length; }
  get countEmRota(): number { return this.vinculos.filter(v => v.status === 'em_rota').length; }
  get countConcluidos(): number { return this.vinculos.filter(v => v.status === 'concluido').length; }

  dragIntencaoIndex: number | null = null;
  dragOverVeiculoIndex: number | null = null;
  highlightVinculoRef: Vinculo | null = null;

  undoVisible = false;
  private undoTimer: any = null;
  private lastUndo: { intencao: IntencaoViagem; vinculoRef: Vinculo; originalIndex: number } | null = null;

  // Toast simples de sucesso para ações de confirmação
  successVisible = false;
  successMessage = '';
  private successTimer: any = null;
  private showSuccess(msg: string, timeoutMs: number = 2200): void {
    this.successMessage = msg;
    this.successVisible = true;
    if (this.successTimer) { clearTimeout(this.successTimer); }
    this.successTimer = setTimeout(() => { this.successVisible = false; this.successMessage = ''; }, timeoutMs);
  }

  veiculoVinculosModalOpen = false;
  veiculoVinculosModalForIndex: number | null = null;

  ngAfterViewInit(): void {
    // Página principal sem mapa fixo; o mapa agora abre dentro da modal.
    // Mantemos esta verificação caso o elemento exista em versões futuras.
    if (document.getElementById('ctrl-map')) {
      this.initMap();
    }
  }
  ngOnDestroy(): void { if (this.map) { this.map.remove(); this.map = undefined; } }

  getIntencoesFromStorage(): IntencaoViagem[] {
    try {
      const raw = localStorage.getItem(this.intencoesKey);
      const parsed: IntencaoViagem[] = raw ? JSON.parse(raw) as IntencaoViagem[] : [];
      const originalLength = parsed.length;
      if (!parsed.length) return [];

      const usuarios = ['João Silva', 'Maria Souza', 'Carlos Lima', 'Ana Paula', 'Rafael Costa', 'Juliana Alves'];
      const destinosPermitidos = this.getDestinosPermitidosVeiculos();
      const cidadesPermitidas = Array.from(destinosPermitidos.keys());
      const today = new Date();
      let changed = false;

      for (let i = 0; i < parsed.length; i++) {
        const item = parsed[i];
        if (!item) continue;

        // Normaliza cargas antigas: a origem precisa sempre ser uma cidade que exista
        // como destino de algum veículo disponível.
        const origemCidadeAtual = item.origem?.cidade || '';
        if (!destinosPermitidos.has(origemCidadeAtual) && cidadesPermitidas.length > 0) {
          const cidadeSubstituta = cidadesPermitidas[i % cidadesPermitidas.length];
          const ufSubstituta = destinosPermitidos.get(cidadeSubstituta) || 'SP';
          item.origem = { cidade: cidadeSubstituta, uf: ufSubstituta };
          changed = true;
        }

        const offset = i % 7;
        if (!item.dataColeta || !item.dataEntrega) {
          const coleta = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);
          const entrega = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset + 2);
          item.dataColeta = item.dataColeta || coleta.toLocaleDateString('pt-BR');
          item.dataEntrega = item.dataEntrega || entrega.toLocaleDateString('pt-BR');
          changed = true;
        }
        if (item.valorPreCarga == null) {
          const base = item.pesoKg && item.pesoKg > 0 ? item.pesoKg * 3 : 20000;
          item.valorPreCarga = Math.round(base / 100) * 100;
          changed = true;
        }
        if (!item.usuarioLancador) {
          item.usuarioLancador = usuarios[i % usuarios.length];
          changed = true;
        }
      }

      this.ensureCoverageForVehicleDestinations(parsed);
      if (parsed.length !== originalLength) changed = true;

      if (changed) {
        localStorage.setItem(this.intencoesKey, JSON.stringify(parsed));
      }
      return parsed;
    } catch {
      return [];
    }
  }
  private getDestinosPermitidosVeiculos(): Map<string, string> {
    const destinos = new Map<string, string>();
    for (const v of this.defaultVeiculos()) {
      if (v.destinoCidade && v.destinoUf) destinos.set(v.destinoCidade, v.destinoUf);
    }
    return destinos;
  }
  private getCityCoords(uf: string | undefined, cidade: string | undefined): [number, number] | null {
    const cityRaw = (cidade || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const key = cityRaw.replace(/\s+/g, ' ').trim();
    const cityCoords = this.CITY_COORDS[key];
    if (cityCoords) return cityCoords;
    return this.getUFCoords(uf);
  }
  private ensureCoverageForVehicleDestinations(intencoes: IntencaoViagem[]): void {
    const destinosPermitidos = this.getDestinosPermitidosVeiculos();
    const cidadesPermitidas = new Set(Array.from(destinosPermitidos.keys()));
    for (let i = 0; i < intencoes.length; i++) {
      const item = intencoes[i];
      if (!item) continue;
      const cidadeAtual = item.origem?.cidade || '';
      if (!cidadesPermitidas.has(cidadeAtual)) {
        const cidadeSubstituta = Array.from(destinosPermitidos.keys())[i % destinosPermitidos.size];
        const ufSubstituta = destinosPermitidos.get(cidadeSubstituta) || 'SP';
        item.origem = { cidade: cidadeSubstituta, uf: ufSubstituta };
      }
    }
    const existentes = new Set(intencoes.map(i => `${i?.origem?.cidade || ''}|${i?.origem?.uf || ''}`));
    const usuarios = ['João Silva', 'Maria Souza', 'Carlos Lima', 'Ana Paula', 'Rafael Costa', 'Juliana Alves'];
    let idx = 0;
    for (const [cidade, uf] of destinosPermitidos.entries()) {
      const chave = `${cidade}|${uf}`;
      if (existentes.has(chave)) continue;
      const destinosAlternativos = Array.from(destinosPermitidos.entries()).filter(([c]) => c !== cidade);
      const destinoAlt = destinosAlternativos[idx % destinosAlternativos.length] || [cidade, uf];
      intencoes.push({
        origem: { cidade, uf },
        destino: { cidade: destinoAlt[0], uf: destinoAlt[1] },
        pesoKg: 6000 + ((idx % 6) * 1200),
        tipoCarga: ['Geral', 'Frigorificada', 'Granel', 'Perigosa', 'Container'][idx % 5],
        dataColeta: `2${4 + (idx % 5)}/04/2026`,
        dataEntrega: `2${5 + (idx % 5)}/04/2026`,
        valorPreCarga: 18000 + (idx * 2200),
        usuarioLancador: usuarios[idx % usuarios.length]
      });
      existentes.add(chave);
      idx++;
    }
  }
  getVinculosFromStorage(): Vinculo[] {
    try { const raw = localStorage.getItem(this.vinculosKey); return raw ? JSON.parse(raw) as Vinculo[] : []; } catch { return []; }
  }
  saveVinculos(): void { localStorage.setItem(this.vinculosKey, JSON.stringify(this.vinculos)); }
  saveIntencoes(): void { localStorage.setItem(this.intencoesKey, JSON.stringify(this.intencoes)); }

  // Helpers: garantir que intenções já vinculadas não apareçam em "Disponíveis"
  private intencaoEquals(a: IntencaoViagem, b: IntencaoViagem): boolean {
    if (!a || !b) return false;
    if (a.codigo && b.codigo) return a.codigo === b.codigo;
    return a.origem.uf === b.origem.uf && a.origem.cidade === b.origem.cidade &&
           a.destino.uf === b.destino.uf && a.destino.cidade === b.destino.cidade &&
           a.pesoKg === b.pesoKg && (a.tipoCarga || '') === (b.tipoCarga || '');
  }
  private removeLinkedIntencoes(): void {
    this.intencoes = this.intencoes.filter(i => !this.vinculos.some(v => this.intencaoEquals(v.intencao, i)));
  }

  // Handlers do componente de filtros
  onFiltersChange(values: any): void {
    this.filtroOrigem = values?.origem || '';
    this.filtroDestino = values?.destino || '';
    this.filtroStatus = values?.status ? values.status : 'Todos';
    this.filtroTipoVeiculo = values?.tipoVeiculo ? values.tipoVeiculo : 'Todos';
    this.syncFilterConfigValues();
  }
  onApplyFilters(values: any): void {
    this.filtroOrigem = values?.origem || '';
    this.filtroDestino = values?.destino || '';
    this.filtroStatus = values?.status ? values.status : 'Todos';
    this.filtroTipoVeiculo = values?.tipoVeiculo ? values.tipoVeiculo : 'Todos';
    this.syncFilterConfigValues();
  }
  onClearFilters(): void {
    this.filtroOrigem = '';
    this.filtroDestino = '';
    this.filtroStatus = 'Todos';
    this.filtroTipoVeiculo = 'Todos';
    this.filterConfigs = this.filterConfigs.map(f => ({
      ...f,
      value: ''
    }));
  }
  private syncFilterConfigValues(): void {
    // Mantém os valores do componente em sincronia com o estado local
    const map: Record<string, any> = {
      origem: this.filtroOrigem,
      destino: this.filtroDestino,
      status: this.filtroStatus === 'Todos' ? '' : this.filtroStatus,
      tipoVeiculo: this.filtroTipoVeiculo === 'Todos' ? '' : this.filtroTipoVeiculo,
    };
    this.filterConfigs = this.filterConfigs.map(f => ({
      ...f,
      value: map[f.key] ?? ''
    }));
  }

  // A lista de vínculos passa a ser gerenciada e apresentada via modal por veículo.

  getStatusClass(status: Vinculo['status']) { return `status ${status}`; }

  formatValorPreCarga(valor: number | null | undefined): string {
    if (valor == null) return '—';
    try {
      return valor.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    } catch {
      return `R$ ${valor.toFixed(2)}`;
    }
  }

  get preCargasDisponiveis(): IntencaoViagem[] {
    const base = this.intencoes;
    const idx = this.lockedVeiculoIndex;
    if (idx === null || idx === undefined) return base;
    const veiculo = this.veiculos[idx];
    if (!veiculo) return base;
    return base.filter(i => this.isIntencaoProximaDoDestinoVeiculo(i, veiculo));
  }

  onSelecionarOuLockarVeiculo(index: number): void {
    this.selecionadoVeiculoIndex = index;
    this.abrirModalVinculosVeiculo(index);
  }

  onToggleFiltroPorVeiculo(index: number, ev: MouseEvent): void {
    ev.stopPropagation();
    this.lockedVeiculoIndex = this.lockedVeiculoIndex === index ? null : index;
  }

  canVincular(): boolean { return this.selecionadaIntencaoIndex !== null && this.selecionadoVeiculoIndex !== null; }

  vincularSelecionados(): void {
    if (!this.canVincular()) return;
    const intencao = this.intencoes[this.selecionadaIntencaoIndex!];
    // garante código único
    if (!intencao.codigo) { this.ensureIntencoesHaveCodigo(); }
    const veiculo = this.veiculos[this.selecionadoVeiculoIndex!];
    // Cria apenas pré-vínculo (não gera viagem até confirmar)
    const vinculo: Vinculo = { intencao, veiculo, status: 'vinculado', confirmado: false };
    this.vinculos.unshift(vinculo);
    this.saveVinculos();
    // Remove a carga da lista de disponíveis enquanto estiver pré-vinculada
    this.intencoes.splice(this.selecionadaIntencaoIndex!, 1);
    this.saveIntencoes();
    this.showUndo(vinculo, intencao, this.selecionadaIntencaoIndex!);
    this.selecionadaIntencaoIndex = null;
    this.selecionadoVeiculoIndex = null;
  }

  onIntencaoDragStart(idx: number, ev: DragEvent): void { this.dragIntencaoIndex = idx; ev.dataTransfer?.setData('text/plain', String(idx)); }
  onIntencaoDragEnd(): void { this.dragIntencaoIndex = null; }
  onVeiculoDragOver(ev: DragEvent): void { ev.preventDefault(); }
  onVeiculoDragEnter(idx: number): void { this.dragOverVeiculoIndex = idx; }
  onVeiculoDragLeave(idx: number): void { if (this.dragOverVeiculoIndex === idx) this.dragOverVeiculoIndex = null; }
  onVeiculoDrop(veiculoIndex: number): void {
    if (this.dragIntencaoIndex === null) return;
    this.selecionadaIntencaoIndex = this.dragIntencaoIndex;
    this.selecionadoVeiculoIndex = veiculoIndex;
    this.vincularSelecionados();
    this.dragOverVeiculoIndex = null;
  }

  removerVinculo(i: number): void {
    const v = this.vinculos[i];
    if (!v) return;
    this.vinculos.splice(i, 1);
    this.saveVinculos();
    // Ao remover o vínculo, a carga volta para "Disponíveis"
    this.intencoes.unshift(v.intencao);
    this.saveIntencoes();
  }

  private sampleIntencoes(): IntencaoViagem[] {
    return [
      {
        origem: { uf: 'PR', cidade: 'Curitiba' },
        destino: { uf: 'SP', cidade: 'São Paulo' },
        pesoKg: 12000,
        tipoCarga: 'Geral',
        dataColeta: '10/04/2026',
        dataEntrega: '12/04/2026',
        valorPreCarga: 32000,
        usuarioLancador: 'João Silva'
      },
      {
        origem: { uf: 'SP', cidade: 'São Paulo' },
        destino: { uf: 'PR', cidade: 'Curitiba' },
        pesoKg: 8000,
        tipoCarga: 'Frigorificada',
        dataColeta: '11/04/2026',
        dataEntrega: '13/04/2026',
        valorPreCarga: 18500,
        usuarioLancador: 'Maria Souza'
      },
      {
        origem: { uf: 'SC', cidade: 'Joinville' },
        destino: { uf: 'SC', cidade: 'Florianópolis' },
        pesoKg: 16000,
        tipoCarga: 'Granel',
        dataColeta: '09/04/2026',
        dataEntrega: '14/04/2026',
        valorPreCarga: 41000,
        usuarioLancador: 'Carlos Lima'
      },
      {
        origem: { uf: 'RS', cidade: 'Caxias do Sul' },
        destino: { uf: 'RS', cidade: 'Porto Alegre' },
        pesoKg: 7000,
        tipoCarga: 'Geral',
        dataColeta: '08/04/2026',
        dataEntrega: '09/04/2026',
        valorPreCarga: 15500,
        usuarioLancador: 'Ana Paula'
      },
      {
        origem: { uf: 'SP', cidade: 'São Paulo' },
        destino: { uf: 'MG', cidade: 'Belo Horizonte' },
        pesoKg: 5000,
        tipoCarga: 'Perigosa',
        dataColeta: '12/04/2026',
        dataEntrega: '13/04/2026',
        valorPreCarga: 27800,
        usuarioLancador: 'Rafael Costa'
      },
      {
        origem: { uf: 'BA', cidade: 'Feira de Santana' },
        destino: { uf: 'BA', cidade: 'Salvador' },
        pesoKg: 9000,
        tipoCarga: 'Container',
        dataColeta: '13/04/2026',
        dataEntrega: '16/04/2026',
        valorPreCarga: 36500,
        usuarioLancador: 'Juliana Alves'
      },
      {
        origem: { uf: 'GO', cidade: 'Anápolis' },
        destino: { uf: 'DF', cidade: 'Brasília' },
        pesoKg: 11000,
        tipoCarga: 'Geral',
        dataColeta: '07/04/2026',
        dataEntrega: '11/04/2026',
        valorPreCarga: 43800,
        usuarioLancador: 'Fernando Rocha'
      },
      {
        origem: { uf: 'PB', cidade: 'João Pessoa' },
        destino: { uf: 'PE', cidade: 'Recife' },
        pesoKg: 6000,
        tipoCarga: 'Granel',
        dataColeta: '10/04/2026',
        dataEntrega: '11/04/2026',
        valorPreCarga: 16200,
        usuarioLancador: 'Patrícia Mendes'
      },
      {
        origem: { uf: 'MG', cidade: 'Uberlândia' },
        destino: { uf: 'SP', cidade: 'São Paulo' },
        pesoKg: 14000,
        tipoCarga: 'Frigorificada',
        dataColeta: '09/04/2026',
        dataEntrega: '12/04/2026',
        valorPreCarga: 39200,
        usuarioLancador: 'Rodrigo Nunes'
      },
      {
        origem: { uf: 'AM', cidade: 'Itacoatiara' },
        destino: { uf: 'AM', cidade: 'Manaus' },
        pesoKg: 10000,
        tipoCarga: 'Geral',
        dataColeta: '11/04/2026',
        dataEntrega: '14/04/2026',
        valorPreCarga: 27400,
        usuarioLancador: 'Mariana Prado'
      },
      {
        origem: { uf: 'SC', cidade: 'Blumenau' },
        destino: { uf: 'SC', cidade: 'Florianópolis' },
        pesoKg: 8500,
        tipoCarga: 'Granel',
        dataColeta: '08/04/2026',
        dataEntrega: '12/04/2026',
        valorPreCarga: 23100,
        usuarioLancador: 'Gustavo Araujo'
      },
      {
        origem: { uf: 'CE', cidade: 'Sobral' },
        destino: { uf: 'CE', cidade: 'Fortaleza' },
        pesoKg: 7200,
        tipoCarga: 'Perigosa',
        dataColeta: '13/04/2026',
        dataEntrega: '15/04/2026',
        valorPreCarga: 30900,
        usuarioLancador: 'Letícia Moraes'
      },
      {
        origem: { uf: 'AL', cidade: 'Maceió' },
        destino: { uf: 'SE', cidade: 'Aracaju' },
        pesoKg: 9500,
        tipoCarga: 'Container',
        dataColeta: '10/04/2026',
        dataEntrega: '11/04/2026',
        valorPreCarga: 28800,
        usuarioLancador: 'Bruno Ferreira'
      },
      {
        origem: { uf: 'PI', cidade: 'Teresina' },
        destino: { uf: 'MA', cidade: 'São Luís' },
        pesoKg: 6800,
        tipoCarga: 'Geral',
        dataColeta: '09/04/2026',
        dataEntrega: '11/04/2026',
        valorPreCarga: 19400,
        usuarioLancador: 'Renata Lopes'
      },
      {
        origem: { uf: 'TO', cidade: 'Palmas' },
        destino: { uf: 'GO', cidade: 'Goiânia' },
        pesoKg: 12300,
        tipoCarga: 'Granel',
        dataColeta: '07/04/2026',
        dataEntrega: '10/04/2026',
        valorPreCarga: 33600,
        usuarioLancador: 'Eduardo Vieira'
      },
      {
        origem: { uf: 'RS', cidade: 'Porto Alegre' },
        destino: { uf: 'SP', cidade: 'Campinas' },
        pesoKg: 13200,
        tipoCarga: 'Frigorificada',
        dataColeta: '12/04/2026',
        dataEntrega: '15/04/2026',
        valorPreCarga: 41800,
        usuarioLancador: 'Camila Santos'
      }
    ];
  }

  // Adiciona mais intenções de carga (mock) à lista de disponíveis
  addIntencoesExemplo(): void {
    const tipos: string[] = ['Geral', 'Frigorificada', 'Granel', 'Perigosa', 'Container'];
    const usuarios = ['João Silva', 'Maria Souza', 'Carlos Lima', 'Ana Paula', 'Rafael Costa', 'Juliana Alves'];

    const baseVeiculos = (this.veiculos && this.veiculos.length > 0) ? this.veiculos : this.defaultVeiculos();
    const destinosMap = new Map<string, string>();
    for (const v of baseVeiculos) {
      if (v.destinoCidade && v.destinoUf) destinosMap.set(v.destinoCidade, v.destinoUf);
    }
    const cidades = Array.from(destinosMap.keys());

    const existsOrLinked = (i: IntencaoViagem): boolean => {
      const existsInList = this.intencoes.some(x => this.intencaoEquals(x, i));
      const existsLinked = this.vinculos.some(v => this.intencaoEquals(v.intencao, i));
      return existsInList || existsLinked;
    };

    const gerarIntencaoAleatoria = (): IntencaoViagem => {
      const origemCidade = cidades[Math.floor(Math.random() * cidades.length)];
      let destinoCidade = cidades[Math.floor(Math.random() * cidades.length)];
      if (destinoCidade === origemCidade) {
        destinoCidade = cidades[(cidades.indexOf(origemCidade) + 1) % cidades.length];
      }
      const origemUf = destinosMap.get(origemCidade) || 'SP';
      const destinoUf = destinosMap.get(destinoCidade) || origemUf;
      const tipo = tipos[Math.floor(Math.random() * tipos.length)];
      const pesoRaw = 5000 + Math.floor(Math.random() * (18000 - 5000));
      const pesoKg = Math.round(pesoRaw / 100) * 100;
      const hoje = new Date();
      const deltaColeta = Math.floor(Math.random() * 5);
      const deltaEntrega = deltaColeta + 1 + Math.floor(Math.random() * 4);
      const coleta = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + deltaColeta);
      const entrega = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + deltaEntrega);
      const dataColeta = coleta.toLocaleDateString('pt-BR');
      const dataEntrega = entrega.toLocaleDateString('pt-BR');
      const valorPreCarga = 15000 + Math.round(Math.random() * 35000);
      const usuarioLancador = usuarios[Math.floor(Math.random() * usuarios.length)];
      const novo: IntencaoViagem = {
        origem: { uf: origemUf, cidade: origemCidade },
        destino: { uf: destinoUf, cidade: destinoCidade },
        pesoKg,
        tipoCarga: tipo,
        dataColeta,
        dataEntrega,
        valorPreCarga,
        usuarioLancador
      };
      return novo;
    };

    const novas: IntencaoViagem[] = [];
    const alvo = 8; // quantidade de novas intenções
    let tentativas = 0;
    // garante códigos existentes antes de gerar
    this.ensureIntencoesHaveCodigo();
    const usedCodes = new Set(this.getAllIntencaoCodigos());
    while (novas.length < alvo && tentativas < alvo * 10) {
      const cand = gerarIntencaoAleatoria();
      if (!existsOrLinked(cand)) {
        cand.codigo = this.nextIntencaoCodigo(Array.from(usedCodes));
        usedCodes.add(cand.codigo);
        novas.push(cand);
      }
      tentativas++;
    }

    if (novas.length === 0) {
      // fallback: altera pesos das sampleIntencoes para garantir unicidade
      for (const s of this.sampleIntencoes()) {
        const pesoVar = Math.round((s.pesoKg + (Math.floor(Math.random() * 2000) + 500)) / 100) * 100;
        const cand: IntencaoViagem = {
          origem: s.origem,
          destino: s.destino,
          pesoKg: pesoVar,
          tipoCarga: s.tipoCarga,
          dataColeta: s.dataColeta,
          dataEntrega: s.dataEntrega,
          valorPreCarga: s.valorPreCarga,
          usuarioLancador: s.usuarioLancador
        };
        if (!existsOrLinked(cand)) novas.push(cand);
        if (novas.length >= alvo) break;
      }
    }

    // Insere novas intenções no topo e salva
    if (novas.length > 0) {
      // atribui códigos aos novos candidatos se faltou
      for (const n of novas) { if (!n.codigo) { n.codigo = this.nextIntencaoCodigo(Array.from(usedCodes)); usedCodes.add(n.codigo!); } }
      this.intencoes = [...novas, ...this.intencoes];
      this.saveIntencoes();
    }
  }

  private getAllIntencaoCodigos(): string[] {
    const codes: string[] = [];
    for (const i of this.intencoes) { if (i && i.codigo) codes.push(i.codigo); }
    for (const v of this.vinculos) { if (v && v.intencao && v.intencao.codigo) codes.push(v.intencao.codigo!); }
    return codes;
  }
  private nextIntencaoCodigo(existing: string[]): string {
    const prefix = 'INT-';
    let max = 0;
    for (const c of existing) {
      if (c && c.startsWith(prefix)) {
        const num = parseInt(c.slice(prefix.length), 10);
        if (!isNaN(num)) max = Math.max(max, num);
      }
    }
    const next = String(max + 1).padStart(4, '0');
    return `${prefix}${next}`;
  }
  private ensureIntencoesHaveCodigo(): void {
    const used = new Set(this.getAllIntencaoCodigos());
    // atribui códigos às intenções sem código
    for (const i of this.intencoes) {
      if (!i.codigo) { const code = this.nextIntencaoCodigo(Array.from(used)); i.codigo = code; used.add(code); }
    }
    // também garante para vínculos antigos
    for (const v of this.vinculos) {
      if (v.intencao && !v.intencao.codigo) {
        const code = this.nextIntencaoCodigo(Array.from(used));
        v.intencao.codigo = code; used.add(code);
      }
    }
    this.saveIntencoes(); this.saveVinculos();
  }

  // Exclui um vínculo confirmado e devolve a intenção para disponíveis
  excluirVinculoConfirmado(i: number): void {
    const v = this.vinculos[i];
    if (!v || !v.confirmado) return;
    // Remove viagem associada, se existir
    if (v.viagemId) {
      const rows = this.getViagensFromStorage();
      const filtradas = rows.filter(r => r && r.id !== v.viagemId);
      this.saveViagens(filtradas);
    }
    // Remove o vínculo e devolve a carga
    this.vinculos.splice(i, 1);
    this.saveVinculos();
    this.intencoes.unshift(v.intencao);
    this.saveIntencoes();
  }
  addSampleIntencao(): void { this.intencoes.unshift(this.sampleIntencoes()[Math.floor(Math.random()*3)]); this.saveIntencoes(); }
  private loadIntencoesMock(): void {
    const data = this.getIntencoesFromStorage();
    this.intencoes = data.length ? data : this.sampleIntencoes();
    // Garante cobertura mesmo quando está começando do zero (sem storage)
    this.ensureCoverageForVehicleDestinations(this.intencoes);
    this.ensureIntencoesHaveCodigo();
  }
  private loadVeiculosMock(): void { this.veiculos = this.defaultVeiculos(); }

  private loadIntencoesFromApi(): void {
    this.api.get('/intencoes-viagem').subscribe({ next: (resp: any) => {
      if (Array.isArray(resp)) { this.intencoes = resp as IntencaoViagem[]; } else if (resp && Array.isArray(resp.data)) { this.intencoes = resp.data as IntencaoViagem[]; }
      this.ensureIntencoesHaveCodigo();
    }, error: () => { this.loadIntencoesMock(); } });
  }
  private loadVeiculosFromApi(): void {
    this.api.get('/veiculos').subscribe({ next: (resp: any) => {
      if (Array.isArray(resp)) { this.veiculos = resp as Veiculo[]; } else if (resp && Array.isArray(resp.data)) { this.veiculos = resp.data as Veiculo[]; }
    }, error: () => { this.loadVeiculosMock(); } });
  }
  private defaultVeiculos(): Veiculo[] {
    return [
      {
        placa: 'ABC1D23',
        localizacao: 'São Paulo',
        tipo: 'Toco',
        frotaNumero: '1075',
        tipoConjunto: 'Toco',
        ultimaDescarga: '24/04/2026',
        destinoCidade: 'Curitiba',
        destinoUf: 'PR',
        coordenador: 'Bruno Ferreira'
      },
      {
        placa: 'DEF4G56',
        localizacao: 'Rio de Janeiro',
        tipo: 'Carreta',
        frotaNumero: '2089',
        tipoConjunto: 'Carreta LS',
        ultimaDescarga: '25/04/2026',
        destinoCidade: 'São Paulo',
        destinoUf: 'SP',
        coordenador: 'Mariana Prado'
      },
      {
        placa: 'JKL7M89',
        localizacao: 'Curitiba',
        tipo: 'VUC',
        frotaNumero: '3124',
        tipoConjunto: 'VUC',
        ultimaDescarga: '26/04/2026',
        destinoCidade: 'Joinville',
        destinoUf: 'SC',
        coordenador: 'Rafael Costa'
      },
      {
        placa: 'PQR1S23',
        localizacao: 'Porto Alegre',
        tipo: 'Leve',
        frotaNumero: '1542',
        tipoConjunto: 'HR',
        ultimaDescarga: '27/04/2026',
        destinoCidade: 'Caxias do Sul',
        destinoUf: 'RS',
        coordenador: 'Ana Paula'
      },
      {
        placa: 'TUV2W34',
        localizacao: 'Belo Horizonte',
        tipo: 'Carreta',
        frotaNumero: '2210',
        tipoConjunto: 'Carreta LS',
        ultimaDescarga: '28/04/2026',
        destinoCidade: 'São Paulo',
        destinoUf: 'SP',
        coordenador: 'João Silva'
      },
      {
        placa: 'XYZ5A67',
        localizacao: 'Salvador',
        tipo: 'Toco',
        frotaNumero: '1987',
        tipoConjunto: 'Toco',
        ultimaDescarga: '29/04/2026',
        destinoCidade: 'Feira de Santana',
        destinoUf: 'BA',
        coordenador: 'Carlos Lima'
      },
      {
        placa: 'BCD8E90',
        localizacao: 'Brasília',
        tipo: 'VUC',
        frotaNumero: '2451',
        tipoConjunto: 'VUC',
        ultimaDescarga: '30/04/2026',
        destinoCidade: 'Anápolis',
        destinoUf: 'GO',
        coordenador: 'Juliana Alves'
      },
      {
        placa: 'FGH3I45',
        localizacao: 'Recife',
        tipo: 'Leve',
        frotaNumero: '1760',
        tipoConjunto: 'Leve',
        ultimaDescarga: '01/05/2026',
        destinoCidade: 'João Pessoa',
        destinoUf: 'PB',
        coordenador: 'Gustavo Araujo'
      },
      {
        placa: 'JKM6N78',
        localizacao: 'Goiânia',
        tipo: 'Carreta',
        frotaNumero: '2333',
        tipoConjunto: 'Carreta LS',
        ultimaDescarga: '02/05/2026',
        destinoCidade: 'Uberlândia',
        destinoUf: 'MG',
        coordenador: 'Patrícia Mendes'
      },
      {
        placa: 'OPQ9R12',
        localizacao: 'Manaus',
        tipo: 'Toco',
        frotaNumero: '1902',
        tipoConjunto: 'Toco',
        ultimaDescarga: '03/05/2026',
        destinoCidade: 'Itacoatiara',
        destinoUf: 'AM',
        coordenador: 'Renata Lopes'
      },
      {
        placa: 'STU3V56',
        localizacao: 'Florianópolis',
        tipo: 'Leve',
        frotaNumero: '1675',
        tipoConjunto: 'Leve',
        ultimaDescarga: '04/05/2026',
        destinoCidade: 'Blumenau',
        destinoUf: 'SC',
        coordenador: 'Eduardo Vieira'
      },
      {
        placa: 'WXY7Z89',
        localizacao: 'Fortaleza',
        tipo: 'VUC',
        frotaNumero: '2144',
        tipoConjunto: 'VUC',
        ultimaDescarga: '05/05/2026',
        destinoCidade: 'Sobral',
        destinoUf: 'CE',
        coordenador: 'Camila Santos'
      }
    ];
  }

  // Ordenação removida: as listas usam a ordem natural dos arrays.

  private showUndo(vinculoRef: Vinculo, intencao: IntencaoViagem, originalIndex: number): void {
    this.highlightVinculoRef = vinculoRef;
    this.undoVisible = true;
    this.lastUndo = { intencao, vinculoRef, originalIndex };
    if (this.undoTimer) clearTimeout(this.undoTimer);
    this.undoTimer = setTimeout(()=> this.clearUndo(), 4000);
  }
  clearUndo(): void { this.undoVisible = false; this.highlightVinculoRef = null; }
  undoLinking(): void {
    if (!this.lastUndo) return;
    const { intencao, vinculoRef, originalIndex } = this.lastUndo;
    const idx = this.vinculos.indexOf(vinculoRef);
    if (idx >= 0) this.vinculos.splice(idx,1);
    this.intencoes.splice(originalIndex, 0, intencao);
    this.saveVinculos(); this.saveIntencoes();
    this.clearUndo();
  }

  vinculosCountDoVeiculo(veiculoIndex: number): number { return this.vinculos.filter(v => this.veiculos.indexOf(v.veiculo) === veiculoIndex).length; }
  vinculosPendentesCountDoVeiculo(veiculoIndex: number): number {
    return this.vinculos.filter(v => this.veiculos.indexOf(v.veiculo) === veiculoIndex && v.status === 'vinculado' && !v.confirmado).length;
  }
  abrirModalVinculosVeiculo(veiculoIndex: number): void {
    this.veiculoVinculosModalForIndex = veiculoIndex;
    this.veiculoVinculosModalOpen = true;
    // Aguarda render da modal para inicializar mapa interno
    setTimeout(() => this.initModalMap(), 0);
  }
  fecharModalVinculosVeiculo(): void {
    this.veiculoVinculosModalOpen = false;
    this.veiculoVinculosModalForIndex = null;
    this.destroyModalMap();
  }
  get modalVinculos(): { i: number; v: Vinculo }[] { return this.vinculos.map((v, i) => ({ i, v })).filter(x => this.veiculos.indexOf(x.v.veiculo) === this.veiculoVinculosModalForIndex); }

  iniciarRota(i: number): void { const v = this.vinculos[i]; if (!v) return; v.status = 'em_rota'; this.saveVinculos(); }
  concluirVinculo(i: number): void { const v = this.vinculos[i]; if (!v) return; v.status = 'concluido'; this.saveVinculos(); }
  confirmarVinculo(i: number): void { const v = this.vinculos[i]; if (!v) return; v.confirmado = true; this.saveVinculos(); this.openMotoristaModalFor(i); }
  confirmarComMotorista(): void { this.saveMotorista(); }

  verNoMapa(i: number): void {
    if (this.veiculoVinculosModalOpen && this.modalMap) {
      const v = this.vinculos[i];
      if (!v) return;
      const oc = this.getCityCoords(v.intencao.origem.uf, v.intencao.origem.cidade);
      const dc = this.getCityCoords(v.intencao.destino.uf, v.intencao.destino.cidade);
      const pts: L.LatLngExpression[] = [];
      if (oc) pts.push(oc);
      if (dc) pts.push(dc);
      if (pts.length) {
        const group = L.featureGroup(pts.map(p => L.marker(p)));
        this.modalMap.fitBounds(group.getBounds().pad(0.35));
      }
    } else {
      this.focusVinculo(i);
    }
  }
  resetView(): void { if (!this.map) return; this.map.setView([-14.235004, -51.92528], 4); }
  zoomIn(): void { const z = this.map?.getZoom() || 4; this.map?.setZoom(z+1); }
  zoomOut(): void { const z = this.map?.getZoom() || 4; this.map?.setZoom(z-1); }

  private initMap(): void {
    this.map = L.map('ctrl-map', { zoomControl: false }).setView([-14.235004, -51.92528], 4);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(this.map);
    this.markersLayer.addTo(this.map);
    this.routesLayer.addTo(this.map);
    this.renderMap();
  }
  private getCoordsForVehicle(v: Veiculo): [number, number] | null {
    const loc = v.localizacao || '';
    const uf = this.CITY_TO_UF[loc] || v.destinoUf || '';
    return this.getCityCoords(uf, loc);
  }
  private getCoordsForVeiculoDestino(v: Veiculo): [number, number] | null {
    const destUf = v.destinoUf || this.CITY_TO_UF[v.destinoCidade || ''] || '';
    return this.getCityCoords(destUf, v.destinoCidade);
  }
  private initModalMap(): void {
    if (!this.veiculoVinculosModalOpen) return;
    this.modalRouteTotalKm = 0;
    this.modalRouteEtaHoras = 0;
    this.modalRouteOrderedPoints = [];
    this.modalMap = L.map('modal-map', { zoomControl: false }).setView([-14.235004, -51.92528], 4);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(this.modalMap);
    this.modalMarkersLayer.addTo(this.modalMap);
    this.modalRoutesLayer.addTo(this.modalMap);
    this.renderModalMap();
  }
  private renderModalMap(): void {
    if (!this.modalMap) return;
    this.modalMarkersLayer.clearLayers();
    this.modalRoutesLayer.clearLayers();
    const idx = this.veiculoVinculosModalForIndex;
    if (idx === null || idx === undefined) return;
    const veiculo = this.veiculos[idx];
    const vCoords = this.getCoordsForVehicle(veiculo);
    const vDestCoords = this.getCoordsForVeiculoDestino(veiculo);
    const bounds: L.LatLngExpression[] = [];
    const startMarkerCoords = vDestCoords || vCoords;
    if (startMarkerCoords) {
      const truck = L.marker(startMarkerCoords, { icon: this.truckIcon }).addTo(this.modalMarkersLayer);
      bounds.push(truck.getLatLng());
    }
    // A ordem visual dos vínculos usa unshift (mais novo primeiro). Para a rota,
    // usamos a ordem real de vinculação: do mais antigo para o mais novo.
    const vincs = this.getModalVinculosOrdered();

    for (const v of vincs) {
      const oc = this.getCityCoords(v.intencao.origem.uf, v.intencao.origem.cidade);
      const dc = this.getCityCoords(v.intencao.destino.uf, v.intencao.destino.cidade);
      if (oc) {
        const m = L.marker(oc, { icon: this.originIcon }).addTo(this.modalMarkersLayer);
        bounds.push(m.getLatLng());
      }
      if (dc) {
        const m = L.marker(dc, { icon: this.destIcon }).addTo(this.modalMarkersLayer);
        bounds.push(m.getLatLng());
      }
    }

    const firstOrigCoords = vincs.length
      ? this.getCityCoords(vincs[0].intencao.origem.uf, vincs[0].intencao.origem.cidade)
      : null;
    const start = vDestCoords || vCoords || firstOrigCoords;
    const plan = start ? this.buildGreedyRoutePlan(vincs, start) : [];
    this.modalRouteOrderedPoints = plan.map(p => p.label);
    const routeWaypoints = plan.map(p => p.coords);

    let totalKm = 0;
    for (let i = 0; i < routeWaypoints.length - 1; i++) {
      totalKm += this.distanceKm(routeWaypoints[i], routeWaypoints[i + 1]);
    }
    this.modalRouteTotalKm = Math.round(totalKm);
    const velocidadeMedia = 60;
    this.modalRouteEtaHoras = totalKm > 0 ? +(totalKm / velocidadeMedia).toFixed(1) : 0;
    if (routeWaypoints.length >= 2) {
      L.polyline(routeWaypoints as L.LatLngExpression[], { color: '#2563eb', weight: 4, opacity: 0.9 }).addTo(this.modalRoutesLayer);
    }
    // Ajuste de zoom: se não há cargas vinculadas, mostrar somente o veículo
    // com um zoom padrão (não máximo). Caso contrário, ajustar aos marcadores.
    if (vincs.length === 0 && vCoords) {
      this.modalMap.setView(vCoords, 6);
    } else if (bounds.length) {
      const group = L.featureGroup(bounds.map(p => L.marker(p)));
      this.modalMap.fitBounds(group.getBounds().pad(0.35));
    }
  }

  private buildGreedyRoutePlan(vincs: Vinculo[], start: [number, number]): Array<{ coords: [number, number]; label: string }> {
    type RouteLoad = {
      origemCoords: [number, number] | null;
      destinoCoords: [number, number] | null;
      origemLabel: string;
      destinoLabel: string;
      origemVisitada: boolean;
      destinoVisitado: boolean;
    };

    const loads: RouteLoad[] = vincs.map(v => ({
      origemCoords: this.getCityCoords(v.intencao.origem.uf, v.intencao.origem.cidade),
      destinoCoords: this.getCityCoords(v.intencao.destino.uf, v.intencao.destino.cidade),
      origemLabel: `Origem: ${v.intencao.origem.cidade} - ${v.intencao.origem.uf}`,
      destinoLabel: `Destino: ${v.intencao.destino.cidade} - ${v.intencao.destino.uf}`,
      origemVisitada: false,
      destinoVisitado: false
    }));

    const ordered: Array<{ coords: [number, number]; label: string }> = [
      { coords: start, label: 'Inicio do veiculo' }
    ];
    let current = start;

    while (loads.some(l => !l.destinoVisitado)) {
      let best:
        | { idx: number; tipo: 'origem' | 'destino'; coords: [number, number]; label: string; distance: number }
        | null = null;

      for (let i = 0; i < loads.length; i++) {
        const load = loads[i];
        if (!load.origemVisitada && load.origemCoords) {
          const d = this.distanceKm(current, load.origemCoords);
          if (!best || d < best.distance) {
            best = { idx: i, tipo: 'origem', coords: load.origemCoords, label: load.origemLabel, distance: d };
          }
        }
        if (load.origemVisitada && !load.destinoVisitado && load.destinoCoords) {
          const d = this.distanceKm(current, load.destinoCoords);
          if (!best || d < best.distance) {
            best = { idx: i, tipo: 'destino', coords: load.destinoCoords, label: load.destinoLabel, distance: d };
          }
        }
      }

      if (!best) break;

      const samePoint = best.coords[0] === current[0] && best.coords[1] === current[1];
      if (!samePoint) {
        ordered.push({ coords: best.coords, label: best.label });
        current = best.coords;
      }

      if (best.tipo === 'origem') loads[best.idx].origemVisitada = true;
      else loads[best.idx].destinoVisitado = true;
    }

    return ordered;
  }

  // Ordena pontos pelo vizinho mais próximo, iniciando em start
  private orderByNearest(start: [number, number], points: [number, number][]): [number, number][] {
    const remaining = points.slice();
    const ordered: [number, number][] = [];
    let current = start;
    while (remaining.length) {
      let bestIdx = 0;
      let bestDist = Number.POSITIVE_INFINITY;
      for (let i = 0; i < remaining.length; i++) {
        const d = this.distanceKm(current, remaining[i]);
        if (d < bestDist) { bestDist = d; bestIdx = i; }
      }
      const next = remaining.splice(bestIdx, 1)[0];
      ordered.push(next);
      current = next;
    }
    return ordered;
  }

  // Distância aproximada (Haversine) em km
  private distanceKm(a: [number, number], b: [number, number]): number {
    const R = 6371; // km
    const toRad = (x: number) => x * Math.PI / 180;
    const dLat = toRad(b[0] - a[0]);
    const dLon = toRad(b[1] - a[1]);
    const lat1 = toRad(a[0]);
    const lat2 = toRad(b[0]);
    const sinDLat = Math.sin(dLat / 2);
    const sinDLon = Math.sin(dLon / 2);
    const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
    const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
    return R * c;
  }
  private destroyModalMap(): void {
    if (this.modalMap) { this.modalMap.remove(); this.modalMap = undefined; }
  }
  private getUFCoords(uf: string | undefined): [number, number] | null { const c = this.UF_COORDS[uf || '']; return c || null; }
  private getRouteColor(status: Vinculo['status']): string {
    switch (status) { case 'em_rota': return '#22c55e'; case 'vinculado': return '#3b82f6'; case 'concluido': return '#64748b'; default: return '#a3a3a3'; }
  }

  // Capacidade por tipo de veículo (kg)
  private readonly VEICULO_CAPACIDADE_KG: Record<string, number> = {
    carreta: 30000,
    toco: 16000,
    vuc: 8000,
    leve: 5000
  };
  getVehicleCapacityKg(v: Veiculo): number {
    const tipo = (v.tipo || '').toLowerCase();
    return this.VEICULO_CAPACIDADE_KG[tipo] || 10000;
  }
  getPreVinculadosCountForVehicleIndex(idx: number): number {
    return this.vinculos.filter(v => this.veiculos.indexOf(v.veiculo) === idx && v.status === 'vinculado').length;
  }
  getPreVinculadosPesoKgForVehicleIndex(idx: number): number {
    return this.vinculos
      .filter(v => this.veiculos.indexOf(v.veiculo) === idx && v.status === 'vinculado')
      .reduce((sum, v) => sum + (v.intencao.pesoKg || 0), 0);
  }
  private getModalVinculosOrdered(): Vinculo[] {
    const idx = this.veiculoVinculosModalForIndex;
    if (idx === null || idx === undefined) return [];
    return this.vinculos.filter(v => this.veiculos.indexOf(v.veiculo) === idx).slice().reverse();
  }
  get modalResumoValorTotal(): number {
    return this.getModalVinculosOrdered().reduce((sum, v) => sum + (v.intencao?.valorPreCarga || 0), 0);
  }
  get modalResumoOrigemInicial(): string {
    const first = this.getModalVinculosOrdered()[0];
    if (!first?.intencao?.origem) return '—';
    return `${first.intencao.origem.cidade} - ${first.intencao.origem.uf}`;
  }
  get modalResumoDestinoFinal(): string {
    const ordered = this.getModalVinculosOrdered();
    const last = ordered.length ? ordered[ordered.length - 1] : null;
    if (!last?.intencao?.destino) return '—';
    return `${last.intencao.destino.cidade} - ${last.intencao.destino.uf}`;
  }
  get modalResumoDataColetaInicial(): string {
    const first = this.getModalVinculosOrdered()[0];
    return first?.intencao?.dataColeta || '—';
  }
  get modalResumoDataEntregaFinal(): string {
    const ordered = this.getModalVinculosOrdered();
    const last = ordered.length ? ordered[ordered.length - 1] : null;
    return last?.intencao?.dataEntrega || '—';
  }
  getCapacidadeUsoPercentForVehicleIndex(idx: number): number {
    const veiculo = this.veiculos[idx];
    if (!veiculo) return 0;
    const capacidade = this.getVehicleCapacityKg(veiculo);
    const carga = this.getPreVinculadosPesoKgForVehicleIndex(idx);
    const pct = capacidade > 0 ? (carga / capacidade) * 100 : 0;
    return Math.max(0, Math.min(100, Math.round(pct)));
  }

  isCapacidadeExcedidaForVehicleIndex(idx: number): boolean {
    const veiculo = this.veiculos[idx];
    if (!veiculo) return false;
    const capacidade = this.getVehicleCapacityKg(veiculo);
    const carga = this.getPreVinculadosPesoKgForVehicleIndex(idx);
    return capacidade > 0 && carga > capacidade;
  }

  confirmarTodosVinculosVeiculo(): void {
    const idx = this.veiculoVinculosModalForIndex;
    if (idx === null || idx === undefined) return;
    let alterou = false;
    for (let i = 0; i < this.vinculos.length; i++) {
      const v = this.vinculos[i];
      if (this.veiculos.indexOf(v.veiculo) === idx && v.status === 'vinculado' && !v.confirmado) {
        // Ao confirmar, gera a viagem se ainda não existir
        if (!v.viagemId) { v.viagemId = this.createViagemFromVinculo(v); }
        v.confirmado = true;
        alterou = true;
      }
    }
    if (alterou) {
      this.saveVinculos();
      this.showSuccess('Vínculos confirmados com sucesso.');
      this.fecharModalVinculosVeiculo();
    }
  }

  getConfirmadosCountForVehicleIndex(idx: number): number {
    return this.vinculos.filter(v => this.veiculos.indexOf(v.veiculo) === idx && v.confirmado === true).length;
  }
  get confirmedVinculos(): { i: number; v: Vinculo }[] {
    return this.vinculos.map((v, i) => ({ i, v })).filter(x => x.v.confirmado === true);
  }
  // Agrupamento: vínculos confirmados por veículo (para cards "pai" com filhos)
  get confirmedGroups(): { veiculo: Veiculo; items: { i: number; v: Vinculo }[] }[] {
    const groups = new Map<Veiculo, { veiculo: Veiculo; items: { i: number; v: Vinculo }[] }>();
    for (let i = 0; i < this.vinculos.length; i++) {
      const v = this.vinculos[i];
      if (!v || !v.confirmado) continue;
      const key = v.veiculo;
      if (!groups.has(key)) groups.set(key, { veiculo: key, items: [] });
      groups.get(key)!.items.push({ i, v });
    }
    return Array.from(groups.values());
  }
  getPesoTotalGrupo(items: { i: number; v: Vinculo }[]): number {
    return items.reduce((acc, it) => acc + (it.v.intencao?.pesoKg || 0), 0);
  }
  private isSameVeiculo(a?: Veiculo, b?: Veiculo): boolean { return !!a && !!b && a.placa === b.placa; }
  excluirGrupoConfirmado(veiculo: Veiculo): void {
    if (!veiculo) return;
    const removidos: Vinculo[] = [];
    const manter: Vinculo[] = [];
    for (const v of this.vinculos) {
      if (v && v.confirmado && this.isSameVeiculo(v.veiculo, veiculo)) {
        // remover viagem associada, se existir
        if (v.viagemId) {
          const rows = this.getViagensFromStorage();
          const filtradas = rows.filter(r => r && r.id !== v.viagemId);
          this.saveViagens(filtradas);
        }
        removidos.push(v);
      } else {
        manter.push(v);
      }
    }
    if (removidos.length) {
      this.vinculos = manter;
      this.saveVinculos();
      // Devolve pré-cargas removidas para disponíveis
      for (const v of removidos) { this.intencoes.unshift(v.intencao); }
      this.saveIntencoes();
      this.showSuccess('Grupo removido. Pré-cargas devolvidas.');
    }
  }
  private renderMap(): void {
    if (!this.map) return;
    this.markersLayer.clearLayers();
    this.routesLayer.clearLayers();
    this.vinculoMarkerRefs.clear();
    for (let i = 0; i < this.vinculos.length; i++) {
      const v = this.vinculos[i];
      const oc = this.getUFCoords(v.intencao.origem.uf);
      const dc = this.getUFCoords(v.intencao.destino.uf);
      if (oc) { const m = L.marker(oc, { icon: this.originIcon }).addTo(this.markersLayer); m.bindPopup(`Origem: ${v.intencao.origem.cidade} - ${v.intencao.origem.uf}`); this.vinculoMarkerRefs.set(i, { ...this.vinculoMarkerRefs.get(i), origin: m }); }
      if (dc) { const m = L.marker(dc, { icon: this.destIcon }).addTo(this.markersLayer); m.bindPopup(`Destino: ${v.intencao.destino.cidade} - ${v.intencao.destino.uf}`); this.vinculoMarkerRefs.set(i, { ...this.vinculoMarkerRefs.get(i), dest: m }); }
      if (oc && dc) {
        const route = L.polyline([oc, dc], { color: this.getRouteColor(v.status), weight: 3 }).addTo(this.routesLayer);
        const mid: [number, number] = [(oc[0]+dc[0])/2, (oc[1]+dc[1])/2];
        const truck = L.marker(mid, { icon: this.truckIcon }).addTo(this.markersLayer);
        this.vinculoMarkerRefs.set(i, { ...this.vinculoMarkerRefs.get(i), route, truck });
      }
    }
  }
  private focusVinculo(i: number): void {
    const ref = this.vinculoMarkerRefs.get(i);
    if (!ref || !this.map) return;
    const pts: L.LatLngExpression[] = [];
    if (ref.origin) pts.push(ref.origin.getLatLng());
    if (ref.dest) pts.push(ref.dest.getLatLng());
    if (pts.length) { const group = L.featureGroup(pts.map(p => L.marker(p))); this.map.fitBounds(group.getBounds().pad(0.4)); }
  }
}
