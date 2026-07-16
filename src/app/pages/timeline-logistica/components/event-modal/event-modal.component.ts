import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapViewerComponent, MapMarker, MapPolyline } from '@shared/components';
import { TimelineEventModalData } from '../../models/timeline-logistica.model';

@Component({
  selector: 'app-timeline-event-modal',
  standalone: true,
  imports: [CommonModule, MapViewerComponent],
  templateUrl: './event-modal.component.html',
  styleUrls: []
})
export class TimelineEventModalComponent {
  @Input({ required: true }) data!: TimelineEventModalData;
  @Input({ required: true }) markers: MapMarker[] = [];
  @Input({ required: true }) polylines: MapPolyline[] = [];
  @Input({ required: true }) mapSummary: string = '';
  @Output() close = new EventEmitter<void>();
}
