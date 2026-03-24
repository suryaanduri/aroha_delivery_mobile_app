import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { alertCircleOutline, fileTrayOutline, searchOutline } from 'ionicons/icons';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, IonButton, IonIcon],
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss',
})
export class EmptyStateComponent {
  @Input() icon = 'file-tray-outline';
  @Input() title = 'Nothing to show';
  @Input() message = '';
  @Input() actionText = '';
  @Output() actionPressed = new EventEmitter<void>();

  constructor() {
    addIcons({ alertCircleOutline, fileTrayOutline, searchOutline });
  }
}
