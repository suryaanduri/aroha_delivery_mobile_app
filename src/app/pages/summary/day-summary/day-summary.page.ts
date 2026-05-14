import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowForwardOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  refreshOutline,
  playSkipForwardOutline,
  timeOutline,
  listOutline,
  trophyOutline,
  alertCircleOutline,
} from 'ionicons/icons';
import { OrderService, DeliveryAnalytics, buildStaticDeliveryOrdersQuery } from 'src/app/services/order.service';
import { DeliveryOrder } from 'src/app/models/order.model';
import { getApiErrorMessage } from 'src/app/utils/api-contract.util';
import { normalizeDeliveryStatus, formatOrderItemsPreview } from 'src/app/utils/delivery-view.util';
import { formatLocalISODate } from 'src/app/utils/date.util';
import { PageShellComponent } from 'src/app/components/page-shell/page-shell.component';
import { SurfaceCardComponent } from 'src/app/components/surface-card/surface-card.component';
import { TopHeaderComponent } from 'src/app/components/top-header/top-header.component';

@Component({
  selector: 'app-day-summary',
  templateUrl: './day-summary.page.html',
  styleUrls: ['./day-summary.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonIcon,
    IonSpinner,
    CommonModule,
    RouterLink,
    PageShellComponent,
    SurfaceCardComponent,
    TopHeaderComponent,
  ],
})
export class DaySummaryPage implements OnInit {
  analytics: DeliveryAnalytics | null = null;
  orders: DeliveryOrder[] = [];
  loadingAnalytics = true;
  loadingOrders = true;
  analyticsError = '';
  ordersError = '';

  constructor(private readonly orderService: OrderService) {
    addIcons({
      arrowForwardOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      refreshOutline,
      playSkipForwardOutline,
      timeOutline,
      listOutline,
      trophyOutline,
      alertCircleOutline,
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  get todayLabel(): string {
    return new Date().toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  get todayDate(): string {
    return formatLocalISODate();
  }

  get loading(): boolean {
    return this.loadingAnalytics || this.loadingOrders;
  }

  get deliveredOrders(): DeliveryOrder[] {
    return this.orders.filter((o) => normalizeDeliveryStatus(o.deliveryStatus ?? o.status) === 'delivered');
  }

  get cancelledOrders(): DeliveryOrder[] {
    return this.orders.filter((o) => normalizeDeliveryStatus(o.deliveryStatus ?? o.status) === 'cancelled');
  }

  get skippedOrders(): DeliveryOrder[] {
    return this.orders.filter((o) => normalizeDeliveryStatus(o.deliveryStatus ?? o.status) === 'skipped');
  }

  get performanceLabel(): string {
    const rate = this.analytics?.completionRate ?? 0;
    if (rate === 100) return 'Perfect route!';
    if (rate >= 80) return 'Great progress';
    if (rate >= 50) return 'Halfway there';
    return 'Keep going';
  }

  loadData(): void {
    this.loadingAnalytics = true;
    this.loadingOrders = true;
    this.analyticsError = '';
    this.ordersError = '';

    this.orderService.getMyAnalytics(this.todayDate).subscribe({
      next: (data) => { this.analytics = data; this.loadingAnalytics = false; },
      error: (err: unknown) => { this.analyticsError = getApiErrorMessage(err, 'Unable to load analytics.'); this.loadingAnalytics = false; },
    });

    this.orderService.getOrders(buildStaticDeliveryOrdersQuery(this.todayDate)).subscribe({
      next: (orders) => { this.orders = orders; this.loadingOrders = false; },
      error: (err: unknown) => { this.ordersError = getApiErrorMessage(err, 'Unable to load orders.'); this.loadingOrders = false; },
    });
  }

  orderItemSummary(order: DeliveryOrder): string {
    return formatOrderItemsPreview(order);
  }
}
