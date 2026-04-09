import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowForwardOutline, cubeOutline, locationOutline, navigateOutline, timeOutline } from 'ionicons/icons';
import { DeliveryProductItem } from '../product-list/product-list.component';
import { DeliveryStatus, ScheduleType, StatusChipComponent } from '../status-chip/status-chip.component';

@Component({
  selector: 'app-delivery-card',
  standalone: true,
  imports: [
    CommonModule,
    IonButton,
    IonIcon,
    StatusChipComponent,
  ],
  templateUrl: './delivery-card.component.html',
  styleUrl: './delivery-card.component.scss',
})
export class DeliveryCardComponent {
  @Input() priority = false;
  @Input() customerName = '';
  @Input() customerCode = '';
  @Input() address = '';
  @Input() landmark = '';
  @Input() routeLabel = '';
  @Input() scheduleType: ScheduleType = 'daily';
  @Input() status: DeliveryStatus = 'pending';
  @Input() deliveryStatusLabel = '';
  @Input() orderStatusLabel = '';
  @Input() productSummary = '';
  @Input() timeSlot = '';
  @Input() sequenceLabel = '';
  @Input() actionText = 'Open Stop';
  @Input() items: DeliveryProductItem[] = [];
  @Output() cardPressed = new EventEmitter<void>();
  @Output() actionPressed = new EventEmitter<void>();

  constructor() {
    addIcons({ arrowForwardOutline, cubeOutline, locationOutline, navigateOutline, timeOutline });
  }
}
