import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export type DeliveryStatus = 'assigned' | 'pending' | 'in-progress' | 'delivered' | 'skipped' | 'cancelled' | 'failed';
export type StatusChipKind = 'status' | 'neutral';

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
  @Input() value?: DeliveryStatus;

  get normalizedLabel(): string {
    return this.label || this.value?.replace(/-/g, ' ') || '';
  }

  get tone(): string {
    const value = this.value ?? '';
    if (value === 'delivered') return 'positive';
    if (value === 'assigned' || value === 'in-progress') return 'accent';
    if (value === 'pending') return 'neutral';
    if (value === 'cancelled' || value === 'failed') return 'danger';
    if (value === 'skipped') return 'warning';
    return 'muted';
  }
}
