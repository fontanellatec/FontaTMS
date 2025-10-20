import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet'

// Dados e modelos
export type Combustivel = 'Diesel S10' | 'Diesel S500' | 'Gasolina' | 'Etanol' | 'GNV';

interface Fornecedor {
  id: number;
  nome: string;
  lat: number;
  lng: number;
}

interface Bomba {
  id: number;
  fornecedorId: number;
  nome: string;
  combustiveis: Combustivel[];
  lat: number;
  lng: number;
}

interface PrecoRegistro {
  bombaId: number;
  fornecedorId: number;
  combustivel: Combustivel;
  preco: number;
  dataHora: string; // yyyy-MM-ddTHH:mm (local)
}

interface NotaEntrada {
  fornecedorId: number;
  numero: string;
  data: string; // dd/mm/aaaa
  valor: number;
}

interface Veiculo {
  frota: string;
  placa: string;
  lat: number;
  lng: number;
  localizacao: string;
}

interface Abastecimento {
  dataHora: string;
  veiculo: string;
  fornecedorId: number;
  bombaId: number;
  combustivel: Combustivel;
  litros: number;
  precoBomba: number;
  precoNota?: number;
  valorTotal: number;
  kmsRodados?: number;
}

@Component({
  selector: 'app-precificacao-abastecimento',
  templateUrl: './precificacao-abastecimento.component.html',
  styleUrls: ['./precificacao-abastecimento.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class PrecificacaoAbastecimentoComponent implements OnInit {
  // Tabs
  tab: 'precificacao' | 'dashboards' | 'mapa' = 'precificacao';
  setTab(tab: 'precificacao' | 'dashboards' | 'mapa'): void {
    this.tab = tab;
    if (tab === 'mapa') {
      this.updateProximity();
      // aguarda renderização do DOM antes de inicializar o mapa
      setTimeout(() => {
        this.updateMapLayers();
        this.map?.invalidateSize();
      }, 0);
    }
  }

  // Form
  form: { fornecedorId: number | null; bombaId: number | null; combustivel: Combustivel | ''; preco: number | null; dataHora: string } = {
    fornecedorId: null,
    bombaId: null,
    combustivel: '',
    preco: null,
    dataHora: ''
  };

  // Data
  fornecedores: Fornecedor[] = [
    { id: 1, nome: 'Posto Alpha', lat: -23.5505, lng: -46.6333 },
    { id: 2, nome: 'Posto Beta', lat: -22.9068, lng: -43.1729 },
    { id: 3, nome: 'Posto Gamma', lat: -25.4284, lng: -49.2733 }
  ];

  bombas: Bomba[] = [
    { id: 1, fornecedorId: 1, nome: 'Bomba 1', combustiveis: ['Diesel S10', 'Diesel S500'], lat: -23.5505, lng: -46.6333 },
    { id: 2, fornecedorId: 1, nome: 'Bomba 2', combustiveis: ['Gasolina', 'Etanol'], lat: -23.5605, lng: -46.6233 },
    { id: 3, fornecedorId: 2, nome: 'Bomba 3', combustiveis: ['Diesel S10'], lat: -22.9068, lng: -43.1729 },
    { id: 4, fornecedorId: 3, nome: 'Bomba 4', combustiveis: ['Diesel S10'], lat: -25.4284, lng: -49.2733 }
  ];

  combustiveis: Combustivel[] = ['Diesel S10', 'Diesel S500', 'Gasolina', 'Etanol', 'GNV'];

  precos: PrecoRegistro[] = [
    { bombaId: 1, fornecedorId: 1, combustivel: 'Diesel S10', preco: 6.29, dataHora: '2025-10-10T08:00' },
    { bombaId: 1, fornecedorId: 1, combustivel: 'Diesel S10', preco: 6.19, dataHora: '2025-10-08T08:00' },
    { bombaId: 3, fornecedorId: 2, combustivel: 'Diesel S10', preco: 6.39, dataHora: '2025-10-12T09:00' },
    { bombaId: 4, fornecedorId: 3, combustivel: 'Diesel S10', preco: 6.49, dataHora: '2025-10-15T10:00' }
  ];

  notasEntrada: NotaEntrada[] = [
    { fornecedorId: 1, numero: 'NE-101', data: '10/10/2025', valor: 12500.0 },
    { fornecedorId: 1, numero: 'NE-102', data: '12/10/2025', valor: 9800.0 },
    { fornecedorId: 2, numero: 'NE-201', data: '11/10/2025', valor: 7560.0 },
    { fornecedorId: 3, numero: 'NE-301', data: '15/10/2025', valor: 8437.0 }
  ];

  veiculos: Veiculo[] = [
    { frota: '116', placa: 'ABC1D23', lat: -23.5505, lng: -46.6333, localizacao: 'SÃO PAULO-SP' },
    { frota: '201', placa: 'DEF4G56', lat: -22.9068, lng: -43.1729, localizacao: 'RIO DE JANEIRO-RJ' },
    { frota: '344', placa: 'IJK7L89', lat: -25.4284, lng: -49.2733, localizacao: 'CURITIBA-PR' },
    { frota: '198', placa: 'MNO1P23', lat: -23.5505, lng: -46.6333, localizacao: 'SÃO PAULO-SP' }
  ];

  // Map state
  private map: L.Map | null = null;
  private markers: L.Marker[] = [];
  private radiusLayer: L.Circle | null = null;

  searchPlaca: string = '';
  radiusKm: number = 50;
  vehiclesNearby: Array<{ v: Veiculo; fornecedor: Fornecedor; distanciaKm: number; preco: number | null }> = [];
  // Filtros e estado de centro/raio do mapa
  showSuppliers: boolean = true;
  showVehicles: boolean = true;
  selectedSupplierId: number | null = null;
  selectedVehiclePlaca: string = '';
  radiusCenter: { lat:number; lng:number } | null = null;
  radiusToolActive: boolean = false;

  ngOnInit(): void {
    this.form.dataHora = this.toDatetimeLocal(new Date());
    // default selection
    const bombas = this.getBombasPorFornecedor(this.fornecedores[0]?.id ?? null);
    this.form.fornecedorId = this.fornecedores[0]?.id ?? null;
    this.form.bombaId = bombas[0]?.id ?? null;
    this.form.combustivel = bombas[0]?.combustiveis[0] ?? '';
  }

  onRadiusChange(km: number): void {
    this.radiusKm = km || 1;
    this.updateProximity();
    this.updateMapLayers();
  }

  updateMapLayers(): void {
    const el = document.getElementById('fuel-map');
    if (!el) return;
    if (!this.map) {
      this.map = L.map(el, { zoomControl: false }).setView([-14.2350, -51.9253], 5);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(this.map);
      // Garantia: remover controle nativo de zoom se presente
      if ((this.map as any).zoomControl) { (this.map as any).zoomControl.remove(); }
      // Clique para definir centro do raio quando modo ativo
      this.map.on('click', this.handleMapClick.bind(this));
    } else {
      // evita múltiplos handlers
      this.map.off('click');
      this.map.on('click', this.handleMapClick.bind(this));
      // Garantia: remover controle nativo de zoom em mapas já existentes
      if ((this.map as any).zoomControl) { (this.map as any).zoomControl.remove(); }
    }
    // Clear old markers
    this.markers.forEach(m => m.remove());
    this.markers = [];
    // Remove old radius
    this.radiusLayer?.remove();
    this.radiusLayer = null;

    // Custom DivIcons
    const supplierDivIcon = L.divIcon({
      className: 'supplier-icon',
      html: '<div class="marker"><span class="emoji">⛽️</span></div>',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14]
    });
    const vehicleDivIcon = L.divIcon({
      className: 'vehicle-icon',
      html: '<div class="marker"><span class="emoji">🚚</span></div>',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14]
    });

    const latlngs: L.LatLngExpression[] = [];

    // Aplica filtros
    const vehiclesToShow = this.veiculos
      .filter(v => !this.searchPlaca || v.placa.toUpperCase().includes(this.searchPlaca.toUpperCase()))
      .filter(v => !this.selectedVehiclePlaca || this.selectedVehiclePlaca === '' || v.placa === this.selectedVehiclePlaca);

    const suppliersToShow = this.selectedSupplierId
      ? this.fornecedores.filter(f => f.id === this.selectedSupplierId)
      : this.fornecedores;

    // Mostra sempre todos (com filtros), sem priorização automática
    if (this.showSuppliers) {
      for (const f of suppliersToShow) {
        const m = L.marker([f.lat, f.lng], { icon: supplierDivIcon }).bindPopup(`<b>${f.nome}</b>`);
        m.addTo(this.map!); this.markers.push(m);
        latlngs.push([f.lat, f.lng]);
      }
    }
    if (this.showVehicles) {
      for (const v of vehiclesToShow) {
        const m = L.marker([v.lat, v.lng], { icon: vehicleDivIcon }).bindPopup(`<b>${v.placa}</b><br/>${v.localizacao}`);
        m.addTo(this.map!); this.markers.push(m);
        latlngs.push([v.lat, v.lng]);
      }
    }

    // Desenha círculo de raio quando centro definido
    if (this.radiusCenter) {
      this.radiusLayer = L.circle([this.radiusCenter.lat, this.radiusCenter.lng], {
        radius: this.radiusKm * 1000,
        color: '#2563eb',
        weight: 1,
        fillColor: '#2563eb',
        fillOpacity: 0.08
      }).addTo(this.map!);
      latlngs.push([this.radiusCenter.lat, this.radiusCenter.lng]);
    }

    // Fit bounds to markers e centro
    if (latlngs.length) {
      this.map!.fitBounds(L.latLngBounds(latlngs as any), { padding: [24, 24] });
    }
  }

  zoomIn(): void { if (this.map) { this.map.zoomIn(); } }
  zoomOut(): void { if (this.map) { this.map.zoomOut(); } }
  resetView(): void {
    if (!this.map) return;
    const bounds = L.latLngBounds([]);
    this.markers.forEach(m => bounds.extend(m.getLatLng()));
    if (this.radiusCenter) bounds.extend([this.radiusCenter.lat, this.radiusCenter.lng] as any);
    if (bounds.isValid()) {
      this.map.fitBounds(bounds.pad(0.1));
    } else {
      this.map.setView([-14.2350, -51.9253], 5);
    }
  }

  onSearchPlacaChange(s: string): void {
    this.searchPlaca = s || '';
    this.updateProximity();
    this.updateMapLayers();
  }

  private handleMapClick(e: L.LeafletMouseEvent): void {
    if (this.radiusToolActive) {
      this.radiusCenter = { lat: e.latlng.lat, lng: e.latlng.lng };
      this.updateProximity();
      this.updateMapLayers();
    }
  }

  onSupplierFilterChange(fid: number | null): void {
    this.selectedSupplierId = fid;
    this.updateMapLayers();
  }

  onVehicleFilterChange(placa: string): void {
    this.selectedVehiclePlaca = placa || '';
    this.updateProximity();
    this.updateMapLayers();
  }

  onToggleSuppliers(show: boolean): void {
    this.showSuppliers = !!show;
    this.updateMapLayers();
  }

  onToggleVehicles(show: boolean): void {
    this.showVehicles = !!show;
    this.updateProximity();
    this.updateMapLayers();
  }

  toggleRadiusTool(): void {
    this.radiusToolActive = !this.radiusToolActive;
  }

  clearMapFilters(): void {
    this.searchPlaca = '';
    this.selectedSupplierId = null;
    this.selectedVehiclePlaca = '';
    this.showSuppliers = true;
    this.showVehicles = true;
    this.radiusCenter = null;
    this.radiusToolActive = false;
    this.updateProximity();
    this.updateMapLayers();
  }

  private updateProximity(): void {
    const nearby: Array<{ v: Veiculo; fornecedor: Fornecedor; distanciaKm: number; preco: number | null }> = [];

    // Aplica filtros de veículo também na lista de proximidade
    const vehicleSource = this.veiculos
      .filter(v => !this.searchPlaca || v.placa.toUpperCase().includes(this.searchPlaca.toUpperCase()))
      .filter(v => !this.selectedVehiclePlaca || this.selectedVehiclePlaca === '' || v.placa === this.selectedVehiclePlaca);

    for (const v of vehicleSource) {
      // Se houver centro definido, considera apenas veículos dentro do raio a partir do centro
      if (this.radiusCenter) {
        const dCenter = this.distanceKm(v.lat, v.lng, this.radiusCenter.lat, this.radiusCenter.lng);
        if (dCenter > this.radiusKm) continue;
      }

      let best: { fornecedor: Fornecedor; distanciaKm: number; preco: number | null } | null = null;
      for (const f of this.fornecedores) {
        const d = this.distanceKm(v.lat, v.lng, f.lat, f.lng);
        const bomba = this.bombas.find(b => b.fornecedorId === f.id);
        const preco = bomba ? this.getPrecoAtual(bomba.id, 'Diesel S10') : null;
        if (!best || d < best.distanciaKm) best = { fornecedor: f, distanciaKm: d, preco };
      }
      if (best) nearby.push({ v, fornecedor: best.fornecedor, distanciaKm: +best.distanciaKm.toFixed(2), preco: best.preco });
    }
    // Ordena por distância
    this.vehiclesNearby = nearby.sort((a, b) => a.distanciaKm - b.distanciaKm);
  }

  private distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = (v: number) => v * Math.PI / 180;
    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  onFornecedorChange(fid: number | null): void {
    this.form.fornecedorId = fid;
    const bombas = this.getBombasPorFornecedor(fid);
    this.form.bombaId = bombas[0]?.id ?? null;
    this.form.combustivel = bombas[0]?.combustiveis[0] ?? '';
  }

  onBombaChange(bid: number | null): void {
    this.form.bombaId = bid;
    const b = this.bombas.find(x => x.id === bid);
    this.form.combustivel = b?.combustiveis[0] ?? '';
  }

  getBombasPorFornecedor(fid: number | null): Bomba[] {
    if (!fid) return [];
    return this.bombas.filter(b => b.fornecedorId === fid);
  }

  bombaById(id: number | null): Bomba | undefined {
    if (id == null) return undefined;
    return this.bombas.find(b => b.id === id);
  }

  fornecedorById(id: number | null): Fornecedor | undefined {
    if (id == null) return undefined;
    return this.fornecedores.find(f => f.id === id);
  }

  notasEntradaPorFornecedor(fid: number | null): NotaEntrada[] {
    if (!fid) return [];
    return this.notasEntrada.filter(n => n.fornecedorId === fid);
  }

  hasNotasEntrada(fid: number | null): boolean {
    return this.notasEntradaPorFornecedor(fid).length > 0;
  }

  bombaHasCombustivel(fid: number | null, bid: number | null, c: Combustivel): boolean {
    if (fid == null || bid == null) return false;
    const b = this.bombas.find(x => x.id === bid && x.fornecedorId === fid);
    return !!b && b.combustiveis.includes(c);
  }

  getHistoricoPorBomba(bombaId: number | null): PrecoRegistro[] {
    if (!bombaId) return [];
    return this.precos
      .filter(p => p.bombaId === bombaId)
      .sort((a, b) => (a.dataHora > b.dataHora ? -1 : 1));
  }

  getPrecoAtual(bombaId: number | null, combustivel?: Combustivel): number | null {
    const hist = this.getHistoricoPorBomba(bombaId);
    if (combustivel) {
      const filtered = hist.filter(h => h.combustivel === combustivel);
      if (filtered.length === 0) return null;
      return filtered[0].preco;
    }
    return hist[0]?.preco ?? null;
  }

  getPrecoAtualSelecionado(): number | null {
    const bid = this.form.bombaId;
    const c = this.form.combustivel;
    if (!bid || !c) return null;
    return this.getPrecoAtual(bid, c as Combustivel);
  }

  salvarPreco(): void {
    const { fornecedorId, bombaId, combustivel, preco, dataHora } = this.form;
    if (!fornecedorId || !bombaId || !combustivel || !preco || preco <= 0) {
      alert('Preencha fornecedor, bomba, combustível e preço válido.');
      return;
    }
    const dh = dataHora && dataHora.length >= 16 ? dataHora : this.toDatetimeLocal(new Date());
    this.precos.push({ bombaId, fornecedorId, combustivel: combustivel as Combustivel, preco, dataHora: dh });
    // Mantém histórico ordenado e limita os últimos 200 registros (placeholder)
    this.precos = this.precos
      .sort((a, b) => (a.dataHora > b.dataHora ? -1 : 1))
      .slice(0, 200);
  }

  // Dashboards
  get mediaDieselS10(): number | null {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const arr = this.precos.filter(p => p.combustivel === 'Diesel S10' && this.parseLocalDate(p.dataHora) >= weekAgo);
    if (arr.length === 0) return null;
    const m = arr.reduce((sum, p) => sum + p.preco, 0) / arr.length;
    return +m.toFixed(3);
  }

  get variacaoDieselS10Semana(): number | null {
    const arr = this.precos.filter(p => p.combustivel === 'Diesel S10').sort((a, b) => (a.dataHora > b.dataHora ? 1 : -1));
    if (arr.length < 2) return null;
    const first = arr[0].preco;
    const last = arr[arr.length - 1].preco;
    return +(last - first).toFixed(3);
  }

  get registrosTotal(): number { return this.precos.length; }
  get fornecedoresMonitorados(): number { return new Set(this.fornecedores.map(f => f.id)).size; }

  get serieDieselS10(): number[] {
    const arr = this.precos.filter(p => p.combustivel === 'Diesel S10').slice(-12);
    return arr.map(p => p.preco);
  }

  polylinePoints(): string {
    const s = this.serieDieselS10;
    const n = Math.max(s.length - 1, 1);
    return s.map((v, i) => {
      const x = i * (100 / n);
      const y = 40 - ((v - 5) * (40 / 3));
      return `${x},${y}`;
    }).join(' ');
  }

  // Utilidades
  toDatetimeLocal(d: Date): string {
    const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
    const yyyy = d.getFullYear();
    const MM = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
  }

  parseLocalDate(s: string): Date {
    // s: yyyy-MM-ddTHH:mm
    const [date, time] = s.split('T');
    const [y, M, d] = date.split('-').map(Number);
    const [h, m] = time.split(':').map(Number);
    return new Date(y, (M - 1), d, h, m);
  }

  formatDateTimeBR(s: string): string {
    const d = this.parseLocalDate(s);
    const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  // Dashboards (inside component)
  dashTab: 'resumo' | 'precos' | 'frota' | 'notas' | 'alertas' = 'resumo';
  filtroPeriodo: 'mes_atual' | '30d' | '90d' = 'mes_atual';

  consumoEsperadoPorVeiculo: Record<string, number> = {
    'ABC1D23': 3.5,
    'DEF4G56': 2.8,
    'IJK7L89': 3.3,
    'MNO1P23': 3.0
  };

  capacidadeTanquePorVeiculo: Record<string, number> = {
    'ABC1D23': 200,
    'DEF4G56': 220,
    'IJK7L89': 180,
    'MNO1P23': 200
  };

  abastecimentos: Abastecimento[] = [
    { dataHora: '2025-09-28T08:30', veiculo: 'ABC1D23', fornecedorId: 1, bombaId: 1, combustivel: 'Diesel S10', litros: 120, precoBomba: 6.19, precoNota: 6.15, valorTotal: 742.8, kmsRodados: 380 },
    { dataHora: '2025-10-01T10:15', veiculo: 'DEF4G56', fornecedorId: 1, bombaId: 1, combustivel: 'Diesel S10', litros: 150, precoBomba: 6.29, precoNota: 6.30, valorTotal: 943.5, kmsRodados: 410 },
    { dataHora: '2025-10-03T14:40', veiculo: 'IJK7L89', fornecedorId: 2, bombaId: 3, combustivel: 'Diesel S10', litros: 110, precoBomba: 6.39, precoNota: 6.35, valorTotal: 702.9, kmsRodados: 355 },
    { dataHora: '2025-10-06T06:50', veiculo: 'MNO1P23', fornecedorId: 3, bombaId: 4, combustivel: 'Diesel S10', litros: 130, precoBomba: 6.49, precoNota: 6.45, valorTotal: 843.7, kmsRodados: 392 },
    { dataHora: '2025-10-10T22:15', veiculo: 'ABC1D23', fornecedorId: 1, bombaId: 1, combustivel: 'Diesel S10', litros: 160, precoBomba: 6.29, precoNota: 6.29, valorTotal: 1006.4, kmsRodados: 520 },
    { dataHora: '2025-10-12T11:05', veiculo: 'DEF4G56', fornecedorId: 2, bombaId: 3, combustivel: 'Diesel S10', litros: 140, precoBomba: 6.39, precoNota: 6.38, valorTotal: 894.6, kmsRodados: 405 },
    { dataHora: '2025-10-15T19:20', veiculo: 'IJK7L89', fornecedorId: 3, bombaId: 4, combustivel: 'Diesel S10', litros: 120, precoBomba: 6.49, precoNota: 6.50, valorTotal: 778.8, kmsRodados: 380 },
    { dataHora: '2025-10-17T09:50', veiculo: 'MNO1P23', fornecedorId: 1, bombaId: 1, combustivel: 'Diesel S10', litros: 100, precoBomba: 6.29, precoNota: 6.27, valorTotal: 629.0, kmsRodados: 310 }
  ];

  setDashTab(tab: 'resumo' | 'precos' | 'frota' | 'notas' | 'alertas'): void {
    this.dashTab = tab;
  }
  setPeriodo(p: 'mes_atual' | '30d' | '90d'): void {
    this.filtroPeriodo = p;
  }

  private inicioPeriodo(): Date {
    const now = new Date();
    if (this.filtroPeriodo === 'mes_atual') {
      return new Date(now.getFullYear(), now.getMonth(), 1);
    }
    const days = this.filtroPeriodo === '30d' ? 30 : 90;
    return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  }
  private fimPeriodo(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59);
  }
  inPeriodo(a: Abastecimento): boolean {
    const d = this.parseLocalDate(a.dataHora);
    return d >= this.inicioPeriodo() && d <= this.fimPeriodo();
  }
  abastecimentosFiltrados(): Abastecimento[] {
    return this.abastecimentos.filter(a => this.inPeriodo(a));
  }

  litrosPorVeiculo(): Array<{ placa:string, litros:number, percent:number }> {
    const arr = this.abastecimentosFiltrados();
    const total = arr.reduce((s,a)=>s+a.litros,0);
    const map = new Map<string, number>();
    for (const a of arr) map.set(a.veiculo, (map.get(a.veiculo)||0)+a.litros);
    const list = Array.from(map.entries()).map(([placa, litros])=>({placa, litros, percent: total? +(litros*100/total).toFixed(1): 0}));
    return list.sort((a,b)=>b.litros - a.litros).slice(0,8);
  }

  custoTotalPorMes(): Array<{ mes:string, valor:number }> {
    const map = new Map<string, number>();
    for (const a of this.abastecimentos) {
      const d = this.parseLocalDate(a.dataHora);
      const key = `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}`;
      map.set(key, (map.get(key)||0) + a.valorTotal);
    }
    const keys = Array.from(map.keys()).sort();
    const last = keys.slice(-6);
    return last.map(k=>({mes:k, valor: + (map.get(k) || 0).toFixed(2)}));
  }
  polylineCustoPorMesPoints(): string {
    const s = this.custoTotalPorMes().map(x=>x.valor);
    if (s.length===0) return '';
    const n = Math.max(s.length-1, 1);
    const max = Math.max(...s);
    const min = Math.min(...s);
    const span = Math.max(max-min, 1);
    return s.map((v,i)=>{
      const x = i * (100/n);
      const y = 40 - ((v-min) * (40/span));
      return `${x},${y}`;
    }).join(' ');
  }

  litrosPeriodo(): number {
    return +this.abastecimentosFiltrados().reduce((sum,a)=>sum+a.litros,0).toFixed(2);
  }
  gastoPeriodo(): number {
    return +this.abastecimentosFiltrados().reduce((sum,a)=>sum+a.valorTotal,0).toFixed(2);
  }
  precoMedioLitroPeriodo(): number | null {
    const arr = this.abastecimentosFiltrados();
    const litros = arr.reduce((s,a)=>s+a.litros,0);
    if (litros===0) return null;
    return +(arr.reduce((s,a)=>s+a.valorTotal,0)/litros).toFixed(3);
  }
  abastecimentosCountPeriodo(): number {
    return this.abastecimentosFiltrados().length;
  }
  veiculoMaiorConsumoPeriodo(): string | null {
    const map = new Map<string, number>();
    for (const a of this.abastecimentosFiltrados()) {
      map.set(a.veiculo, (map.get(a.veiculo) || 0) + a.litros);
    }
    let best: {placa:string, litros:number} | null=null;
    for (const [placa, litros] of map) {
      if (!best || litros>best.litros) best={placa, litros};
    }
    return best?.placa ?? null;
  }
  fornecedorMaisUtilizadoPeriodo(): string | null {
    const map = new Map<number, number>();
    for (const a of this.abastecimentosFiltrados()) {
      map.set(a.fornecedorId, (map.get(a.fornecedorId)||0) + a.litros);
    }
    let bestId:number|null=null, bestLit=0;
    map.forEach((lit,fid)=>{ if (lit>bestLit){ bestLit=lit; bestId=fid; }});
    return this.fornecedorById(bestId)?.nome ?? null;
  }

  participacaoFornecedores(): Array<{ nome:string, percent:number }> {
    const arr = this.abastecimentosFiltrados();
    const total = arr.reduce((s,a)=>s+a.litros,0);
    const map = new Map<number, number>();
    for (const a of arr) map.set(a.fornecedorId, (map.get(a.fornecedorId)||0)+a.litros);
    const list = Array.from(map.entries()).map(([fid, litros])=>({nome: this.fornecedorById(fid)?.nome || `Fornecedor ${fid}`, percent: total? +(litros*100/total).toFixed(1):0}));
    return list.sort((a,b)=>b.percent - a.percent);
  }

  precoMedioPorFornecedor(): Array<{ nome:string, combustivel: Combustivel, media:number }> {
    const arr = this.abastecimentosFiltrados();
    const grouped = new Map<string, {sum:number, liters:number, combustivel: Combustivel}>();
    for (const a of arr) {
      const key = `${a.fornecedorId}|${a.combustivel}`;
      const g = grouped.get(key) || {sum:0, liters:0, combustivel: a.combustivel};
      g.sum += a.valorTotal;
      g.liters += a.litros;
      grouped.set(key, g);
    }
    const list: Array<{ nome:string, combustivel: Combustivel, media:number }> = [];
    for (const [key, g] of grouped) {
      const fid = +key.split('|')[0];
      const nome = this.fornecedorById(fid)?.nome || `Fornecedor ${fid}`;
      const media = g.liters? +(g.sum/g.liters).toFixed(3): 0;
      list.push({ nome, combustivel: g.combustivel, media });
    }
    return list.sort((a,b)=>a.nome.localeCompare(b.nome));
  }

  variacaoPercentualMesAnterior(combustivel: Combustivel): number | null {
    const now = new Date();
    const curY = now.getFullYear(); const curM = now.getMonth();
    const prevY = curM===0? curY-1:curY; const prevM = curM===0? 11: curM-1;
    const arrCur = this.abastecimentos.filter(a=>{
      const d = this.parseLocalDate(a.dataHora);
      return d.getFullYear()===curY && d.getMonth()===curM && a.combustivel===combustivel;
    });
    const arrPrev = this.abastecimentos.filter(a=>{
      const d = this.parseLocalDate(a.dataHora);
      return d.getFullYear()===prevY && d.getMonth()===prevM && a.combustivel===combustivel;
    });
    const avgCur = arrCur.length? (arrCur.reduce((s,a)=>s+a.valorTotal,0)/arrCur.reduce((s,a)=>s+a.litros,0)) : null;
    const avgPrev = arrPrev.length? (arrPrev.reduce((s,a)=>s+a.valorTotal,0)/arrPrev.reduce((s,a)=>s+a.litros,0)) : null;
    if (avgCur==null || avgPrev==null) return null;
    return +(((avgCur - avgPrev)/avgPrev)*100).toFixed(2);
  }

  minMaxPrecoPeriodo(combustivel: Combustivel): {min:number|null,max:number|null} {
    const arr = this.abastecimentosFiltrados().filter(a=>a.combustivel===combustivel);
    if (arr.length===0) return {min:null, max:null};
    const prices = arr.map(a=>a.precoBomba);
    return {min:+Math.min(...prices).toFixed(3), max:+Math.max(...prices).toFixed(3)};
  }

  rankingFornecedoresPorCustoMedio(combustivel?: Combustivel): Array<{nome:string, media:number}> {
    const arr = this.abastecimentosFiltrados().filter(a=> !combustivel || a.combustivel === combustivel);
    const map = new Map<number,{sum:number, liters:number}>();
    for (const a of arr) {
      const g = map.get(a.fornecedorId) || {sum:0, liters:0};
      g.sum += a.valorTotal;
      g.liters += a.litros;
      map.set(a.fornecedorId, g);
    }
    const list: Array<{nome:string, media:number}> = Array.from(map.entries()).map(([fid, g])=>({
      nome: this.fornecedorById(fid)?.nome || `Fornecedor ${fid}`,
      media: g.liters ? +(g.sum/g.liters).toFixed(3) : 0
    }));
    return list.sort((a,b)=>a.media - b.media);
  }

  sumSegmentsPercent(segments: Array<{combustivel: Combustivel, percent:number}>): number {
    const total = segments.reduce((s,seg)=>s + seg.percent, 0);
    return +total.toFixed(1);
  }

  maxRankingMedia(combustivel?: Combustivel): number {
    const arr = this.rankingFornecedoresPorCustoMedio(combustivel);
    if (arr.length===0) return 1;
    return Math.max(...arr.map(r=>r.media));
  }

  colorRankingBar(i: number): string {
    return i === 0 ? '#22c55e' : '#0d9488';
  }

  rankingTooltip(r: {nome: string; media: number}): string {
    return `${r.nome} · R$ ${r.media.toFixed(3)}/L`;
  }

  colorParticipationBar(i: number): string {
    return i === 0 ? '#22c55e' : '#0d9488';
  }
  participationTooltip(p: {nome: string; percent: number}): string {
    return `${p.nome} · ${p.percent}% de participação`;
  }

  colorKmLBar(i: number): string {
    return i === 0 ? '#22c55e' : '#0d9488';
  }
  kmLTooltip(v: {placa: string; kmL: number}): string {
    return `${v.placa} · ${v.kmL} km/L`;
  }
  stackedPorFornecedorCombustivel(): Array<{nome:string, segments:Array<{combustivel: Combustivel, percent:number}>}> {
    const arr = this.abastecimentosFiltrados();
    const byFornecedor = new Map<number, Map<Combustivel, number>>();
    for (const a of arr) {
      const f = byFornecedor.get(a.fornecedorId) || new Map<Combustivel, number>();
      f.set(a.combustivel, (f.get(a.combustivel)||0) + a.litros);
      byFornecedor.set(a.fornecedorId, f);
    }
    const res: Array<{nome:string, segments:Array<{combustivel: Combustivel, percent:number}>}> = [];
    byFornecedor.forEach((mapF, fid)=>{
      const nome = this.fornecedorById(fid)?.nome || `Fornecedor ${fid}`;
      const total = Array.from(mapF.values()).reduce((s,v)=>s+v,0);
      const segments = Array.from(mapF.entries()).map(([combustivel, litros])=>({combustivel, percent: total? +(litros*100/total).toFixed(1): 0})).sort((a,b)=>b.percent - a.percent);
      res.push({nome, segments});
    });
    return res.sort((a,b)=>a.nome.localeCompare(b.nome));
  }
  colorCombustivel(c: Combustivel): string {
    switch(c){
      case 'Diesel S10': return '#0d9488';
      case 'Diesel S500': return '#14b8a6';
      case 'Gasolina': return '#ef4444';
      case 'Etanol': return '#22c55e';
      case 'GNV': return '#3b82f6';
      default: return '#9ca3af';
    }
  }
  kmLPorVeiculo(): Array<{placa:string, kmL:number}> {
    const map = new Map<string,{km:number, litros:number}>();
    for (const a of this.abastecimentosFiltrados()) {
      if (a.kmsRodados!=null) {
        const g = map.get(a.veiculo) || {km:0, litros:0};
        g.km += a.kmsRodados; g.litros += a.litros; map.set(a.veiculo,g);
      }
    }
    const list = Array.from(map.entries()).map(([placa,g])=>({placa, kmL: g.litros? +(g.km/g.litros).toFixed(2): 0}));
    return list.sort((a,b)=>b.kmL - a.kmL);
  }
  maxKmL(): number {
    const vals = this.kmLPorVeiculo().map(v=>v.kmL);
    if (vals.length===0) return 1;
    return Math.max(...vals);
  }
  mediaGeralConsumoFrota(): number | null {
    const totalKm = this.abastecimentosFiltrados().reduce((s,a)=>s+(a.kmsRodados||0),0);
    const totalL = this.abastecimentosFiltrados().reduce((s,a)=>s+a.litros,0);
    if (totalL===0) return null;
    return + (totalKm / totalL).toFixed(2);
  }
  desvioConsumoPorVeiculo(): Array<{placa:string, desvioPct:number}> {
    const list = this.kmLPorVeiculo();
    return list.map(({placa, kmL})=>{
      const exp = this.consumoEsperadoPorVeiculo[placa] ?? null;
      const desvioPct = exp? +(((kmL - exp)/exp)*100).toFixed(2): 0;
      return {placa, desvioPct};
    }).sort((a,b)=>a.desvioPct - b.desvioPct);
  }

  diferencaMediaPrecoNotaPct(): number | null {
    const arr = this.abastecimentosFiltrados().filter(a=>a.precoNota!=null);
    if (arr.length===0) return null;
    const diffs = arr.map(a=> ((a.precoNota! - a.precoBomba)/a.precoBomba)*100 );
    const avg = diffs.reduce((s,d)=>s+d,0)/diffs.length;
    return +avg.toFixed(2);
  }
  valorTotalDivergente(): number {
    const arr = this.abastecimentosFiltrados().filter(a=>a.precoNota!=null);
    const sum = arr.reduce((s,a)=> s + Math.abs((a.precoNota! - a.precoBomba)) * a.litros, 0);
    return +sum.toFixed(2);
  }
  quantNotasComDiferenca(): number {
    return this.abastecimentosFiltrados().filter(a=>a.precoNota!=null && Math.abs((a.precoNota! - a.precoBomba)/a.precoBomba) > 0.02).length;
  }
  fornecedorMaiorIndiceDivergencia(): string | null {
    const arr = this.abastecimentosFiltrados().filter(a=>a.precoNota!=null);
    const map = new Map<number,{sumPct:number, count:number}>();
    for (const a of arr) {
      const pct = ((a.precoNota! - a.precoBomba)/a.precoBomba)*100;
      const g = map.get(a.fornecedorId) || {sumPct:0, count:0};
      g.sumPct += pct; g.count += 1; map.set(a.fornecedorId, g);
    }
    let bestId:number|null=null, bestAvg=-Infinity;
    map.forEach((g,fid)=>{ const avg = g.sumPct / g.count; if (avg>bestAvg){ bestAvg=avg; bestId=fid; }});
    return this.fornecedorById(bestId)?.nome ?? null;
  }

  alertas(): Array<{tipo:string, descricao:string, veiculo:string, fornecedor:string, dataHora:string}> {
    const res: Array<{tipo:string, descricao:string, veiculo:string, fornecedor:string, dataHora:string}> = [];
    const arr = this.abastecimentosFiltrados();
    for (const a of arr) {
      const d = this.parseLocalDate(a.dataHora);
      const hr = d.getHours();
      if (hr < 6 || hr > 22) {
        res.push({tipo:'Fora do horário', descricao:`${hr}h`, veiculo:a.veiculo, fornecedor:this.fornecedorById(a.fornecedorId)?.nome||'', dataHora:a.dataHora});
      }
      const cap = this.capacidadeTanquePorVeiculo[a.veiculo];
      if (cap && a.litros > cap) {
        res.push({tipo:'Litros acima capacidade', descricao:`${a.litros}L > ${cap}L`, veiculo:a.veiculo, fornecedor:this.fornecedorById(a.fornecedorId)?.nome||'', dataHora:a.dataHora});
      }
      if (a.precoNota!=null) {
        const pct = Math.abs((a.precoNota - a.precoBomba)/a.precoBomba);
        if (pct > 0.05) {
          res.push({tipo:'Diferença preço > 5%', descricao:`${(pct*100).toFixed(1)}%`, veiculo:a.veiculo, fornecedor:this.fornecedorById(a.fornecedorId)?.nome||'', dataHora:a.dataHora});
        }
      }
      if (a.kmsRodados!=null) {
        const exp = this.consumoEsperadoPorVeiculo[a.veiculo];
        if (exp) {
          const kmL = a.kmsRodados / a.litros;
          const dev = Math.abs((kmL - exp)/exp);
          if (dev > 0.2) {
            res.push({tipo:'Consumo fora da média', descricao:`${kmL.toFixed(2)} km/L`, veiculo:a.veiculo, fornecedor:this.fornecedorById(a.fornecedorId)?.nome||'', dataHora:a.dataHora});
          }
        }
      }
    }
    return res;
  }
}