import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
import { SectionHeaderComponent } from 'src/app/components/section-header/section-header.component';
import { DeliveryStatus, ScheduleType, StatusChipComponent } from 'src/app/components/status-chip/status-chip.component';
import { DeliveryOrder } from 'src/app/models/order.model';
import { OrderService } from 'src/app/services/order.service';
import { getApiErrorMessage } from 'src/app/utils/api-contract.util';

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
    RouterLink,
    CustomerInfoCardComponent,
    ProductListComponent,
    SectionHeaderComponent,
    StatusChipComponent,
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
        const resolvedOrder = order ?? this.getStaticOrder(this.stopId);
        if (!resolvedOrder) {
          this.errorMessage = 'Delivery not found.';
          this.loading = false;
          return;
        }

        this.applyOrder(resolvedOrder);
        this.loading = false;
      },
      error: (err: unknown) => {
        const fallbackOrder = this.getStaticOrder(this.stopId);
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

  private getStaticOrder(orderId: string): DeliveryOrder | null {
    const staticOrders: DeliveryOrder[] = [
      {
        id: 'demo-stop-1',
        customerName: 'Green Valley Residency',
        customerCode: 'AF-1042',
        address: '12 Lake View Road, Coimbatore',
        landmark: 'Near East Gate',
        routeLabel: 'Morning Route',
        scheduleType: 'daily',
        status: 'PENDING',
        deliveryStatus: 'PENDING',
        orderStatus: 'CONFIRMED',
        deliveryDate: new Date().toISOString().slice(0, 10),
        timeSlot: '06:30 AM - 07:00 AM',
        sequence: 1,
        notes: 'Leave the bottles in the insulated crate near the security desk.',
        items: [
          { name: 'A2 Cow Milk', quantity: '2', unit: 'L' },
          { name: 'Fresh Curd', quantity: '1', unit: 'Tub' },
          { name: 'Paneer', quantity: '250', unit: 'g' },
        ],
      },
      {
        id: 'demo-stop-2',
        customerName: 'Maya Narayanan',
        customerCode: 'AF-2187',
        address: '44 Park Avenue, RS Puram',
        landmark: 'Opp. Bakery Corner',
        routeLabel: 'Morning Route',
        scheduleType: 'alternate_day',
        status: 'IN_PROGRESS',
        deliveryStatus: 'IN_PROGRESS',
        orderStatus: 'PACKED',
        deliveryDate: new Date().toISOString().slice(0, 10),
        timeSlot: '07:00 AM - 07:30 AM',
        sequence: 2,
        notes: 'Customer prefers a quick handoff at the gate before 7:20 AM.',
        items: [
          { name: 'Buffalo Milk', quantity: '1', unit: 'L' },
          { name: 'Ghee', quantity: '500', unit: 'ml' },
        ],
      },
      {
        id: 'demo-stop-3',
        customerName: 'Apex Fitness Studio',
        customerCode: 'AF-3321',
        address: '9 Cross Cut Road, Gandhipuram',
        landmark: 'Behind City Pharmacy',
        routeLabel: 'Central Route',
        scheduleType: 'daily',
        status: 'PENDING',
        deliveryStatus: 'PENDING',
        orderStatus: 'CONFIRMED',
        deliveryDate: new Date().toISOString().slice(0, 10),
        timeSlot: '07:30 AM - 08:00 AM',
        sequence: 3,
        notes: 'Drop at reception and ask for the morning shift manager.',
        items: [
          { name: 'Skim Milk', quantity: '4', unit: 'L' },
          { name: 'Greek Yogurt', quantity: '6', unit: 'Cups' },
          { name: 'Butter', quantity: '2', unit: 'Packs' },
          { name: 'Paneer', quantity: '500', unit: 'g' },
        ],
      },
      {
        id: 'demo-stop-4',
        customerName: 'Latha Traders',
        customerCode: 'AF-4176',
        address: '88 Mettupalayam Road, Sai Baba Colony',
        landmark: 'Next to Petrol Bunk',
        routeLabel: 'Central Route',
        scheduleType: 'one_time',
        status: 'DELIVERED',
        deliveryStatus: 'DELIVERED',
        orderStatus: 'COMPLETED',
        deliveryDate: new Date().toISOString().slice(0, 10),
        timeSlot: '08:00 AM - 08:20 AM',
        sequence: 4,
        notes: 'Delivered successfully to the store manager.',
        items: [
          { name: 'Full Cream Milk', quantity: '3', unit: 'L' },
          { name: 'Fresh Curd', quantity: '2', unit: 'Tubs' },
        ],
      },
    ];

    return staticOrders.find((order) => order.id === orderId) ?? null;
  }

  private applyOrder(order: DeliveryOrder): void {
    const sequence = order.sequence ?? 0;
    const deliveryStatusValue = order.deliveryStatus ?? order.status ?? 'PENDING';

    this.customerName = order.customerName ?? 'Customer';
    this.customerCode = order.customerCode ?? '';
    this.address = order.address ?? '';
    this.landmark = order.landmark ?? '';
    this.routeLabel = order.routeLabel ?? `Stop ${String(sequence).padStart(2, '0')}`;
    this.scheduleType = this.normalizeScheduleType(order.scheduleType);
    this.status = this.normalizeStatus(deliveryStatusValue);
    this.deliveryStatusLabel = this.formatStatusLabel(deliveryStatusValue);
    this.orderStatusLabel = this.formatStatusLabel(order.orderStatus);
    this.timeSlot = order.timeSlot ?? '';
    this.sequenceLabel = sequence ? `#${String(sequence).padStart(2, '0')}` : '';
    this.items = (order.items ?? []).map((item) => ({
      name: item.name ?? 'Item',
      quantity: [item.quantity, item.unit].filter(Boolean).join(' '),
    }));
    this.deliveryNotes = order.notes ? [order.notes] : [];
  }

  private normalizeStatus(status?: string): DeliveryStatus {
    const normalized = (status ?? '').toUpperCase();
    if (normalized === 'DELIVERED' || normalized === 'COMPLETED') return 'delivered';
    if (normalized === 'IN_PROGRESS' || normalized === 'IN-PROGRESS' || normalized === 'STARTED') return 'in-progress';
    if (normalized === 'CANCELLED' || normalized === 'CANCELED' || normalized === 'FAILED') return 'failed';
    if (normalized === 'SKIPPED') return 'skipped';
    return 'pending';
  }

  private normalizeScheduleType(type?: string): ScheduleType {
    if (!type) return 'daily';
    const normalized = type.toLowerCase().replace(/_/g, '-');
    if (normalized.includes('alternate')) return 'alternate-day';
    if (normalized === 'onetime' || (normalized.includes('one') && normalized.includes('time'))) return 'one-time';
    return 'daily';
  }

  private formatStatusLabel(status?: string): string {
    if (!status || !status.trim()) return 'N/A';
    return status
      .toLowerCase()
      .replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }
}
