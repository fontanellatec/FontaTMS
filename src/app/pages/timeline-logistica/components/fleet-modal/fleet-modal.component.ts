import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimelineFleetModalData } from '../../models/timeline-logistica.model';

@Component({
  selector: 'app-timeline-fleet-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './fleet-modal.component.html',
  styleUrls: []
})
export class TimelineFleetModalComponent {
  @Input({ required: true }) data!: TimelineFleetModalData;
  @Output() close = new EventEmitter<void>();
}
