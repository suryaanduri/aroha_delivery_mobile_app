import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonButton, IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  closeCircleOutline,
  funnelOutline,
  locationOutline,
  refreshOutline,
  searchOutline,
} from 'ionicons/icons';
import { DeliveryCardComponent } from 'src/app/components/delivery-card/delivery-card.component';
import { EmptyStateComponent } from 'src/app/components/empty-state/empty-state.component';
import { SectionHeaderComponent } from 'src/app/components/section-header/section-header.component';
import { DeliveryProductItem } from 'src/app/components/product-list/product-list.component';
import { DeliveryStatus, ScheduleType } from 'src/app/components/status-chip/status-chip.component';
import { OrderService } from 'src/app/services/order.service';
import { DeliveryOrder } from 'src/app/models/order.model';
import { getApiErrorMessage } from 'src/app/utils/api-contract.util';

type FilterKey = 'all' | 'pending' | 'delivered';

interface DeliveryStop {
  id: string;
  customerName: string;
  customerCode: string;
  address: string;
  landmark: string;
  routeLabel: string;
  scheduleType: ScheduleType;
  status: DeliveryStatus;
  deliveryStatusLabel: string;
  orderStatusLabel: string;
  productSummary: string;
  timeSlot: string;
  sequenceLabel: string;
  items: DeliveryProductItem[];
}

@Component({
  selector: 'app-delivery-list',
  templateUrl: './delivery-list.page.html',
  styleUrls: ['./delivery-list.page.scss'],
  standalone: true,
  imports: [
    IonButton,
    IonContent,
    IonIcon,
    IonSpinner,
    CommonModule,
    FormsModule,
    RouterLink,
    DeliveryCardComponent,
    EmptyStateComponent,
    SectionHeaderComponent,
  ],
})
export class DeliveryListPage implements OnInit {
  searchTerm = '';
  selectedFilter: FilterKey = 'all';
  deliveries: DeliveryStop[] = [];
  loading = true;
  errorMessage = '';

  readonly filterOptions: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'delivered', label: 'Delivered' },
  ];

  constructor(
    private readonly router: Router,
    private readonly orderService: OrderService
  ) {
    addIcons({
      arrowBackOutline,
      closeCircleOutline,
      funnelOutline,
      locationOutline,
      refreshOutline,
      searchOutline,
    });
  }

  ngOnInit(): void {
    this.loadOrders();
  }

  get todayLabel(): string {
    return new Date().toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  }

  private get todayDate(): string {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  get filteredDeliveries(): DeliveryStop[] {
    const query = this.searchTerm.trim().toLowerCase();

    return this.deliveries.filter((stop) => {
      const matchesSearch =
        !query ||
        [stop.customerName, stop.customerCode, stop.address, stop.landmark]
          .join(' ')
          .toLowerCase()
          .includes(query);

      const matchesFilter =
        this.selectedFilter === 'all' ||
        (this.selectedFilter === 'pending' && stop.status !== 'delivered') ||
        (this.selectedFilter === 'delivered' && stop.status === 'delivered');

      return matchesSearch && matchesFilter;
    });
  }

  get activeStops(): DeliveryStop[] {
    return this.filteredDeliveries.filter((stop) => stop.status !== 'delivered');
  }

  get nextStop(): DeliveryStop | null {
    return this.activeStops[0] ?? null;
  }

  get remainingActiveStops(): DeliveryStop[] {
    return this.activeStops.slice(1);
  }

  get completedStops(): DeliveryStop[] {
    return this.filteredDeliveries.filter((stop) => stop.status === 'delivered');
  }

  get totalStops(): number {
    return this.deliveries.length;
  }

  get pendingCount(): number {
    return this.deliveries.filter((stop) => stop.status !== 'delivered').length;
  }

  get completedCount(): number {
    return this.deliveries.filter((stop) => stop.status === 'delivered').length;
  }

  get activeFilterCount(): number {
    return Number(this.selectedFilter !== 'all') + Number(this.searchTerm.trim().length > 0);
  }

  selectFilter(filter: FilterKey): void {
    this.selectedFilter = filter;
  }

  clearSearch(): void {
    this.searchTerm = '';
  }

  openDelivery(stopId: string): void {
    void this.router.navigate(['/delivery', stopId]);
  }

  loadOrders(): void {
    this.loading = true;
    this.errorMessage = '';
    this.orderService.getOrders({ deliveryDate: this.todayDate }).subscribe({
      next: (orders) => {
        this.deliveries = orders.map((order, idx) => this.mapOrderToStop(order, idx));
        this.loading = false;
      },
      error: (err: unknown) => {
        this.errorMessage = getApiErrorMessage(err, 'Unable to load deliveries. Tap retry to try again.');
        this.loading = false;
      },
    });
  }

  private mapOrderToStop(order: DeliveryOrder, index: number): DeliveryStop {
    const items: DeliveryProductItem[] = (order.items ?? []).map((item) => ({
      name: item.name ?? 'Item',
      quantity: [item.quantity, item.unit].filter(Boolean).join(' '),
    }));

    const seq = order.sequence ?? index + 1;
    const deliveryStatusValue = order.deliveryStatus ?? order.status ?? '';

    return {
      id: order.id ?? order.orderId ?? String(index),
      customerName: order.customerName ?? '',
      customerCode: order.customerCode ?? '',
      address: order.address ?? '',
      landmark: order.landmark ?? '',
      routeLabel: order.routeLabel ?? `Stop ${String(seq).padStart(2, '0')}`,
      scheduleType: this.normalizeScheduleType(order.scheduleType),
      status: this.normalizeStatus(deliveryStatusValue),
      deliveryStatusLabel: this.formatStatusLabel(deliveryStatusValue),
      orderStatusLabel: this.formatStatusLabel(order.orderStatus),
      productSummary: `${items.length} product${items.length !== 1 ? 's' : ''}`,
      timeSlot: order.timeSlot ?? '',
      sequenceLabel: `#${String(seq).padStart(2, '0')}`,
      items,
    };
  }

  private normalizeStatus(status?: string): DeliveryStatus {
    if (!status) return 'pending';
    const s = status.toUpperCase();
    if (s === 'DELIVERED' || s === 'COMPLETED') return 'delivered';
    if (s === 'IN_PROGRESS' || s === 'IN-PROGRESS' || s === 'STARTED') return 'in-progress';
    if (s === 'FAILED' || s === 'CANCELLED' || s === 'CANCELED') return 'failed';
    if (s === 'SKIPPED') return 'skipped';
    return 'pending';
  }

  private formatStatusLabel(status?: string): string {
    if (!status || !status.trim()) return 'N/A';
    return status
      .toLowerCase()
      .replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  private normalizeScheduleType(type?: string): ScheduleType {
    if (!type) return 'daily';
    const t = type.toLowerCase().replace(/_/g, '-');
    if (t.includes('alternate')) return 'alternate-day';
    if (t.includes('one') && t.includes('time')) return 'one-time';
    if (t === 'onetime') return 'one-time';
    return 'daily';
  }
}
