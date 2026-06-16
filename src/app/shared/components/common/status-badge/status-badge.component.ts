import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-badge.component.html',
  styleUrls: ['./status-badge.component.scss']
})
export class StatusBadgeComponent {
  status = input<'success' | 'warning' | 'error' | 'info' | 'neutral'>('neutral');
  label = input<string>('');
  dot = input<boolean>(false);
  size = input<'sm' | 'md'>('md');
}
