import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { IonButton, IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  arrowBackOutline,
  cameraOutline,
  checkmarkCircleOutline,
  chatbubbleEllipsesOutline,
  timeOutline,
} from 'ionicons/icons';
import { CustomerInfoCardComponent } from 'src/app/components/customer-info-card/customer-info-card.component';
import { DeliveryProductItem, ProductListComponent } from 'src/app/components/product-list/product-list.component';
import { ActionBarComponent } from 'src/app/components/action-bar/action-bar.component';
import { PageShellComponent } from 'src/app/components/page-shell/page-shell.component';
import { SectionHeaderComponent } from 'src/app/components/section-header/section-header.component';
import { DeliveryStatus, ScheduleType, StatusChipComponent } from 'src/app/components/status-chip/status-chip.component';
import { SurfaceCardComponent } from 'src/app/components/surface-card/surface-card.component';
import { TopHeaderComponent } from 'src/app/components/top-header/top-header.component';
import { DeliveryOrder } from 'src/app/models/order.model';
import { getMockDeliveryOrderById } from 'src/app/mocks/delivery.mock';
import { OrderService } from 'src/app/services/order.service';
import { getApiErrorMessage } from 'src/app/utils/api-contract.util';
import {
  formatDeliveryStatusLabel,
  mapOrderItems,
  normalizeDeliveryStatus,
  normalizeScheduleType,
} from 'src/app/utils/delivery-view.util';

@Component({
  selector: 'app-delivery-detail',
  templateUrl: './delivery-detail.page.html',
  styleUrls: ['./delivery-detail.page.scss'],
  standalone: true,
  imports: [
    IonButton,
    IonContent,
    IonIcon,
    IonSpinner,
    CommonModule,
    ActionBarComponent,
    CustomerInfoCardComponent,
    PageShellComponent,
    ProductListComponent,
    SectionHeaderComponent,
    StatusChipComponent,
    SurfaceCardComponent,
    TopHeaderComponent,
  ],
})
export class DeliveryDetailPage implements OnInit {
  readonly stopId: string;
  loading = true;
  errorMessage = '';

  customerName = '';
  customerCode = '';
  address = '';
  landmark = '';
  routeLabel = '';
  scheduleType: ScheduleType = 'daily';
  status: DeliveryStatus = 'pending';
  timeSlot = '';
  sequenceLabel = '';
  deliveryStatusLabel = '';
  orderStatusLabel = '';
  deliveryNotes: string[] = [];
  readonly proofOptions = [
    { label: 'Photo Capture', helper: 'Record doorstep placement', icon: 'camera-outline' },
    { label: 'Delivery Note', helper: 'Add delivery remarks', icon: 'chatbubble-ellipses-outline' },
  ];
  items: DeliveryProductItem[] = [];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly orderService: OrderService
  ) {
    this.stopId = this.route.snapshot.paramMap.get('id') ?? '';
    addIcons({
      alertCircleOutline,
      arrowBackOutline,
      cameraOutline,
      checkmarkCircleOutline,
      chatbubbleEllipsesOutline,
      timeOutline,
    });
  }

  ngOnInit(): void {
    this.loadOrder();
  }

  get productSummary(): string {
    return `${this.items.length} product${this.items.length !== 1 ? 's' : ''}`;
  }

  goToComplete(action: 'DELIVERED' | 'CANCELLED' | 'SKIPPED' = 'DELIVERED'): void {
    void this.router.navigate(['/delivery', this.stopId, 'complete'], {
      queryParams: { action },
    });
  }

  private loadOrder(): void {
    this.loading = true;
    this.errorMessage = '';

    this.orderService.getOrderById(this.stopId).subscribe({
      next: (order) => {
        const resolvedOrder = order ?? getMockDeliveryOrderById(this.stopId);
        if (!resolvedOrder) {
          this.errorMessage = 'Delivery not found.';
          this.loading = false;
          return;
        }

        this.applyOrder(resolvedOrder);
        this.loading = false;
      },
      error: (err: unknown) => {
        const fallbackOrder = getMockDeliveryOrderById(this.stopId);
        if (fallbackOrder) {
          this.applyOrder(fallbackOrder);
          this.errorMessage = '';
          this.loading = false;
          return;
        }

        this.errorMessage = getApiErrorMessage(err, 'Unable to load delivery details.');
        this.loading = false;
      },
    });
  }

  private applyOrder(order: DeliveryOrder): void {
    const sequence = order.sequence ?? 0;
    const deliveryStatusValue = order.deliveryStatus ?? order.status ?? 'PENDING';

    this.customerName = order.customerName ?? 'Customer';
    this.customerCode = order.customerCode ?? '';
    this.address = order.address ?? '';
    this.landmark = order.landmark ?? '';
    this.routeLabel = order.routeLabel ?? `Stop ${String(sequence).padStart(2, '0')}`;
    this.scheduleType = normalizeScheduleType(order.scheduleType);
    this.status = normalizeDeliveryStatus(deliveryStatusValue);
    this.deliveryStatusLabel = formatDeliveryStatusLabel(deliveryStatusValue);
    this.orderStatusLabel = formatDeliveryStatusLabel(order.orderStatus);
    this.timeSlot = order.timeSlot ?? '';
    this.sequenceLabel = sequence ? `#${String(sequence).padStart(2, '0')}` : '';
    this.items = mapOrderItems(order);
    this.deliveryNotes = order.notes ? [order.notes] : [];
  }
}
