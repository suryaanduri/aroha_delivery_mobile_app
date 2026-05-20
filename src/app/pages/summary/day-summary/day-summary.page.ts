import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { forkJoin } from 'rxjs';
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
  calendarOutline,
  statsChartOutline,
} from 'ionicons/icons';
import { OrderService, DeliveryAnalytics, buildStaticDeliveryOrdersQuery } from 'src/app/services/order.service';
import { DeliveryOrder } from 'src/app/models/order.model';
import { getApiErrorMessage } from 'src/app/utils/api-contract.util';
import { normalizeDeliveryStatus, formatOrderItemsPreview } from 'src/app/utils/delivery-view.util';
import { formatLocalISODate, monthLabel } from 'src/app/utils/date.util';

interface MonthStats {
  label: string;
  total: number;
  delivered: number;
  cancelled: number;
  skipped: number;
  completionRate: number;
}
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
    
    CommonModule,
    RouterLink,
    PageShellComponent,
    SurfaceCardComponent,
    TopHeaderComponent,
  ],
})
export class DaySummaryPage implements OnInit {
  orders: DeliveryOrder[] = [];
  loadingOrders = true;
  ordersError = '';

  currentMonthStats: MonthStats | null = null;
  lastMonthStats: MonthStats | null = null;
  loadingMonthly = true;

  constructor(private readonly orderService: OrderService) {
    addIcons({
      arrowForwardOutline,
      calendarOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      refreshOutline,
      playSkipForwardOutline,
      statsChartOutline,
      timeOutline,
      listOutline,
      trophyOutline,
      alertCircleOutline,
    });
  }

  ngOnInit(): void {
    this.loadData();
    this.loadMonthlyStats();
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
    return this.loadingOrders;
  }

  get analytics(): DeliveryAnalytics | null {
    if (this.loadingOrders) return null;
    const delivered = this.deliveredOrders.length;
    const cancelled = this.cancelledOrders.length;
    const skipped = this.skippedOrders.length;
    const total = this.orders.length;
    const pending = Math.max(0, total - delivered - cancelled - skipped);
    const completionRate = total > 0 ? Math.round((delivered / total) * 100) : 0;
    return { date: this.todayDate, total, delivered, pending, cancelled, skipped, completionRate };
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
    this.loadingOrders = true;
    this.ordersError = '';

    this.orderService.getOrders(buildStaticDeliveryOrdersQuery(this.todayDate)).subscribe({
      next: (orders) => { this.orders = orders; this.loadingOrders = false; },
      error: (err: unknown) => { this.ordersError = getApiErrorMessage(err, 'Unable to load orders.'); this.loadingOrders = false; },
    });
  }

  loadMonthlyStats(): void {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();
    const prevYear = curMonth === 0 ? curYear - 1 : curYear;
    const prevMonth = curMonth === 0 ? 11 : curMonth - 1;

    this.loadingMonthly = true;
    forkJoin({
      current: this.orderService.getOrdersForMonth(curYear, curMonth),
      last: this.orderService.getOrdersForMonth(prevYear, prevMonth),
    }).subscribe({
      next: ({ current, last }) => {
        this.currentMonthStats = this.buildMonthStats(current, monthLabel(curYear, curMonth));
        this.lastMonthStats = this.buildMonthStats(last, monthLabel(prevYear, prevMonth));
        this.loadingMonthly = false;
      },
      error: () => { this.loadingMonthly = false; },
    });
  }

  private buildMonthStats(orders: DeliveryOrder[], label: string): MonthStats {
    const total = orders.length;
    const delivered = orders.filter((o) => normalizeDeliveryStatus(o.deliveryStatus ?? o.status) === 'delivered').length;
    const cancelled = orders.filter((o) => normalizeDeliveryStatus(o.deliveryStatus ?? o.status) === 'cancelled').length;
    const skipped = orders.filter((o) => normalizeDeliveryStatus(o.deliveryStatus ?? o.status) === 'skipped').length;
    return { label, total, delivered, cancelled, skipped, completionRate: total > 0 ? Math.round((delivered / total) * 100) : 0 };
  }

  orderItemSummary(order: DeliveryOrder): string {
    return formatOrderItemsPreview(order);
  }
}
