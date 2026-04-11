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
import { PageShellComponent } from 'src/app/components/page-shell/page-shell.component';
import { SectionHeaderComponent } from 'src/app/components/section-header/section-header.component';
import { SurfaceCardComponent } from 'src/app/components/surface-card/surface-card.component';
import { TopHeaderComponent } from 'src/app/components/top-header/top-header.component';
import { OrderService } from 'src/app/services/order.service';
import { getMockDeliveryOrders } from 'src/app/mocks/delivery.mock';
import { DeliveryStopViewModel, mapOrderToDeliveryStopViewModel } from 'src/app/utils/delivery-view.util';

type FilterKey = 'all' | 'pending' | 'delivered';

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
    PageShellComponent,
    SectionHeaderComponent,
    SurfaceCardComponent,
    TopHeaderComponent,
  ],
})
export class DeliveryListPage implements OnInit {
  searchTerm = '';
  selectedFilter: FilterKey = 'all';
  deliveries: DeliveryStopViewModel[] = [];
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

  get filteredDeliveries(): DeliveryStopViewModel[] {
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

  get activeStops(): DeliveryStopViewModel[] {
    return this.filteredDeliveries.filter((stop) => stop.status !== 'delivered');
  }

  get nextStop(): DeliveryStopViewModel | null {
    return this.activeStops[0] ?? null;
  }

  get remainingActiveStops(): DeliveryStopViewModel[] {
    return this.activeStops.slice(1);
  }

  get completedStops(): DeliveryStopViewModel[] {
    return this.filteredDeliveries.filter((stop) => stop.status === 'delivered');
  }

  get totalStops(): number {
    return this.deliveries.length;
  }

  get pageTitle(): string {
    return `Today's Deliveries (${this.totalStops})`;
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
        const sourceOrders = orders.length ? orders : getMockDeliveryOrders();
        this.deliveries = sourceOrders.map((order, idx) => mapOrderToDeliveryStopViewModel(order, idx));
        this.loading = false;
      },
      error: () => {
        this.deliveries = getMockDeliveryOrders().map((order, idx) => mapOrderToDeliveryStopViewModel(order, idx));
        this.loading = false;
      },
    });
  }
}
