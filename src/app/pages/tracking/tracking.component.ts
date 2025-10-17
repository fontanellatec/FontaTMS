import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import 'leaflet.markercluster';

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
  imports: [CommonModule, FormsModule]
})
export class TrackingComponent implements AfterViewInit, OnDestroy {
  // Filtros
  filtroFrota = '';
  filtroPlaca = '';
  filtroCoordenador = '';
  filtroGestor = '';

  // Seleção atual (para destacar item na lista)
  selectedPlaca: string | null = null;

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

  onPesquisar(): void {
    // Filtro reativo; re-render dos marcadores.
    this.renderMarkers();
  }

  // Mapa Leaflet
  private map?: L.Map;
  private markersLayer: L.MarkerClusterGroup = L.markerClusterGroup();
  private markerRefs = new Map<string, L.Marker>(); // key: placa

  // Ícone personalizado: caminhão (DivIcon)
  private truckIcon: L.DivIcon = L.divIcon({
    className: 'truck-marker-icon',
    html: '<div class="truck-marker">🚚</div>',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });

  ngAfterViewInit(): void {
    // Inicializa mapa centralizado no Brasil
    this.map = L.map('map', {
      zoomControl: false
    }).setView([-14.2350, -51.9253], 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    // Mantemos apenas os botões personalizados à direita; sem controles nativos do Leaflet

    // Layer de marcadores
    this.markersLayer.addTo(this.map);
    this.renderMarkers();
    // Zoom ao clicar em cluster
    this.markersLayer.on('clusterclick', (e: any) => {
      const cluster = e.layer as any;
      const bounds = cluster.getBounds?.();
      if (bounds) {
        this.map!.fitBounds(bounds.pad(0.1));
      } else {
        this.map!.zoomIn();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = undefined;
      this.markerRefs.clear();
    }
  }

  private renderMarkers(): void {
    if (!this.map) return;
    // Limpa camada
    this.markersLayer.clearLayers();
    this.markerRefs.clear();

    const list = this.filtered;
    for (const v of list) {
      const m = L.marker([v.lat, v.lng], { icon: this.truckIcon });
      m.bindPopup(`<strong>Placa:</strong> ${v.placa}<br/><strong>Frota:</strong> ${v.frota}<br/><strong>Localização:</strong> ${v.localizacao}`);
      m.on('click', () => {
        this.selectedPlaca = v.placa;
        this.scrollToVehicle(v.placa);
      });
      this.markersLayer.addLayer(m);
      this.markerRefs.set(v.placa, m);
    }

    // Ajusta visão para caber todos marcadores
    const bounds = this.markersLayer.getBounds();
    if (bounds && bounds.isValid()) {
      this.map.fitBounds(bounds.pad(0.1));
    }
  }

  zoomIn(): void { if (this.map) this.map.zoomIn(); }
  zoomOut(): void { if (this.map) this.map.zoomOut(); }
  resetView(): void {
    if (!this.map) return;
    const bounds = this.markersLayer.getBounds();
    if (bounds && bounds.isValid()) {
      this.map.fitBounds(bounds.pad(0.1));
    } else {
      this.map.setView([-14.2350, -51.9253], 5);
    }
  }

  focusVehicle(v: TrackedVehicle): void {
    if (!this.map) return;
    const m = this.markerRefs.get(v.placa);
    if (m) {
      this.selectedPlaca = v.placa;
      this.map.setView([v.lat, v.lng], Math.max(this.map.getZoom(), 12), { animate: true });
      m.openPopup();
    }
  }

  private scrollToVehicle(placa: string): void {
    const el = document.querySelector(`[data-placa="${placa}"]`) as HTMLElement | null;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.focus({ preventScroll: true });
    }
  }

  onVehicleClick(v: TrackedVehicle): void {
    // Se já está selecionado, limpa a seleção e recentra ao conjunto atual
    if (this.selectedPlaca === v.placa) {
      const m = this.markerRefs.get(v.placa);
      if (m) m.closePopup();
      this.selectedPlaca = null;
      this.resetView();
    } else {
      // Caso contrário, foca no veículo e seleciona
      this.focusVehicle(v);
    }
  }
}