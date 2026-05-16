import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavController } from '@ionic/angular';
import { IonButton, IonContent, IonIcon, IonRefresher, IonRefresherContent, IonSpinner } from '@ionic/angular/standalone';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  flashOutline,
  funnelOutline,
  locationOutline,
  refreshOutline,
  searchOutline,
  wifiOutline,
} from 'ionicons/icons';
import { DeliveryCardComponent } from 'src/app/components/delivery-card/delivery-card.component';
import { EmptyStateComponent } from 'src/app/components/empty-state/empty-state.component';
import { PageShellComponent } from 'src/app/components/page-shell/page-shell.component';
import { SectionHeaderComponent } from 'src/app/components/section-header/section-header.component';
import { SurfaceCardComponent } from 'src/app/components/surface-card/surface-card.component';
import { TopHeaderComponent } from 'src/app/components/top-header/top-header.component';
import { DeliveryOrder } from 'src/app/models/order.model';
import { OrderService, buildStaticDeliveryOrdersQuery } from 'src/app/services/order.service';
import { getApiErrorMessage } from 'src/app/utils/api-contract.util';
import { formatLocalISODate } from 'src/app/utils/date.util';
import { DeliveryStopViewModel, mapOrderToDeliveryStopViewModel } from 'src/app/utils/delivery-view.util';
import { calculateRouteDistance, enrichStopsWithETA, estimateRouteEtaMinutes, formatDistance, formatEta, getDriverLocation, optimizeStopsFromLocation } from 'src/app/utils/route-calc.util';
import { CHANDANAGAR_CENTER, LatLngLiteral } from 'src/app/utils/mock-coordinates.util';

type FilterKey = 'all' | 'assigned' | 'delivered' | 'cancelled' | 'skipped';

@Component({
  selector: 'app-delivery-list',
  templateUrl: './delivery-list.page.html',
  styleUrls: ['./delivery-list.page.scss'],
  standalone: true,
  imports: [
    IonButton,
    IonContent,
    IonIcon,
    IonRefresher,
    IonRefresherContent,
    IonSpinner,
    CommonModule,
    FormsModule,
    DeliveryCardComponent,
    EmptyStateComponent,
    PageShellComponent,
    SectionHeaderComponent,
    SurfaceCardComponent,
    TopHeaderComponent,
  ],
})
export class DeliveryListPage implements OnInit, OnDestroy {
  searchTerm = '';
  selectedFilter: FilterKey = 'all';
  deliveries: DeliveryStopViewModel[] = [];
  loading = true;
  errorMessage = '';
  routeOptimized = false;
  routeDistanceLabel = '';
  routeEtaLabel = '';
  isOffline = false;
  usingCachedData = false;
  cachedAtLabel = '';

  private driverLocation: LatLngLiteral = CHANDANAGAR_CENTER;
  private onlineListener = () => { this.isOffline = false; };
  private offlineListener = () => { this.isOffline = true; };

  readonly filterOptions: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'assigned', label: 'Assigned' },
    { key: 'delivered', label: 'Delivered' },
    { key: 'cancelled', label: 'Cancelled' },
    { key: 'skipped', label: 'Skipped' },
  ];

  constructor(
    private readonly navCtrl: NavController,
    private readonly orderService: OrderService
  ) {
    addIcons({
      arrowBackOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      flashOutline,
      funnelOutline,
      locationOutline,
      refreshOutline,
      searchOutline,
      wifiOutline,
    });
  }

  ngOnInit(): void {
    this.isOffline = !navigator.onLine;
    window.addEventListener('online', this.onlineListener);
    window.addEventListener('offline', this.offlineListener);
  }

  ngOnDestroy(): void {
    window.removeEventListener('online', this.onlineListener);
    window.removeEventListener('offline', this.offlineListener);
  }

  ionViewDidEnter(): void {
    this.loadOrders();
  }

  get allDone(): boolean {
    return !this.loading && this.totalStops > 0 && this.pendingCount === 0;
  }

  get todayLabel(): string {
    return new Date().toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  }

  private get todayDate(): string {
    return formatLocalISODate();
  }

  get filteredDeliveries(): DeliveryStopViewModel[] {
    const query = this.searchTerm.trim().toLowerCase();

    return this.deliveries
      .filter((stop) => {
        const matchesSearch =
          !query ||
          [stop.customerName, stop.customerCode, stop.address, stop.landmark]
            .join(' ')
            .toLowerCase()
            .includes(query);

        const matchesFilter =
          this.selectedFilter === 'all' ||
          (this.selectedFilter === 'assigned' &&
            (stop.status === 'assigned' || stop.status === 'pending' || stop.status === 'in-progress')) ||
          (this.selectedFilter === 'delivered' && stop.status === 'delivered') ||
          (this.selectedFilter === 'cancelled' && stop.status === 'cancelled') ||
          (this.selectedFilter === 'skipped' && stop.status === 'skipped');

        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => a.routeOrder - b.routeOrder); // always respect optimized order
  }

  get activeStops(): DeliveryStopViewModel[] {
    return this.filteredDeliveries.filter(
      (stop) =>
        stop.status === 'assigned' || stop.status === 'pending' || stop.status === 'in-progress'
    );
  }

  get nextStop(): DeliveryStopViewModel | null {
    return this.activeStops[0] ?? null;
  }

  get remainingActiveStops(): DeliveryStopViewModel[] {
    return this.activeStops.slice(1);
  }

  get deliveredStops(): DeliveryStopViewModel[] {
    return this.filteredDeliveries.filter((stop) => stop.status === 'delivered');
  }

  /** All resolved stops (for the count badge — not search-filtered, intentional). */
  get resolvedCount(): number {
    return this.deliveries.filter(
      (stop) =>
        stop.status === 'delivered' ||
        stop.status === 'cancelled' ||
        stop.status === 'skipped' ||
        stop.status === 'failed'
    ).length;
  }

  isAssignedStop(stop: DeliveryStopViewModel): boolean {
    return stop.status === 'assigned' || stop.status === 'pending' || stop.status === 'in-progress';
  }

  get completedStops(): DeliveryStopViewModel[] {
    return this.filteredDeliveries.filter((stop) => stop.status === 'delivered');
  }

  get cancelledStops(): DeliveryStopViewModel[] {
    return this.filteredDeliveries.filter((stop) => stop.status === 'cancelled');
  }

  get skippedStops(): DeliveryStopViewModel[] {
    return this.filteredDeliveries.filter((stop) => stop.status === 'skipped');
  }

  get totalStops(): number {
    return this.deliveries.length;
  }

  get pageTitle(): string {
    return `Today's Deliveries (${this.totalStops})`;
  }

  get pendingCount(): number {
    return this.deliveries.filter((stop) => this.isAssignedStop(stop)).length;
  }

  get completedCount(): number {
    return this.deliveries.filter((stop) => stop.status === 'delivered').length;
  }

  get cancelledCount(): number {
    return this.deliveries.filter((stop) => stop.status === 'cancelled').length;
  }

  get skippedCount(): number {
    return this.deliveries.filter((stop) => stop.status === 'skipped').length;
  }

  get activeFilterCount(): number {
    return Number(this.selectedFilter !== 'all') + Number(this.searchTerm.trim().length > 0);
  }

  get hasActiveQuery(): boolean {
    return this.searchTerm.trim().length > 0 || this.selectedFilter !== 'all';
  }

  get emptyStateIcon(): string {
    return this.hasActiveQuery ? 'search-outline' : 'file-tray-outline';
  }

  get emptyStateTitle(): string {
    return this.hasActiveQuery ? 'No deliveries found' : 'No deliveries assigned';
  }

  get emptyStateMessage(): string {
    return this.hasActiveQuery
      ? 'Try adjusting search or filter selections to find the right stop.'
      : 'No delivery orders are currently available for today in this service area.';
  }

  get emptyStateActionText(): string {
    return this.hasActiveQuery ? 'Show All' : '';
  }

  selectFilter(filter: FilterKey): void {
    this.selectedFilter = filter;
    void Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
  }

  clearSearch(): void {
    this.searchTerm = '';
  }

  openDelivery(stopId: string): void {
    void this.navCtrl.navigateForward(['/delivery', stopId]);
  }

  goToMap(): void {
    void this.navCtrl.navigateRoot('/map', { animated: false });
  }

  handleRefresh(event: CustomEvent): void {
    Promise.all([
      new Promise<DeliveryOrder[]>((resolve, reject) => {
        this.orderService.getOrders(buildStaticDeliveryOrdersQuery(this.todayDate)).subscribe({
          next: resolve,
          error: reject,
        });
      }),
      getDriverLocation(),
    ])
      .then(([orders, location]) => {
        this.driverLocation = location;
        this.setDeliveriesFromOrders(orders, location);
        this.errorMessage = '';
        (event.target as HTMLIonRefresherElement).complete();
      })
      .catch((err: unknown) => {
        this.errorMessage = getApiErrorMessage(err, 'Unable to refresh deliveries.');
        (event.target as HTMLIonRefresherElement).complete();
      });
  }

  loadOrders(): void {
    this.loading = true;
    this.errorMessage = '';
    this.deliveries = [];
    this.routeOptimized = false;
    this.usingCachedData = false;

    Promise.all([
      new Promise<DeliveryOrder[]>((resolve, reject) => {
        this.orderService.getOrders(buildStaticDeliveryOrdersQuery(this.todayDate)).subscribe({
          next: (orders) => {
            this.saveOrdersToCache(orders);
            resolve(orders);
          },
          error: reject,
        });
      }),
      getDriverLocation(),
    ])
      .then(([orders, location]) => {
        this.driverLocation = location;
        this.setDeliveriesFromOrders(orders, location);
        this.loading = false;
      })
      .catch((err: unknown) => {
        // API failed — try local cache before showing error
        const cached = this.loadOrdersFromCache();
        if (cached) {
          getDriverLocation().then((location) => {
            this.driverLocation = location;
            this.setDeliveriesFromOrders(cached.orders, location);
            this.usingCachedData = true;
            this.cachedAtLabel = cached.cachedAt;
            this.loading = false;
          });
        } else {
          this.errorMessage = getApiErrorMessage(
            err,
            'Unable to load deliveries right now. Check your connection and try again.',
          );
          this.loading = false;
        }
      });
  }

  private setDeliveriesFromOrders(
    orders: DeliveryOrder[],
    location: LatLngLiteral = this.driverLocation,
  ): void {
    const raw = orders.map((order, idx) => mapOrderToDeliveryStopViewModel(order, idx));
    const optimized = optimizeStopsFromLocation(raw, location);
    const enriched = enrichStopsWithETA(optimized, location);

    const pending = enriched.filter(
      (s) => !['delivered', 'cancelled', 'skipped', 'failed'].includes(s.status),
    );
    const coords = pending.map((s) => ({
      lat: s.lat ?? location.lat,
      lng: s.lng ?? location.lng,
    }));
    const distKm = calculateRouteDistance(coords);
    const etaMin = estimateRouteEtaMinutes(distKm, pending.length);

    this.deliveries = enriched;
    this.routeDistanceLabel = formatDistance(distKm);
    this.routeEtaLabel = formatEta(etaMin);
    this.routeOptimized = pending.length > 1;
  }

  // ── Offline cache ──────────────────────────────────────────────────────

  private get cacheKey(): string {
    return `aroha.delivery.orders.${this.todayDate}`;
  }

  private saveOrdersToCache(orders: DeliveryOrder[]): void {
    try {
      const now = new Date();
      const h = now.getHours();
      const m = now.getMinutes().toString().padStart(2, '0');
      const label = `${h % 12 || 12}:${m} ${h >= 12 ? 'PM' : 'AM'}`;
      localStorage.setItem(this.cacheKey, JSON.stringify({ orders, cachedAt: label }));
      // Remove yesterday's cache
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yd = yesterday.toISOString().slice(0, 10);
      localStorage.removeItem(`aroha.delivery.orders.${yd}`);
    } catch {}
  }

  private loadOrdersFromCache(): { orders: DeliveryOrder[]; cachedAt: string } | null {
    try {
      const raw = localStorage.getItem(this.cacheKey);
      if (!raw) return null;
      return JSON.parse(raw) as { orders: DeliveryOrder[]; cachedAt: string };
    } catch {
      return null;
    }
  }
}
