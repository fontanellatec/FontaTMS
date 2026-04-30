import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FilterSectionComponent, FilterConfig } from '../../shared/components/filter-section/filter-section.component';
import { KpiSectionComponent, KpiConfig } from '../../shared/components/kpi-section/kpi-section.component';

interface TrackedVehicle {
  frota: string;
  placa: string;
  coordenador: string;
  gestor: string;
  localizacao: string;
  lat: number;
  lng: number;
}

@Component({
  selector: 'app-tracking',
  templateUrl: './tracking.component.html',
  styleUrls: ['./tracking.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, FilterSectionComponent, KpiSectionComponent]
})
export class TrackingComponent implements AfterViewInit, OnDestroy {
  // Filtros
  filtroFrota = '';
  filtroPlaca = '';
  filtroCoordenador = '';
  filtroGestor = '';

  // Configuração do componente de filtros reutilizável
  filterConfigs: FilterConfig[] = [
    { type: 'text', label: 'Nº Frota', key: 'frota', value: this.filtroFrota, placeholder: 'ex.: 116' },
    { type: 'text', label: 'Placa', key: 'placa', value: this.filtroPlaca, placeholder: 'ex.: ABC1D23' },
    { type: 'text', label: 'Coordenador', key: 'coordenador', value: this.filtroCoordenador, placeholder: 'Nome do coordenador' },
    { type: 'text', label: 'Gestor', key: 'gestor', value: this.filtroGestor, placeholder: 'Nome do gestor' }
  ];

  onFiltersChange(filterValues: any): void {
    this.filtroFrota = filterValues.frota || '';
    this.filtroPlaca = filterValues.placa || '';
    this.filtroCoordenador = filterValues.coordenador || '';
    this.filtroGestor = filterValues.gestor || '';
    this.postMapData('vehicles');
  }

  onApplyFilters(filterValues: any): void {
    this.onFiltersChange(filterValues);
  }

  onClearFilters(): void {
    this.filtroFrota = '';
    this.filtroPlaca = '';
    this.filtroCoordenador = '';
    this.filtroGestor = '';
    this.filterConfigs.forEach(f => f.value = '');
    this.postMapData('vehicles');
  }

  // Seleção atual (para destacar item na lista)
  selectedPlaca: string | null = null;

  // KPIs de operação enviados pelo iframe
  kpiOp: { utilPct: number; activeCount: number; kmRestSum: number; etaAvgMin: number | null; semRota: number; total: number } = {
    utilPct: 0,
    activeCount: 0,
    kmRestSum: 0,
    etaAvgMin: null,
    semRota: 0,
    total: 0
  };

  // Dados simulados
  vehicles: TrackedVehicle[] = [
    { frota: '116', placa: 'LZX0J21', coordenador: 'Vítor | Laura Müller-SC', gestor: 'Rogério Cardoso', localizacao: 'SÃO PAULO-SP', lat: -23.5505, lng: -46.6333 },
    { frota: '201', placa: 'HZX3C90', coordenador: 'Ewerton | Laura Müller-SC', gestor: 'Bruno de Souza Meneire', localizacao: 'CASCAVEL-PR', lat: -24.9555, lng: -53.4552 },
    { frota: '311', placa: 'MYJ4A32', coordenador: 'Ewerton | Laura Müller-SC', gestor: 'Daniane | Sta. Gertrudes-SP', localizacao: 'STA. GERTRUDES-SP', lat: -22.3129, lng: -47.7196 },
    { frota: '344', placa: 'ABC1D23', coordenador: 'Bertan | Laura Müller-SC', gestor: 'Daniane | Sta. Gertrudes-SP', localizacao: 'SÃO PAULO-SP', lat: -23.5505, lng: -46.6333 },
    { frota: '198', placa: 'EFG4H56', coordenador: 'Bertan | Laura Müller-SC', gestor: 'Rogério Cardoso', localizacao: 'RIO DE JANEIRO-RJ', lat: -22.9068, lng: -43.1729 },
    { frota: '212', placa: 'IJK7L89', coordenador: 'Ewerton | Laura Müller-SC', gestor: 'Bruno de Souza Meneire', localizacao: 'CAMPINAS-SP', lat: -22.9099, lng: -47.0626 },
    { frota: '221', placa: 'MNO1P23', coordenador: 'Vítor | Laura Müller-SC', gestor: 'Rogério Cardoso', localizacao: 'SOROCABA-SP', lat: -23.5017, lng: -47.4526 }
  ];

  get filtered(): TrackedVehicle[] {
    const fF = this.filtroFrota.trim().toLowerCase();
    const fP = this.filtroPlaca.trim().toLowerCase();
    const fC = this.filtroCoordenador.trim().toLowerCase();
    const fG = this.filtroGestor.trim().toLowerCase();
    return this.vehicles.filter(v =>
      (!fF || v.frota.toLowerCase().includes(fF)) &&
      (!fP || v.placa.toLowerCase().includes(fP)) &&
      (!fC || v.coordenador.toLowerCase().includes(fC)) &&
      (!fG || v.gestor.toLowerCase().includes(fG))
    );
  }

  get kpiConfigs(): KpiConfig[] {
    const list = this.filtered;
    const total = list.length;
    const gestores = new Set(list.map(v => v.gestor)).size;
    const coordenadores = new Set(list.map(v => v.coordenador)).size;
    const ufs = new Set(list.map(v => this.extractUF(v.localizacao)).filter(Boolean)).size;

    const op = this.kpiOp;

    return [
      { label: 'Veículos', value: total, icon: 'truck', format: 'number', color: 'var(--info)' },
      { label: 'Gestores', value: gestores, icon: 'users', format: 'number', color: 'var(--brand-primary)' },
      { label: 'Coordenadores', value: coordenadores, icon: 'users', format: 'number', color: 'var(--warning, #d97706)' },
      { label: 'UFs', value: ufs, icon: 'route', format: 'number', color: 'var(--success)' },
      // Novos KPIs de operação (recebidos do iframe)
      { label: 'Utilização', value: op.total ? op.utilPct : 0, icon: 'check-circle', format: 'percentage', color: 'var(--brand-primary)' },
      { label: 'Rotas ativas', value: op.activeCount, icon: 'route', format: 'number', color: 'var(--success)' },
      { label: 'Km restantes', value: op.activeCount ? `${op.kmRestSum.toLocaleString('pt-BR')} km` : '—', icon: 'route', format: 'text', color: 'var(--info)' },
      { label: 'ETA médio', value: op.etaAvgMin != null ? this.formatMinutes(op.etaAvgMin) : '—', icon: 'refresh', format: 'text', color: 'var(--warning, #d97706)' },
      { label: 'Sem rota', value: op.semRota, icon: 'stop-circle', format: 'number', color: '#64748b' }
    ];
  }

  onPesquisar(): void {
    // Filtro reativo; aciona atualização do mapa via iframe.
    this.postMapData('vehicles');
  }

  // Referência ao iframe do mapa e estado
  private mapIframe?: HTMLIFrameElement;
  private mapReady = false;
  private onMapMessageBound = (ev: MessageEvent) => this.onMapMessage(ev);
  private themeObserver?: MutationObserver;

  ngAfterViewInit(): void {
    this.mapIframe = document.getElementById('map-iframe') as HTMLIFrameElement | null || undefined;
    window.addEventListener('message', this.onMapMessageBound);
    // Caso o iframe já esteja pronto, tentamos enviar os dados iniciais após pequeno atraso
    setTimeout(() => { if (this.mapReady) { this.postMapData('vehicles'); } }, 500);
    // Envia tema inicial e observa alterações de tema do app
    this.postTheme();
    this.themeObserver = new MutationObserver(() => this.postTheme());
    this.themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }

  ngOnDestroy(): void {
    window.removeEventListener('message', this.onMapMessageBound);
    this.themeObserver?.disconnect();
  }

  private onMapMessage(ev: MessageEvent): void {
    const data: any = ev.data || {};
    if (data.type === 'MAP_READY') {
      this.mapReady = true;
      this.postMapData('vehicles');
      // Reenvia tema quando o iframe sinaliza estar pronto
      this.postTheme();
      return;
    }
    // Recebe KPIs de operação do iframe
    if (data.type === 'OP_KPIS' && data.kpis) {
      const k = data.kpis || {};
      this.kpiOp = {
        utilPct: Number(k.utilPct) || 0,
        activeCount: Number(k.activeCount) || 0,
        kmRestSum: Number(k.kmRestSum) || 0,
        etaAvgMin: (typeof k.etaAvgMin === 'number') ? k.etaAvgMin : (k.etaAvgMin == null ? null : Number(k.etaAvgMin)),
        semRota: Number(k.semRota) || 0,
        total: Number(k.total) || 0
      };
      return;
    }
  }

  private extractUF(localizacao: string): string | undefined {
    try {
      const parts = localizacao.split('-');
      const uf = parts[parts.length - 1].trim();
      return uf && uf.length <= 3 ? uf : undefined;
    } catch {
      return undefined;
    }
  }

  private postMapData(filterType: 'vehicles' | 'all' | 'focus'): void {
    if (!this.mapIframe || !this.mapIframe.contentWindow) return;
    const list = this.filtered;
    const vehiclesPayload = list.map((v, idx) => ({
      id: idx + 1,
      nome: v.placa || `Veículo ${idx + 1}`,
      placa: v.placa,
      uf: this.extractUF(v.localizacao),
      lat: v.lat,
      lng: v.lng
    }));

    const payload: any = {
      type: 'MAP_DATA',
      filter: filterType,
      vehicles: vehiclesPayload,
      loads: [],
      confirmedRoutes: []
    };

    if (filterType === 'focus' && this.selectedPlaca) {
      const found = vehiclesPayload.find(v => v.placa === this.selectedPlaca);
      if (found) {
        payload.focusVehicle = found;
      }
    }

    try {
      this.mapIframe.contentWindow.postMessage(payload, '*');
    } catch {
      // Silencia erros de comunicação cross-origin
    }
  }

  focusVehicle(v: TrackedVehicle): void {
    this.selectedPlaca = v.placa;
    // Envia foco ao mapa via payload
    this.postMapData('focus');
  }

  private scrollToVehicle(placa: string): void {
    const el = document.querySelector(`[data-placa="${placa}"]`) as HTMLElement | null;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.focus({ preventScroll: true });
    }
  }

  onVehicleClick(v: TrackedVehicle): void {
    // Alterna seleção e envia foco
    if (this.selectedPlaca === v.placa) {
      this.selectedPlaca = null;
      this.postMapData('vehicles');
    } else {
      this.focusVehicle(v);
      this.scrollToVehicle(v.placa);
    }
  }

  private postTheme(): void {
    const theme = document.documentElement.getAttribute('data-theme') || 'light';
    try {
      this.mapIframe?.contentWindow?.postMessage({ type: 'THEME', theme }, '*');
    } catch {
      // Silenciar possíveis erros de comunicação
    }
  }

  formatMinutes = (min?: number | null): string => {
    if (min == null || isNaN(min)) return '—';
    const m = Math.round(min);
    const h = Math.floor(m / 60);
    const rem = Math.round(m % 60);
    if (h <= 0) return `${rem} min`;
    return `${h} h${rem > 0 ? ` ${rem} min` : ''}`;
  };
}