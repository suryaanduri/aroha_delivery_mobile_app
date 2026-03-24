import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { callOutline, locationOutline, navigateOutline } from 'ionicons/icons';

@Component({
  selector: 'app-customer-info-card',
  standalone: true,
  imports: [CommonModule, IonIcon],
  templateUrl: './customer-info-card.component.html',
  styleUrl: './customer-info-card.component.scss',
})
export class CustomerInfoCardComponent {
  @Input() name = '';
  @Input() customerCode = '';
  @Input() address = '';
  @Input() landmark = '';
  @Input() routeLabel = '';
  @Input() showPhoneAction = true;

  constructor() {
    addIcons({ callOutline, locationOutline, navigateOutline });
  }
}
