import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-surface-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './surface-card.component.html',
  styleUrl: './surface-card.component.scss',
})
export class SurfaceCardComponent {
  @Input() tone: 'default' | 'muted' | 'success' | 'warning' | 'danger' = 'default';
  @Input() compact = false;
}
