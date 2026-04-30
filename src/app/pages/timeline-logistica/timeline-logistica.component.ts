import { CommonModule } from '@angular/common';
import { AfterViewChecked, Component, HostListener, OnDestroy } from '@angular/core';
import * as L from 'leaflet';

interface TimelineModalMetric {
  label: string;
  value: string;
  info?: string;
}

interface TimelineModalRow {
  label: string;
  value: string;
}

interface TimelineFleetTimelineItem {
  status: string;
  period: string;
  title: string;
  detail: string;
  color: string;
}

interface TimelineFleetModalData {
  title: string;
  subtitle: string;
  monthTag: string;
  summaryCards: TimelineModalMetric[];
  revenueEntries: TimelineModalRow[];
  expenseEntries: TimelineModalRow[];
  revenueTotal: string;
  expenseTotal: string;
  profit: string;
  detailedTime: TimelineModalMetric[];
  indicators: TimelineModalMetric[];
  timelineItems: TimelineFleetTimelineItem[];
}

interface TimelineEventModalData {
  title: string;
  subtitle: string;
  detailTitle: string;
  detailText: string;
  fleet: string;
  plate: string;
  driver: string;
  period: string;
  duration: string;
  month: string;
  statusType: string;
  faturamento?: string;
  faturamentoInfo?: string;
  mapMode?: 'route' | 'location';
  mapOriginLabel?: string;
  mapDestinationLabel?: string;
  mapLocationLabel?: string;
}

@Component({
  selector: 'app-timeline-logistica',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './timeline-logistica.component.html',
  styleUrls: ['./timeline-logistica.component.scss']
})
export class TimelineLogisticaComponent implements AfterViewChecked, OnDestroy {
  frameHeight = 1400;
  fleetModalData: TimelineFleetModalData | null = null;
  eventModalData: TimelineEventModalData | null = null;
  private shouldRenderEventMap = false;

  private eventMap?: L.Map;
  private eventMapMarkersLayer: L.LayerGroup = L.layerGroup();
  private eventMapRoutesLayer: L.LayerGroup = L.layerGroup();

  private readonly ufCoords: Record<string, [number, number]> = {
    AC: [-10.02, -67.81], AL: [-9.65, -35.74], AP: [0.04, -51.07], AM: [-3.12, -60.02],
    BA: [-12.97, -38.5], CE: [-3.73, -38.52], DF: [-15.78, -47.93], ES: [-20.32, -40.29],
    GO: [-16.67, -49.25], MA: [-2.53, -44.3], MG: [-19.92, -43.94], MS: [-20.47, -54.62],
    MT: [-15.6, -56.1], PA: [-1.45, -48.49], PB: [-7.12, -34.88], PE: [-8.05, -34.9],
    PI: [-5.09, -42.8], PR: [-25.43, -49.27], RJ: [-22.9, -43.2], RN: [-5.8, -35.21],
    RO: [-8.76, -63.9], RR: [2.82, -60.67], RS: [-30.03, -51.23], SC: [-27.59, -48.54],
    SE: [-10.91, -37.07], SP: [-23.55, -46.63], TO: [-10.18, -48.33]
  };

  private readonly cityCoords: Record<string, [number, number]> = {
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
    'Goiania': [-16.6869, -49.2648],
    'Sao Luis': [-2.5297, -44.3028],
    'Vitoria': [-20.3155, -40.3128],
    'Maceio': [-9.6658, -35.7350],
    'Aracaju': [-10.9472, -37.0731],
    'Teresina': [-5.0919, -42.8034],
    'Palmas': [-10.1840, -48.3336],
    'Natal': [-5.7945, -35.2110],
    'Rondonopolis': [-16.4708, -54.6356],
    'Campo Grande': [-20.4697, -54.6201],
    'Ribeirao Preto': [-21.1775, -47.8103],
    'Betim': [-19.9681, -44.1983],
    'Barueri': [-23.5111, -46.8764],
    'Imperatriz': [-5.5264, -47.4917],
    'Acailandia': [-4.9471, -47.5004],
    'Maraba': [-5.3811, -49.1323],
    'Araguaina': [-7.1926, -48.2044],
    'Aparecida de Goiania': [-16.8236, -49.2464],
    'Sao Jose dos Pinhais': [-25.5345, -49.2032],
    'Sorriso': [-12.5453, -55.7211],
    'Rio Verde': [-17.7923, -50.9192],
    'Uberaba': [-19.7472, -47.9392],
    'Jundiai': [-23.1864, -46.8842],
    'Camacari': [-12.6975, -38.3242],
    'Marilia': [-22.2171, -49.9501],
    'Triangulo Mineiro': [-18.4064, -48.8064]
  };

  @HostListener('window:message', ['$event'])
  onMessage(ev: MessageEvent): void {
    if (!ev.data || ev.data.source !== 'timeline-logistica') return;

    if (ev.data.type === 'open-fleet-modal' && ev.data.payload) {
      this.eventModalData = null;
      this.destroyEventMap();
      this.fleetModalData = ev.data.payload as TimelineFleetModalData;
      return;
    }

    if (ev.data.type === 'open-event-modal' && ev.data.payload) {
      this.fleetModalData = null;
      this.eventModalData = ev.data.payload as TimelineEventModalData;
      this.shouldRenderEventMap = true;
      return;
    }

    const height = Number(ev.data.height);
    if (!Number.isFinite(height) || height <= 0 || height > 20000) return;
    if (this.frameHeight === height) return;
    this.frameHeight = height;
  }

  @HostListener('window:keydown.escape')
  onEscape(): void {
    this.closeModal();
  }

  ngAfterViewChecked(): void {
    if (!this.shouldRenderEventMap || !this.eventModalData) return;

    const container = document.getElementById('timeline-event-map');
    if (!container || container.clientWidth === 0 || container.clientHeight === 0) return;

    this.shouldRenderEventMap = false;
    this.renderEventMap();
  }

  ngOnDestroy(): void {
    this.destroyEventMap();
  }

  closeModal(): void {
    this.fleetModalData = null;
    this.eventModalData = null;
    this.shouldRenderEventMap = false;
    this.destroyEventMap();
  }

  get eventMapSummary(): string {
    if (!this.eventModalData) return '';
    if (this.eventModalData.mapMode === 'route') {
      return `${this.eventModalData.mapOriginLabel || 'Origem'} -> ${this.eventModalData.mapDestinationLabel || 'Destino'}`;
    }
    return this.eventModalData.mapLocationLabel || 'Localizacao atual';
  }

  private normalizeLabel(value: string | undefined): string {
    return (value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private getCoordsForLabel(label: string | undefined): [number, number] | null {
    const normalized = this.normalizeLabel(label);
    if (!normalized) return null;

    const ufKey = normalized.toUpperCase();
    if (this.ufCoords[ufKey]) return this.ufCoords[ufKey];
    if (this.cityCoords[normalized]) return this.cityCoords[normalized];

    const cityEntry = Object.entries(this.cityCoords).find(([name]) => normalized.includes(name) || name.includes(normalized));
    if (cityEntry) return cityEntry[1];

    const ufEntry = Object.entries(this.ufCoords).find(([uf]) => normalized.includes(uf));
    return ufEntry ? ufEntry[1] : null;
  }

  private renderEventMap(): void {
    if (!this.eventModalData) return;

    const container = document.getElementById('timeline-event-map');
    if (!container) return;

    this.destroyEventMap();

    this.eventMap = L.map(container, {
      zoomControl: false,
      attributionControl: true
    }).setView([-14.235004, -51.92528], 4);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.eventMap);

    this.eventMapMarkersLayer.addTo(this.eventMap);
    this.eventMapRoutesLayer.addTo(this.eventMap);

    const bounds: L.LatLngExpression[] = [];

    if (this.eventModalData.mapMode === 'route') {
      const origin = this.getCoordsForLabel(this.eventModalData.mapOriginLabel);
      const destination = this.getCoordsForLabel(this.eventModalData.mapDestinationLabel);

      if (origin && destination) {
        L.circleMarker(origin, {
          radius: 8,
          color: '#38bdf8',
          weight: 2,
          fillColor: '#38bdf8',
          fillOpacity: 0.9
        }).bindTooltip(`Origem: ${this.eventModalData.mapOriginLabel || ''}`).addTo(this.eventMapMarkersLayer);

        L.circleMarker(destination, {
          radius: 8,
          color: '#f59e0b',
          weight: 2,
          fillColor: '#f59e0b',
          fillOpacity: 0.9
        }).bindTooltip(`Destino: ${this.eventModalData.mapDestinationLabel || ''}`).addTo(this.eventMapMarkersLayer);

        L.polyline([origin, destination], {
          color: '#2563eb',
          weight: 4,
          opacity: 0.9
        }).addTo(this.eventMapRoutesLayer);

        bounds.push(origin, destination);
      }
    } else {
      const current = this.getCoordsForLabel(this.eventModalData.mapLocationLabel);
      if (current) {
        L.circleMarker(current, {
          radius: 9,
          color: '#22c55e',
          weight: 2,
          fillColor: '#22c55e',
          fillOpacity: 0.9
        }).bindTooltip(`Localizacao atual: ${this.eventModalData.mapLocationLabel || ''}`).addTo(this.eventMapMarkersLayer);
        bounds.push(current);
      }
    }

    setTimeout(() => {
      if (!this.eventMap) return;
      this.eventMap.invalidateSize();

      if (bounds.length >= 2) {
        this.eventMap.fitBounds(L.latLngBounds(bounds), { padding: [24, 24] });
      } else if (bounds.length === 1) {
        this.eventMap.setView(bounds[0] as L.LatLngExpression, 6);
      } else {
        this.eventMap.setView([-14.235004, -51.92528], 4);
      }
    }, 0);
  }

  private destroyEventMap(): void {
    this.eventMapMarkersLayer.clearLayers();
    this.eventMapRoutesLayer.clearLayers();

    if (this.eventMap) {
      this.eventMap.remove();
      this.eventMap = undefined;
    }
  }
}
