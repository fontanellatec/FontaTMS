import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';

export interface MapMarker {
  lat: number;
  lng: number;
  popupHtml?: string;
  tooltipText?: string;
  iconType?: 'truck' | 'origin' | 'destination' | 'supplier' | 'vehicle' | 'circle';
  iconHtml?: string; // custom DivIcon HTML
  color?: string; // for circle markers
  radius?: number; // for circle markers
}

export interface MapPolyline {
  points: [number, number][];
  color?: string;
  weight?: number;
  opacity?: number;
}

export interface MapCircle {
  center: [number, number];
  radiusMeters: number;
  color?: string;
  fillColor?: string;
  fillOpacity?: number;
}

@Component({
  selector: 'app-map-viewer',
  standalone: true,
  imports: [CommonModule],
  template: `<div #mapContainer class="map-container-inner" style="width: 100%; height: 100%; min-height: 200px;"></div>`,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
  `]
})
export class MapViewerComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;

  @Input() markers: MapMarker[] = [];
  @Input() polylines: MapPolyline[] = [];
  @Input() circles: MapCircle[] = [];
  @Input() center: [number, number] = [-14.235004, -51.92528];
  @Input() zoom: number = 4;
  @Input() zoomControl: boolean = false;
  @Input() attributionControl: boolean = true;
  @Input() fitBoundsOnChanges: boolean = true;
  @Input() interactiveClick: boolean = false;

  @Output() mapClick = new EventEmitter<L.LeafletMouseEvent>();
  @Output() mapReady = new EventEmitter<L.Map>();

  private map?: L.Map;
  private markersLayer = L.layerGroup();
  private routesLayer = L.layerGroup();
  private circlesLayer = L.layerGroup();

  // Icons definition
  private icons = {
    truck: L.divIcon({
      className: 'truck-marker-icon',
      html: '<div class="truck-marker" style="font-size: 24px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">🚚</div>',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12]
    }),
    origin: L.divIcon({
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
    }),
    destination: L.divIcon({
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
    }),
    supplier: L.divIcon({
      className: 'supplier-icon',
      html: '<div class="marker" style="font-size: 24px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));"><span class="emoji">⛽️</span></div>',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14]
    }),
    vehicle: L.divIcon({
      className: 'vehicle-icon',
      html: '<div class="marker" style="font-size: 24px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));"><span class="emoji">🚚</span></div>',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14]
    })
  };

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.map) {
      if (changes['markers'] || changes['polylines'] || changes['circles']) {
        this.renderLayers();
      }
      if (changes['center'] && !changes['center'].firstChange) {
        this.map.setView(this.center, this.map.getZoom());
      }
    }
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = undefined;
    }
  }

  private initMap(): void {
    const el = this.mapContainer.nativeElement;
    this.map = L.map(el, {
      zoomControl: this.zoomControl,
      attributionControl: this.attributionControl
    }).setView(this.center, this.zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    this.markersLayer.addTo(this.map);
    this.routesLayer.addTo(this.map);
    this.circlesLayer.addTo(this.map);

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      if (this.interactiveClick) {
        this.mapClick.emit(e);
      }
    });

    this.mapReady.emit(this.map);
    this.renderLayers();
  }

  private renderLayers(): void {
    if (!this.map) return;

    this.markersLayer.clearLayers();
    this.routesLayer.clearLayers();
    this.circlesLayer.clearLayers();

    const boundsPoints: L.LatLngExpression[] = [];

    // Render Markers
    if (this.markers && this.markers.length) {
      for (const m of this.markers) {
        const markerCoords: [number, number] = [m.lat, m.lng];
        boundsPoints.push(markerCoords);

        if (m.iconType === 'circle') {
          // Circle marker
          const circleMarker = L.circleMarker(markerCoords, {
            radius: m.radius || 8,
            color: m.color || '#2563eb',
            weight: 2,
            fillColor: m.color || '#2563eb',
            fillOpacity: 0.9
          });
          if (m.popupHtml) circleMarker.bindPopup(m.popupHtml);
          if (m.tooltipText) circleMarker.bindTooltip(m.tooltipText);
          circleMarker.addTo(this.markersLayer);
        } else {
          // Standard marker
          let icon = this.icons.truck;
          if (m.iconType && this.icons[m.iconType as keyof typeof this.icons]) {
            icon = this.icons[m.iconType as keyof typeof this.icons];
          } else if (m.iconHtml) {
            icon = L.divIcon({
              className: 'custom-map-icon',
              html: m.iconHtml,
              iconSize: [28, 28],
              iconAnchor: [14, 14]
            });
          }

          const leafMarker = L.marker(markerCoords, { icon });
          if (m.popupHtml) leafMarker.bindPopup(m.popupHtml);
          if (m.tooltipText) leafMarker.bindTooltip(m.tooltipText);
          leafMarker.addTo(this.markersLayer);
        }
      }
    }

    // Render Polylines
    if (this.polylines && this.polylines.length) {
      for (const p of this.polylines) {
        if (p.points && p.points.length >= 2) {
          L.polyline(p.points as L.LatLngExpression[], {
            color: p.color || '#2563eb',
            weight: p.weight || 4,
            opacity: p.opacity || 0.9
          }).addTo(this.routesLayer);
          p.points.forEach(pts => boundsPoints.push(pts));
        }
      }
    }

    // Render Circles
    if (this.circles && this.circles.length) {
      for (const c of this.circles) {
        if (c.center) {
          L.circle(c.center as L.LatLngExpression, {
            radius: c.radiusMeters,
            color: c.color || '#2563eb',
            weight: 1,
            fillColor: c.fillColor || '#2563eb',
            fillOpacity: c.fillOpacity || 0.08
          }).addTo(this.circlesLayer);
          boundsPoints.push(c.center);
        }
      }
    }

    // Auto fit bounds
    if (this.fitBoundsOnChanges && boundsPoints.length) {
      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize();
          if (boundsPoints.length >= 2) {
            this.map.fitBounds(L.latLngBounds(boundsPoints as any), { padding: [24, 24] });
          } else if (boundsPoints.length === 1) {
            this.map.setView(boundsPoints[0] as L.LatLngExpression, 6);
          }
        }
      }, 0);
    }
  }

  // Exposed API helper methods
  zoomIn(): void {
    this.map?.zoomIn();
  }

  zoomOut(): void {
    this.map?.zoomOut();
  }

  setView(center: [number, number], zoom: number): void {
    this.map?.setView(center, zoom);
  }

  fitBounds(bounds: L.LatLngBoundsExpression): void {
    this.map?.fitBounds(bounds, { padding: [24, 24] });
  }

  fitBoundsForPoints(points: [number, number][]): void {
    if (this.map && points.length) {
      if (points.length >= 2) {
        this.map.fitBounds(L.latLngBounds(points as any), { padding: [24, 24] });
      } else {
        this.map.setView(points[0], 6);
      }
    }
  }

  invalidateSize(): void {
    this.map?.invalidateSize();
  }
}

