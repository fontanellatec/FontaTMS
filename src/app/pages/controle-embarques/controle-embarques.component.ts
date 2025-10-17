import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import { ApiService } from '../../core/api.service';

// Interfaces compatíveis com a tela de Intenção de Embarque
interface EnderecoCompleto { uf: string; cidade: string; rua?: string; numero?: string; bairro?: string; complemento?: string; }
interface IntencaoEmbarque { origem: EnderecoCompleto; destino: EnderecoCompleto; pesoKg: number; tipoCarga?: string; dataColeta?: string; dataEntrega?: string; observacoes?: string; }

// Veículos disponíveis (placeholder até integração real)
interface Veiculo { placa: string; localizacao: string; tipo?: string; situacao?: string; }

// Vínculo entre intenção e veículo
interface Vinculo { intencao: IntencaoEmbarque; veiculo: Veiculo; status: 'pendente' | 'vinculado' | 'em_rota' | 'concluido'; confirmado?: boolean; embarqueId?: string; motorista?: string; }

@Component({
  selector: 'erp-controle-embarques',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './controle-embarques.component.html',
  styleUrls: ['./controle-embarques.component.scss']
})
export class ControleEmbarquesComponent implements OnInit, AfterViewInit, OnDestroy {
  // Define o modo de dados: API real ou mock local
  private readonly useApi = false;
  // Filtros básicos
  filtroOrigem = '';
  filtroDestino = '';
  filtroStatus = 'Todos';
  filtroTipoVeiculo = 'Todos';

  // Dados
  intencoes: IntencaoEmbarque[] = [];
  veiculos: Veiculo[] = [];
  vinculos: Vinculo[] = [];

  // Seleções
  selecionadaIntencaoIndex: number | null = null;
  selecionadoVeiculoIndex: number | null = null;

  private intencoesKey = 'intencoesEmbarque';
  private vinculosKey = 'controleVinculos';
  private shipmentsKey = 'shipmentsData';

  // Mapa Leaflet
  private map?: L.Map;
  private markersLayer: L.LayerGroup = L.layerGroup();
  private routesLayer: L.LayerGroup = L.layerGroup();
  private vinculoMarkerRefs = new Map<number, { origin?: L.Marker; dest?: L.Marker; truck?: L.Marker; route?: L.Polyline }>();

  // Ícone personalizado: caminhão (DivIcon)
  private truckIcon: L.DivIcon = L.divIcon({
    className: 'truck-marker-icon',
    html: '<div class="truck-marker">🚚</div>',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });

  // Ícones personalizados: origem/destino (intenções)
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

  // Tipos mínimos para integração com tela de Embarques
  private readonly shipmentStatuses = ['Em rota', 'Atrasado', 'Pendente', 'Concluído'] as const;
  private typeCheck = null as unknown as (typeof this.shipmentStatuses)[number];
  private getShipmentsFromStorage(): any[] {
    try {
      const raw = localStorage.getItem(this.shipmentsKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
  private saveShipments(rows: any[]): void {
    localStorage.setItem(this.shipmentsKey, JSON.stringify(rows));
  }
  private nextShipmentId(existing: any[]): string {
    const prefix = 'EMB-';
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
  private createShipmentFromVinculo(v: Vinculo): string {
    const rows = this.getShipmentsFromStorage();
    const id = this.nextShipmentId(rows);
    const origem = `${v.intencao.origem.cidade}${v.intencao.origem.uf ? ' - ' + v.intencao.origem.uf : ''}`;
    const destino = `${v.intencao.destino.cidade}${v.intencao.destino.uf ? ' - ' + v.intencao.destino.uf : ''}`;
    const row = {
      id,
      status: 'Pendente',
      eta: '—',
      motorista: (v.motorista && v.motorista.trim()) ? v.motorista.trim() : '—',
      veiculo: v.veiculo.placa || '—',
      origem,
      destino
    };
    rows.unshift(row);
    this.saveShipments(rows);
    return id;
  }

  // Modal de motorista após criar vínculo
  motoristaModalOpen = false;
  motoristaModalForIndex: number | null = null;
  motoristaTemp = '';
  openMotoristaModalFor(idx: number): void {
    this.motoristaModalForIndex = idx;
    this.motoristaTemp = this.vinculos[idx]?.motorista || '';
    this.motoristaModalOpen = true;
  }
  closeMotoristaModal(): void {
    this.motoristaModalOpen = false;
    this.motoristaModalForIndex = null;
    this.motoristaTemp = '';
  }
  saveMotorista(): void {
    if (this.motoristaModalForIndex === null) return;
    const v = this.vinculos[this.motoristaModalForIndex];
    if (!v) { this.closeMotoristaModal(); return; }
    const nome = (this.motoristaTemp || '').trim();
    if (nome) {
      v.motorista = nome;
      this.saveVinculos();
    }
    this.closeMotoristaModal();
  }

  // Coordenadas aproximadas por UF (capitais)
  private readonly UF_COORDS: Record<string, [number, number]> = {
    'AC': [-10.02, -67.81], 'AL': [-9.65, -35.74], 'AP': [0.04, -51.07], 'AM': [-3.12, -60.02],
    'BA': [-12.97, -38.50], 'CE': [-3.73, -38.52], 'DF': [-15.78, -47.93], 'ES': [-20.32, -40.29],
    'GO': [-16.67, -49.25], 'MA': [-2.53, -44.30], 'MG': [-19.92, -43.94], 'MS': [-20.47, -54.62],
    'MT': [-15.60, -56.10], 'PA': [-1.45, -48.49], 'PB': [-7.12, -34.88], 'PR': [-25.43, -49.27],
    'PE': [-8.05, -34.90], 'PI': [-5.09, -42.80], 'RJ': [-22.90, -43.20], 'RN': [-5.80, -35.21],
    'RO': [-8.76, -63.90], 'RR': [2.82, -60.67], 'RS': [-30.03, -51.23], 'SC': [-27.59, -48.54],
    'SE': [-10.91, -37.07], 'SP': [-23.55, -46.63], 'TO': [-10.18, -48.33]
  };

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.vinculos = this.getVinculosFromStorage();
    if (this.useApi) {
      this.loadIntencoesFromApi();
      this.loadVeiculosFromApi();
    } else {
      this.loadIntencoesMock();
      this.loadVeiculosMock();
    }
  }

  // Contadores para UI
  get countIntencoes(): number { return this.intencoes.length; }
  get countVinculados(): number { return this.vinculos.filter(v => v.status === 'vinculado').length; }
  get countEmRota(): number { return this.vinculos.filter(v => v.status === 'em_rota').length; }
  get countConcluidos(): number { return this.vinculos.filter(v => v.status === 'concluido').length; }

  // Drag-and-drop: estados e feedback visual
  dragIntencaoIndex: number | null = null;
  dragOverVeiculoIndex: number | null = null;
  highlightVinculoRef: Vinculo | null = null;

  // Undo (desfazer vínculo)
  undoVisible = false;
  private undoTimer: any = null;
  private lastUndo: { intencao: IntencaoEmbarque; vinculoRef: Vinculo; originalIndex: number } | null = null;

  // Modal de vínculos por veículo
  veiculoVinculosModalOpen = false;
  veiculoVinculosModalForIndex: number | null = null;

  ngAfterViewInit(): void {
    this.initMap();
    this.renderMap();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = undefined;
      this.vinculoMarkerRefs.clear();
    }
  }

  getIntencoesFromStorage(): IntencaoEmbarque[] {
    try {
      const raw = localStorage.getItem(this.intencoesKey);
      return raw ? JSON.parse(raw) as IntencaoEmbarque[] : [];
    } catch {
      return [];
    }
  }

  getVinculosFromStorage(): Vinculo[] {
    try {
      const raw = localStorage.getItem(this.vinculosKey);
      return raw ? JSON.parse(raw) as Vinculo[] : [];
    } catch {
      return [];
    }
  }

  saveVinculos(): void {
    localStorage.setItem(this.vinculosKey, JSON.stringify(this.vinculos));
  }

  saveIntencoes(): void {
    localStorage.setItem(this.intencoesKey, JSON.stringify(this.intencoes));
  }

  // Lista filtrada de vínculos (usa origem/destino da intenção)
  get filteredVinculos(): Vinculo[] {
    return this.vinculos.filter(v => {
      const origemOk = this.filtroOrigem ? v.intencao.origem.uf.toLowerCase().includes(this.filtroOrigem.toLowerCase()) || v.intencao.origem.cidade.toLowerCase().includes(this.filtroOrigem.toLowerCase()) : true;
      const destinoOk = this.filtroDestino ? v.intencao.destino.uf.toLowerCase().includes(this.filtroDestino.toLowerCase()) || v.intencao.destino.cidade.toLowerCase().includes(this.filtroDestino.toLowerCase()) : true;
      const statusOk = this.filtroStatus === 'Todos' ? true : v.status === (this.filtroStatus as Vinculo['status']);
      return origemOk && destinoOk && statusOk;
    });
  }

  getStatusClass(status: Vinculo['status']) {
    switch (status) {
      case 'em_rota': return 'status em-rota';
      case 'concluido': return 'status concluido';
      case 'pendente': return 'status pendente';
      case 'vinculado': return 'status vinculado';
      default: return 'status';
    }
  }

  canVincular(): boolean {
    return this.selecionadaIntencaoIndex !== null && this.selecionadoVeiculoIndex !== null;
  }

  vincularSelecionados(): void {
    if (!this.canVincular()) return;
    const intIdx = this.selecionadaIntencaoIndex!;
    const veicIdx = this.selecionadoVeiculoIndex!;
    const intencao = this.intencoes[intIdx];
    const veiculo = this.veiculos[veicIdx];
    if (!intencao || !veiculo) return;

    const novoVinculo: Vinculo = { intencao, veiculo, status: 'vinculado' };
    this.vinculos.push(novoVinculo);
    this.saveVinculos();

    // Remover a intenção vinculada da lista
    this.intencoes.splice(intIdx, 1);
    this.saveIntencoes();

    // Ajustar seleção após remoção
    if (this.selecionadaIntencaoIndex !== null) {
      if (this.selecionadaIntencaoIndex === intIdx) this.selecionadaIntencaoIndex = null;
      else if (this.selecionadaIntencaoIndex > intIdx) this.selecionadaIntencaoIndex!--;
    }
    this.selecionadoVeiculoIndex = null;

    // Atualizar mapa e dar feedback visual
    this.renderMap();
    this.highlightVinculoRef = novoVinculo;
    setTimeout(() => { this.highlightVinculoRef = null; }, 1800);

    // Habilita desfazer
    this.showUndo(novoVinculo, intencao, intIdx);
  }

  // Handlers de drag-and-drop de intenção para veículo
  onIntencaoDragStart(idx: number, ev: DragEvent): void {
    this.dragIntencaoIndex = idx;
    if (ev.dataTransfer) {
      ev.dataTransfer.setData('text/plain', String(idx));
      ev.dataTransfer.effectAllowed = 'copyMove';
    }
  }

  onIntencaoDragEnd(): void {
    this.dragIntencaoIndex = null;
    this.dragOverVeiculoIndex = null;
  }

  onVeiculoDragOver(ev: DragEvent): void {
    ev.preventDefault();
    if (ev.dataTransfer) ev.dataTransfer.dropEffect = 'copy';
  }

  onVeiculoDragEnter(idx: number): void {
    this.dragOverVeiculoIndex = idx;
  }

  onVeiculoDragLeave(idx: number): void {
    if (this.dragOverVeiculoIndex === idx) this.dragOverVeiculoIndex = null;
  }

  onVeiculoDrop(veiculoIndex: number): void {
    if (this.dragIntencaoIndex === null) return;
    const intIdx = this.dragIntencaoIndex;
    this.dragIntencaoIndex = null;
    this.dragOverVeiculoIndex = null;

    const intencao = this.intencoes[intIdx];
    const veiculo = this.veiculos[veiculoIndex];
    if (!intencao || !veiculo) return;

    const novoVinculo: Vinculo = { intencao, veiculo, status: 'vinculado' };
    this.vinculos.push(novoVinculo);
    this.saveVinculos();

    // Remover intenção da lista após o drop
    this.intencoes.splice(intIdx, 1);
    this.saveIntencoes();
    if (this.selecionadaIntencaoIndex !== null) {
      if (this.selecionadaIntencaoIndex === intIdx) this.selecionadaIntencaoIndex = null;
      else if (this.selecionadaIntencaoIndex > intIdx) this.selecionadaIntencaoIndex--;
    }

    // Atualiza mapa e destaca o novo vínculo
    this.renderMap();
    this.highlightVinculoRef = novoVinculo;
    setTimeout(() => { this.highlightVinculoRef = null; }, 1800);

    // Habilita desfazer
    this.showUndo(novoVinculo, intencao, intIdx);
  }

  removerVinculo(i: number): void {
    this.vinculos.splice(i, 1);
    this.saveVinculos();
    this.renderMap();
  }

  // --- Intenções (exemplos) ---
  private sampleIntencoes(): IntencaoEmbarque[] {
    return [
      { origem: { uf: 'RJ', cidade: 'Rio de Janeiro' }, destino: { uf: 'SP', cidade: 'São Paulo' }, pesoKg: 18000, tipoCarga: 'Granel', dataColeta: '2025-10-17' },
      { origem: { uf: 'PR', cidade: 'Curitiba' }, destino: { uf: 'SC', cidade: 'Florianópolis' }, pesoKg: 12000, tipoCarga: 'Industrial', dataColeta: '2025-10-18' },
      { origem: { uf: 'MG', cidade: 'Belo Horizonte' }, destino: { uf: 'BA', cidade: 'Salvador' }, pesoKg: 16000, tipoCarga: 'Alimentos', dataColeta: '2025-10-19' },
      { origem: { uf: 'RS', cidade: 'Porto Alegre' }, destino: { uf: 'SP', cidade: 'Campinas' }, pesoKg: 20000, tipoCarga: 'Refrigerado', dataColeta: '2025-10-20' },
      { origem: { uf: 'PE', cidade: 'Recife' }, destino: { uf: 'CE', cidade: 'Fortaleza' }, pesoKg: 10000, tipoCarga: 'Confecções', dataColeta: '2025-10-21' }
    ];
  }

  addSampleIntencao(): void {
    const exemplos = this.sampleIntencoes();
    const next = exemplos[Math.floor(Math.random() * exemplos.length)];
    this.intencoes.push(next);
    this.saveIntencoes();
  }

  // --- Mock loaders (sem API) ---
  private loadIntencoesMock(): void {
    this.intencoes = this.getIntencoesFromStorage();
    if (!this.intencoes.length) {
      this.intencoes = this.sampleIntencoes();
      this.saveIntencoes();
    }
  }

  private loadVeiculosMock(): void {
    this.veiculos = this.defaultVeiculos();
  }

  // --- API integration ---
  private loadIntencoesFromApi(): void {
    this.api.get<IntencaoEmbarque[]>('/intencoes-embarque').subscribe({
      next: (data) => {
        if (Array.isArray(data) && data.length) {
          this.intencoes = data;
          this.saveIntencoes(); // mantém compatibilidade com a outra tela
        } else {
          this.intencoes = this.getIntencoesFromStorage();
          if (!this.intencoes.length) {
            this.intencoes = this.sampleIntencoes();
            this.saveIntencoes();
          }
        }
      },
      error: () => {
        // Fallback total para storage/seed
        this.intencoes = this.getIntencoesFromStorage();
        if (!this.intencoes.length) {
          this.intencoes = this.sampleIntencoes();
          this.saveIntencoes();
        }
      }
    });
  }

  private loadVeiculosFromApi(): void {
    this.api.get<Veiculo[]>('/veiculos').subscribe({
      next: (data) => {
        if (Array.isArray(data) && data.length) {
          this.veiculos = data;
        } else {
          this.veiculos = this.defaultVeiculos();
        }
      },
      error: () => {
        this.veiculos = this.defaultVeiculos();
      }
    });
  }

  private defaultVeiculos(): Veiculo[] {
    return [
      { placa: 'ABC1234', localizacao: 'RJ', tipo: 'Carreta' },
      { placa: 'DEF5678', localizacao: 'SP', tipo: 'Toco' },
      { placa: 'GHI9012', localizacao: 'MG', tipo: 'VUC' },
      { placa: 'JKL3456', localizacao: 'SC', tipo: 'Leve' }
    ];
  }

  // Ordenação listas
  sortIntencoesBy: 'recent' | 'peso_desc' | 'peso_asc' = 'recent';
  sortVeiculosBy: 'placa' | 'tipo' = 'placa';

  get sortedIntencoes(): IntencaoEmbarque[] {
    const arr = [...this.intencoes];
    switch (this.sortIntencoesBy) {
      case 'peso_desc': return arr.sort((a, b) => b.pesoKg - a.pesoKg);
      case 'peso_asc': return arr.sort((a, b) => a.pesoKg - b.pesoKg);
      case 'recent':
      default: return arr;
    }
  }

  get sortedVeiculos(): Veiculo[] {
    const arr = [...this.veiculos];
    switch (this.sortVeiculosBy) {
      case 'tipo': return arr.sort((a, b) => (a.tipo || '').localeCompare(b.tipo || ''));
      case 'placa':
      default: return arr.sort((a, b) => a.placa.localeCompare(b.placa));
    }
  }

  // Undo helpers
  private showUndo(vinculoRef: Vinculo, intencao: IntencaoEmbarque, originalIndex: number): void {
    this.lastUndo = { intencao, vinculoRef, originalIndex };
    this.undoVisible = true;
    if (this.undoTimer) clearTimeout(this.undoTimer);
    this.undoTimer = setTimeout(() => this.clearUndo(), 6000);
  }

  clearUndo(): void {
    this.undoVisible = false;
    if (this.undoTimer) { clearTimeout(this.undoTimer); this.undoTimer = null; }
    this.lastUndo = null;
  }

  undoLinking(): void {
    if (!this.lastUndo) return;
    const { vinculoRef, intencao, originalIndex } = this.lastUndo;
    // Remover vínculo recém-criado
    const idx = this.vinculos.indexOf(vinculoRef);
    if (idx >= 0) {
      this.vinculos.splice(idx, 1);
      this.saveVinculos();
    }
    // Restaurar intenção na posição original (ou final, se necessário)
    const pos = Math.min(Math.max(originalIndex, 0), this.intencoes.length);
    this.intencoes.splice(pos, 0, intencao);
    this.saveIntencoes();

    // Atualiza mapa e limpa estado
    this.renderMap();
    this.clearUndo();
  }

  // Contagem e modal de vínculos por veículo
  vinculosCountDoVeiculo(veiculoIndex: number): number {
    const veic = this.veiculos[veiculoIndex];
    if (!veic) return 0;
    return this.vinculos.filter(v => v.veiculo.placa === veic.placa).length;
  }

  abrirModalVinculosVeiculo(veiculoIndex: number): void {
    this.veiculoVinculosModalForIndex = veiculoIndex;
    this.veiculoVinculosModalOpen = true;
  }

  fecharModalVinculosVeiculo(): void {
    this.veiculoVinculosModalOpen = false;
    this.veiculoVinculosModalForIndex = null;
  }

  get modalVinculos(): { i: number; v: Vinculo }[] {
    if (this.veiculoVinculosModalForIndex === null) return [];
    const veic = this.veiculos[this.veiculoVinculosModalForIndex];
    if (!veic) return [];
    return this.vinculos
      .map((v, i) => ({ i, v }))
      .filter(item => item.v.veiculo.placa === veic.placa);
  }

  iniciarRota(i: number): void {
    const v = this.vinculos[i];
    if (!v) return;
    if (!v.confirmado) return; // exige confirmação
    v.status = 'em_rota';
    this.saveVinculos();
    this.renderMap();
    this.focusVinculo(i);
  }

  concluirVinculo(i: number): void {
    const v = this.vinculos[i];
    if (!v) return;
    v.status = 'concluido';
    this.saveVinculos();
    this.renderMap();
    this.focusVinculo(i);
  }

  confirmarVinculo(i: number): void {
    const v = this.vinculos[i];
    if (!v) return;
    if (v.confirmado) return; // já confirmado
    if (v.status !== 'vinculado') return; // só confirma quando vinculado
    // Abre modal para opção de motorista antes de gerar o embarque
    this.openMotoristaModalFor(i);
  }

  confirmarComMotorista(): void {
    if (this.motoristaModalForIndex === null) { this.closeMotoristaModal(); return; }
    const v = this.vinculos[this.motoristaModalForIndex];
    if (!v) { this.closeMotoristaModal(); return; }
    const nome = (this.motoristaTemp || '').trim();
    if (nome) v.motorista = nome;
    // Gera embarque e marca confirmado
    const id = this.createShipmentFromVinculo(v);
    v.confirmado = true;
    v.embarqueId = id;
    this.saveVinculos();
    this.closeMotoristaModal();
  }

  verNoMapa(i: number): void {
    this.focusVinculo(i);
  }

  zoomIn(): void { if (this.map) this.map.zoomIn(); }
  zoomOut(): void { if (this.map) this.map.zoomOut(); }
  resetView(): void {
    if (!this.map) return;
    const bounds = (this.routesLayer as any).getBounds?.() || (this.markersLayer as any).getBounds?.();
    if (bounds && bounds.isValid()) {
      this.map.fitBounds(bounds.pad(0.1));
    } else {
      this.map.setView([-14.2350, -51.9253], 5);
    }
  }

  private initMap(): void {
    this.map = L.map('ctrl-map', { zoomControl: false }).setView([-14.2350, -51.9253], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);
    this.markersLayer.addTo(this.map!);
    this.routesLayer.addTo(this.map!);
  }

  private getUFCoords(uf: string | undefined): [number, number] | null {
    if (!uf) return null;
    const key = uf.toUpperCase();
    return this.UF_COORDS[key] || null;
  }

  private getRouteColor(status: Vinculo['status']): string {
    switch (status) {
      case 'em_rota': return '#22c55e'; // verde
      case 'concluido': return '#64748b'; // slate
      case 'vinculado': return '#3b82f6'; // azul
      case 'pendente':
      default: return '#a3a3a3'; // cinza
    }
  }

  private renderMap(): void {
    if (!this.map) return;
    this.markersLayer.clearLayers();
    this.routesLayer.clearLayers();
    this.vinculoMarkerRefs.clear();

    const bounds = L.latLngBounds([]);
    this.vinculos.forEach((v, i) => {
      const o = this.getUFCoords(v.intencao.origem.uf);
      const d = this.getUFCoords(v.intencao.destino.uf);
      const t = this.getUFCoords(v.veiculo.localizacao);

      const refs: { origin?: L.Marker; dest?: L.Marker; truck?: L.Marker; route?: L.Polyline } = {};

      if (o) {
        refs.origin = L.marker(o, { icon: this.originIcon }).bindPopup(`<strong>Origem</strong><br/>${v.intencao.origem.cidade} - ${v.intencao.origem.uf}`);
        this.markersLayer.addLayer(refs.origin);
        bounds.extend(o);
      }
      if (d) {
        refs.dest = L.marker(d, { icon: this.destIcon }).bindPopup(`<strong>Destino</strong><br/>${v.intencao.destino.cidade} - ${v.intencao.destino.uf}`);
        this.markersLayer.addLayer(refs.dest);
        bounds.extend(d);
      }
      if (o && d) {
        refs.route = L.polyline([o, d], { color: this.getRouteColor(v.status), weight: 4, opacity: 0.9 });
        this.routesLayer.addLayer(refs.route);
      }
      if (t) {
        refs.truck = L.marker(t, { icon: this.truckIcon }).bindPopup(`<strong>Veículo</strong><br/>Placa: ${v.veiculo.placa}<br/>Local: ${v.veiculo.localizacao}`);
        this.markersLayer.addLayer(refs.truck);
        bounds.extend(t);
      }

      this.vinculoMarkerRefs.set(i, refs);
    });

    if (bounds.isValid()) {
      this.map.fitBounds(bounds.pad(0.1));
    } else {
      this.map.setView([-14.2350, -51.9253], 5);
    }
  }

  private focusVinculo(i: number): void {
    if (!this.map) return;
    const refs = this.vinculoMarkerRefs.get(i);
    if (!refs) return;
    const b = L.latLngBounds([]);
    if (refs.origin) b.extend(refs.origin.getLatLng());
    if (refs.dest) b.extend(refs.dest.getLatLng());
    if (refs.truck) b.extend(refs.truck.getLatLng());
    if (b.isValid()) {
      this.map.fitBounds(b.pad(0.15));
    }
    if (refs.truck) refs.truck.openPopup();
  }
}