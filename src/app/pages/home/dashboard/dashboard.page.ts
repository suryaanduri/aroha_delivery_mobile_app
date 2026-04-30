import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowForwardOutline,
  calendarOutline,
  checkmarkCircleOutline,
  cubeOutline,
  locationOutline,
  mapOutline,
  navigateOutline,
  timeOutline,
  refreshOutline,
  statsChartOutline,
} from 'ionicons/icons';
import { AuthService } from 'src/app/services/auth.service';
import { OrderService } from 'src/app/services/order.service';
import { DeliveryOrder } from 'src/app/models/order.model';
import { getApiErrorMessage } from 'src/app/utils/api-contract.util';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [IonContent, IonIcon, IonSpinner, CommonModule, RouterLink],
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
      cubeOutline,
      locationOutline,
      mapOutline,
      navigateOutline,
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
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  }

  get todayDate(): string {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
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
    return this.orders.filter((o) => this.isDelivered(o)).length;
  }

  get pendingStops(): number {
    return this.totalStops - this.completedStops;
  }

  get progressPercent(): number {
    return this.totalStops > 0 ? Math.round((this.completedStops / this.totalStops) * 100) : 0;
  }

  get totalProducts(): number {
    let count = 0;
    for (const order of this.orders) {
      count += order.items?.length ?? 0;
    }
    return count;
  }

  get nextDelivery(): DeliveryOrder | null {
    return this.orders.find((o) => !this.isDelivered(o)) ?? null;
  }

  get nextDeliverySummary(): string {
    const order = this.nextDelivery;
    if (!order) return 'No active stop';
    if (order.productSummary) return order.productSummary;
    if (!order.items?.length) return 'No items listed';
    return order.items.slice(0, 2).map((i) => `${i.quantity} ${i.name}`).join(', ');
  }

  get nextDeliveryArea(): string {
    const order = this.nextDelivery;
    return order?.area || order?.landmark || order?.address || 'Route queue';
  }

  get nextDeliverySequence(): string {
    const sequence = this.nextDelivery?.sequence ?? this.completedStops + 1;
    return String(sequence).padStart(2, '0');
  }

  get timeSlotLabel(): string {
    return this.nextDelivery?.timeSlot || 'Today';
  }

  get shiftStatus(): string {
    if (this.totalStops === 0) return 'No orders';
    if (this.completedStops === this.totalStops) return 'Completed';
    return 'On Track';
  }

  loadOrders(): void {
    this.loading = true;
    this.errorMessage = '';
    this.orderService.getOrders({ deliveryDate: this.todayDate }).subscribe({
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

  private isDelivered(order: DeliveryOrder): boolean {
    const s = (order.deliveryStatus ?? order.status)?.toUpperCase();
    return s === 'DELIVERED' || s === 'COMPLETED';
  }
}
