import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowForwardOutline, cubeOutline, locationOutline, navigateOutline, timeOutline } from 'ionicons/icons';
import { DeliveryProductItem } from '../product-list/product-list.component';
import { DeliveryStatus, ScheduleType, StatusChipComponent } from '../status-chip/status-chip.component';
import { DeliveryStopViewModel } from 'src/app/utils/delivery-view.util';

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
  @Input() stop?: DeliveryStopViewModel;
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
  @Input() actionable = true;
  @Input() items: DeliveryProductItem[] = [];
  @Output() cardPressed = new EventEmitter<void>();
  @Output() actionPressed = new EventEmitter<void>();

  constructor() {
    addIcons({ arrowForwardOutline, cubeOutline, locationOutline, navigateOutline, timeOutline });
  }

  get viewModel(): DeliveryStopViewModel {
    return {
      id: this.stop?.id ?? '',
      customerName: this.stop?.customerName ?? this.customerName,
      customerCode: this.stop?.customerCode ?? this.customerCode,
      address: this.stop?.address ?? this.address,
      landmark: this.stop?.landmark ?? this.landmark,
      routeLabel: this.stop?.routeLabel ?? this.routeLabel,
      scheduleType: this.stop?.scheduleType ?? this.scheduleType,
      status: this.stop?.status ?? this.status,
      deliveryStatusLabel: this.stop?.deliveryStatusLabel ?? this.deliveryStatusLabel,
      orderStatusLabel: this.stop?.orderStatusLabel ?? this.orderStatusLabel,
      productSummary: this.stop?.productSummary ?? this.productSummary,
      timeSlot: this.stop?.timeSlot ?? this.timeSlot,
      sequenceLabel: this.stop?.sequenceLabel ?? this.sequenceLabel,
      items: this.stop?.items ?? this.items,
    };
  }

  onCardPressed(): void {
    if (this.actionable) {
      this.cardPressed.emit();
    }
  }

  onActionPressed(): void {
    if (this.actionable) {
      this.actionPressed.emit();
    }
  }
}
