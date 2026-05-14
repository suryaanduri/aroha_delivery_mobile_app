import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonContent, IonIcon, IonRefresher, IonRefresherContent, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowForwardOutline,
  calendarOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  cubeOutline,
  locationOutline,
  mapOutline,
  playSkipForwardOutline,
  refreshOutline,
  statsChartOutline,
} from 'ionicons/icons';
import { AuthService } from 'src/app/services/auth.service';
import { OrderService, buildStaticDeliveryOrdersQuery } from 'src/app/services/order.service';
import { DeliveryOrder } from 'src/app/models/order.model';
import { getApiErrorMessage } from 'src/app/utils/api-contract.util';
import { formatLocalISODate } from 'src/app/utils/date.util';
import { formatOrderItemsPreview } from 'src/app/utils/delivery-view.util';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [IonContent, IonIcon, IonRefresher, IonRefresherContent, IonSpinner, CommonModule, RouterLink],
})
export class DashboardPage implements OnInit {
  orders: DeliveryOrder[] = [];
  loading = true;
  errorMessage = '';

  constructor(
    private readonly authService: AuthService,
    private readonly orderService: OrderService
  ) {
    addIcons({
      arrowForwardOutline,
      calendarOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      cubeOutline,
      locationOutline,
      mapOutline,
      playSkipForwardOutline,
      refreshOutline,
      statsChartOutline,
      timeOutline,
    });
  }

  ngOnInit(): void {
    this.loadOrders();
  }

  get agentName(): string {
    return this.authService.user?.name?.split(' ')[0] ?? 'Delivery Partner';
  }

  get todayLabel(): string {
    return new Date().toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
    });
  }

  get todayDate(): string {
    return formatLocalISODate();
  }

  get greeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  get totalStops(): number {
    return this.orders.length;
  }

  get completedStops(): number {
    return this.orders.filter((o) => this.isStatus(o, 'DELIVERED', 'COMPLETED')).length;
  }

  get pendingStops(): number {
    return this.orders.filter((o) => this.isPending(o)).length;
  }

  get cancelledStops(): number {
    return this.orders.filter((o) => this.isStatus(o, 'CANCELLED')).length;
  }

  get skippedStops(): number {
    return this.orders.filter((o) => this.isStatus(o, 'SKIPPED')).length;
  }

  get progressPercent(): number {
    return this.totalStops > 0 ? Math.round((this.completedStops / this.totalStops) * 100) : 0;
  }

  get nextDelivery(): DeliveryOrder | null {
    return this.orders.find((o) => this.isPending(o)) ?? null;
  }

  get shiftStatus(): string {
    if (this.totalStops === 0) return 'No orders';
    if (this.completedStops === this.totalStops) return 'Completed';
    if (this.pendingStops > 0) return 'On Track';
    return 'Route Done';
  }

  get shiftStatusClass(): string {
    if (this.totalStops === 0) return 'status--idle';
    if (this.completedStops === this.totalStops) return 'status--done';
    return 'status--active';
  }

  get nextStopItems(): string {
    const order = this.nextDelivery;
    return order ? formatOrderItemsPreview(order) : '';
  }

  handleRefresh(event: CustomEvent): void {
    this.orderService.getOrders(buildStaticDeliveryOrdersQuery(this.todayDate)).subscribe({
      next: (orders) => {
        this.orders = orders;
        this.errorMessage = '';
        (event.target as HTMLIonRefresherElement).complete();
      },
      error: (err: unknown) => {
        this.errorMessage = getApiErrorMessage(err, 'Unable to refresh.');
        (event.target as HTMLIonRefresherElement).complete();
      },
    });
  }

  loadOrders(): void {
    this.loading = true;
    this.errorMessage = '';
    this.orderService.getOrders(buildStaticDeliveryOrdersQuery(this.todayDate)).subscribe({
      next: (orders) => {
        this.orders = orders;
        this.loading = false;
      },
      error: (err: unknown) => {
        this.errorMessage = getApiErrorMessage(err, 'Unable to load deliveries. Pull down to retry.');
        this.loading = false;
      },
    });
  }

  private isStatus(order: DeliveryOrder, ...statuses: string[]): boolean {
    const s = (order.deliveryStatus ?? order.status ?? '').toUpperCase();
    return statuses.includes(s);
  }

  private isPending(order: DeliveryOrder): boolean {
    const s = (order.deliveryStatus ?? order.status ?? '').toUpperCase();
    return ['PENDING', 'ASSIGNED', 'OUT_FOR_DELIVERY', ''].includes(s);
  }
}
