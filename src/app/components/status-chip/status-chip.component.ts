import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export type DeliveryStatus = 'assigned' | 'pending' | 'in-progress' | 'delivered' | 'cancelled' | 'skipped' | 'failed';
export type ScheduleType = 'daily' | 'one-time' | 'alternate-day';
export type StatusChipKind = 'status' | 'schedule' | 'neutral';

@Component({
  selector: 'app-status-chip',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-chip.component.html',
  styleUrl: './status-chip.component.scss',
})
export class StatusChipComponent {
  @Input() label = '';
  @Input() kind: StatusChipKind = 'neutral';
  @Input() value?: DeliveryStatus | ScheduleType;

  get normalizedLabel(): string {
    return this.label || this.value?.replace(/-/g, ' ') || '';
  }

  get tone(): string {
    const value = this.value ?? '';
    if (value === 'delivered' || value === 'daily') {
      return 'positive';
    }
    if (value === 'assigned' || value === 'in-progress' || value === 'one-time') {
      return 'accent';
    }
    if (value === 'pending' || value === 'alternate-day') {
      return 'neutral';
    }
    return value === 'failed' || value === 'cancelled' ? 'danger' : 'muted';
  }
}
