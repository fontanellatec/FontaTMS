import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FilterSectionComponent, FilterConfig, PageLayoutComponent, KpiSectionComponent, KpiConfig } from '@shared/components';
import { TrackedVehicle } from '../models/tracking.model';
import { TrackingService } from '../services/tracking.service';

@Component({
  selector: 'app-tracking',
  templateUrl: './tracking-list.component.html',
  styleUrls: ['./tracking-list.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, FilterSectionComponent, KpiSectionComponent, PageLayoutComponent]
})
export class TrackingComponent implements OnInit, AfterViewInit, OnDestroy {
  filtroFrota = '';
  filtroPlaca = '';
  filtroCoordenador = '';
  filtroGestor = '';

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
    this.loadData();
  }

  onClearFilters(): void {
    this.filtroFrota = '';
    this.filtroPlaca = '';
    this.filtroCoordenador = '';
    this.filtroGestor = '';
    this.filterConfigs.forEach(f => f.value = '');
    this.postMapData('vehicles');
  }

  selectedPlaca: string | null = null;

  kpiOp: { utilPct: number; activeCount: number; kmRestSum: number; etaAvgMin: number | null; semRota: number; total: number } = {
    utilPct: 0,
    activeCount: 0,
    kmRestSum: 0,
    etaAvgMin: null,
    semRota: 0,
    total: 0
  };

  vehicles: TrackedVehicle[] = [];

  constructor(private trackingService: TrackingService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.trackingService.getTrackedVehicles().subscribe({
      next: (v) => {
        this.vehicles = v || [];
        this.postMapData('vehicles');
      },
      error: (err) => console.error('Erro ao carregar veículos para rastreamento', err)
    });
  }

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
      { label: 'Utilização', value: op.total ? op.utilPct : 0, icon: 'check-circle', format: 'percentage', color: 'var(--brand-primary)' },
      { label: 'Rotas ativas', value: op.activeCount, icon: 'route', format: 'number', color: 'var(--success)' },
      { label: 'Km restantes', value: op.activeCount ? `${op.kmRestSum.toLocaleString('pt-BR')} km` : '—', icon: 'route', format: 'text', color: 'var(--info)' },
      { label: 'ETA médio', value: op.etaAvgMin != null ? this.formatMinutes(op.etaAvgMin) : '—', icon: 'refresh', format: 'text', color: 'var(--warning, #d97706)' },
      { label: 'Sem rota', value: op.semRota, icon: 'stop-circle', format: 'number', color: '#64748b' }
    ];
  }

  onPesquisar(): void {
    this.postMapData('vehicles');
  }

  private mapIframe?: HTMLIFrameElement;
  private mapReady = false;
  private onMapMessageBound = (ev: MessageEvent) => this.onMapMessage(ev);
  private themeObserver?: MutationObserver;

  ngAfterViewInit(): void {
    this.mapIframe = document.getElementById('map-iframe') as HTMLIFrameElement | null || undefined;
    window.addEventListener('message', this.onMapMessageBound);
    setTimeout(() => { if (this.mapReady) { this.postMapData('vehicles'); } }, 500);
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
      this.postTheme();
      return;
    }
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