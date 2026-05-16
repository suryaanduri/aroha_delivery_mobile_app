import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { NavController } from '@ionic/angular';
import { GoogleMapsModule } from '@angular/google-maps';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowForwardOutline,
  calendarOutline,
  checkmarkCircleOutline,
  cubeOutline,
  locateOutline,
  locationOutline,
  mapOutline,
  navigateOutline,
  refreshOutline,
  timeOutline,
} from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';
import { EmptyStateComponent } from 'src/app/components/empty-state/empty-state.component';
import { PageShellComponent } from 'src/app/components/page-shell/page-shell.component';
import { SectionHeaderComponent } from 'src/app/components/section-header/section-header.component';
import { StatusChipComponent } from 'src/app/components/status-chip/status-chip.component';
import { SurfaceCardComponent } from 'src/app/components/surface-card/surface-card.component';
import { TopHeaderComponent } from 'src/app/components/top-header/top-header.component';
import { GoogleMapsLoaderService } from 'src/app/services/google-maps-loader.service';
import { OrderService, buildStaticDeliveryOrdersQuery } from 'src/app/services/order.service';
import { formatLocalISODate } from 'src/app/utils/date.util';
import { DeliveryMapStopViewModel, RouteStatsViewModel, mapOrderToDeliveryMapStopViewModel } from 'src/app/utils/map-view.util';
import { CHANDANAGAR_CENTER, LatLngLiteral } from 'src/app/utils/mock-coordinates.util';
import { buildRouteStats, formatDistance, formatEta, getDriverLocation, orderStopsForRoute } from 'src/app/utils/route-calc.util';

@Component({
  selector: 'app-delivery-map',
  templateUrl: './delivery-map.page.html',
  styleUrls: ['./delivery-map.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    GoogleMapsModule,
    IonButton,
    IonContent,
    IonIcon,
    IonSpinner,
    EmptyStateComponent,
    PageShellComponent,
    SectionHeaderComponent,
    StatusChipComponent,
    SurfaceCardComponent,
    TopHeaderComponent,
  ],
})
export class DeliveryMapPage {
  private readonly navCtrl = inject(NavController);
  private readonly orderService = inject(OrderService);
  private readonly googleMapsLoader = inject(GoogleMapsLoaderService);

  readonly center = CHANDANAGAR_CENTER;

  get deliveryDate(): string {
    return formatLocalISODate();
  }

  mapOptions: google.maps.MapOptions = {
    center: CHANDANAGAR_CENTER,
    zoom: 13,
    disableDefaultUI: true,
    clickableIcons: false,
    gestureHandling: 'greedy',
    // mapId required for AdvancedMarkerElement — register a real Map ID in Google Cloud Console for production
    mapId: 'AROHA_DELIVERY_ROUTE_MAP',
  };

  map?: google.maps.Map;
  googleMapsLoaded = false;
  loading = true;
  errorMessage = '';
  stops: DeliveryMapStopViewModel[] = [];
  activeStopId = '';
  driverLocation: LatLngLiteral = CHANDANAGAR_CENTER;
  routeOptimized = false;
  routeStats: RouteStatsViewModel = {
    totalStops: 0,
    completedStops: 0,
    pendingStops: 0,
    totalDistanceKm: 0,
    estimatedEtaMinutes: 0,
  };

  get todayLabel(): string {
    return new Date(`${this.deliveryDate}T00:00:00`).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  }

  get routeDistanceLabel(): string {
    return formatDistance(this.routeStats.totalDistanceKm);
  }

  get routeEtaLabel(): string {
    return formatEta(this.routeStats.estimatedEtaMinutes);
  }

  get activeStop(): DeliveryMapStopViewModel | null {
    return this.stops.find((stop) => stop.id === this.activeStopId) ?? null;
  }

  get canOpenActiveStop(): boolean {
    return this.activeStop?.status === 'assigned';
  }

  get mappableStops(): DeliveryMapStopViewModel[] {
    return this.stops.filter((stop) => typeof stop.lat === 'number' && typeof stop.lng === 'number');
  }

  get hasMappableStops(): boolean {
    return this.mappableStops.length > 0;
  }

  get mapUnavailableMessage(): string {
    return this.googleMapsLoaded
      ? "Live coordinates are unavailable for today's stops."
      : 'Google Maps is not available for this build configuration.';
  }

  get routePath(): google.maps.LatLngLiteral[] {
    return this.mappableStops.map((stop) => ({
      lat: stop.lat as number,
      lng: stop.lng as number,
    }));
  }

  get driverMarkerOptions(): google.maps.marker.AdvancedMarkerElementOptions {
    const pin = document.createElement('div');
    pin.innerHTML = `
      <svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
        <circle cx="14" cy="14" r="13" fill="#1a6bff" stroke="#fff" stroke-width="3"/>
        <circle cx="14" cy="14" r="5" fill="#fff"/>
      </svg>`;
    return {
      title: 'Your location',
      zIndex: 50,
      content: pin.firstElementChild as HTMLElement,
    };
  }

  constructor() {
    addIcons({
      arrowForwardOutline,
      calendarOutline,
      checkmarkCircleOutline,
      cubeOutline,
      locateOutline,
      locationOutline,
      mapOutline,
      navigateOutline,
      refreshOutline,
      timeOutline,
    });
  }

  async ionViewDidEnter(): Promise<void> {
    await this.loadRoute();
  }

  async loadRoute(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';

    try {
      const [orders, driverLocation] = await Promise.all([
        firstValueFrom(this.orderService.getOrders(buildStaticDeliveryOrdersQuery(this.deliveryDate))),
        getDriverLocation(),
        this.googleMapsLoader.load().then(() => { this.googleMapsLoaded = true; }),
      ]);

      this.driverLocation = driverLocation;

      const normalizedStops = orders.map((order, index) =>
        mapOrderToDeliveryMapStopViewModel(order, index),
      );

      // Nearest-neighbor optimization starting from driver's current GPS
      this.stops = orderStopsForRoute(normalizedStops, driverLocation);
      this.routeStats = buildRouteStats(this.stops);
      this.routeOptimized = true;
      this.activeStopId = this.getInitialActiveStopId();

      // Update map centre to driver's location
      this.mapOptions = { ...this.mapOptions, center: driverLocation };

      queueMicrotask(() => this.fitMapToRoute());
    } catch (error) {
      this.googleMapsLoaded = false;
      this.errorMessage = this.getRouteLoadErrorMessage(error);
    } finally {
      this.loading = false;
    }
  }

  onMapReady(map: unknown): void {
    this.map = map as google.maps.Map;
    this.fitMapToRoute();
  }

  selectStop(stopId: string): void {
    this.activeStopId = stopId;
    const stop = this.activeStop;
    if (!stop || !this.map || typeof stop.lat !== 'number' || typeof stop.lng !== 'number') {
      return;
    }

    this.map.panTo({
      lat: stop.lat,
      lng: stop.lng,
    });
  }

  focusRoute(): void {
    this.fitMapToRoute();
  }

  openActiveStop(): void {
    if (!this.activeStop || !this.canOpenActiveStop) {
      return;
    }
    void this.navCtrl.navigateForward(['/delivery', this.activeStop.id]);
  }

  goToList(): void {
    void this.navCtrl.navigateRoot('/deliveries');
  }

  navigateToStop(stop: DeliveryMapStopViewModel | null): void {
    if (!stop) return;
    this.openMapsNavigation(stop.lat, stop.lng, stop.address);
  }

  private openMapsNavigation(
    destLat: number | null,
    destLng: number | null,
    destAddress: string
  ): void {
    const destination = typeof destLat === 'number' && typeof destLng === 'number'
      ? `${destLat},${destLng}`
      : encodeURIComponent(destAddress);

    if (!navigator.geolocation) {
      // No geolocation — open Maps with destination only
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`, '_system');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // Use real GPS as origin so Maps starts from the actual device location
        const origin = `${pos.coords.latitude},${pos.coords.longitude}`;
        window.open(
          `https://www.google.com/maps/dir/${origin}/${destination}`,
          '_system'
        );
      },
      () => {
        // Permission denied or timeout — fall back to destination-only
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`, '_system');
      },
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 30000 }
    );
  }

  getAdvancedMarkerOptions(stop: DeliveryMapStopViewModel): google.maps.marker.AdvancedMarkerElementOptions {
    const isActive = stop.id === this.activeStopId;
    const isDelivered = stop.status === 'delivered';
    const fill = isActive ? '#163c34' : isDelivered ? '#6e9f84' : '#d08c49';
    const stroke = isActive ? '#dff3eb' : '#ffffff';

    const pin = document.createElement('div');
    pin.innerHTML = this.buildMarkerSvg(stop.routeOrder, fill, stroke, isDelivered);
    pin.style.cursor = 'pointer';

    return {
      title: `${stop.routeOrder}. ${stop.customerName}`,
      zIndex: isActive ? 30 : isDelivered ? 10 : 20,
      content: pin.firstElementChild as HTMLElement,
    };
  }

  trackByStopId(_: number, stop: DeliveryMapStopViewModel): string {
    return stop.id;
  }

  private fitMapToRoute(): void {
    if (!this.map || this.mappableStops.length === 0 || !window.google?.maps) {
      return;
    }

    if (this.mappableStops.length === 1) {
      this.map.setCenter({
        lat: this.mappableStops[0].lat as number,
        lng: this.mappableStops[0].lng as number,
      });
      this.map.setZoom(14);
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    this.mappableStops.forEach((stop) => {
      bounds.extend({
        lat: stop.lat as number,
        lng: stop.lng as number,
      });
    });

    this.map.fitBounds(bounds, 72);
  }

  private getInitialActiveStopId(): string {
    return (
      this.stops.find((stop) => stop.status === 'in-progress')?.id ??
      this.stops.find((stop) => stop.status === 'assigned')?.id ??
      this.stops[0]?.id ??
      ''
    );
  }

  private getRouteLoadErrorMessage(error: unknown): string {
    const message = error instanceof Error ? error.message : String(error ?? '');
    const lower = message.toLowerCase();

    if (lower.includes('failed to load google maps') || lower.includes('err_blocked') || lower.includes('blocked')) {
      return 'Google Maps is blocked by an ad blocker or browser extension. Disable it for this page and reload.';
    }

    if (lower.includes('google maps api did not become ready')) {
      return 'Google Maps took too long to load. Check your internet connection and retry.';
    }

    if (lower.includes('api key is missing')) {
      return 'Google Maps API key is missing from the environment configuration.';
    }

    return 'Unable to load route right now. Check your connection and retry.';
  }

  private buildMarkerSvg(
    routeOrder: number,
    fillColor: string,
    strokeColor: string,
    isDelivered: boolean
  ): string {
    const markerLabel = isDelivered ? '✓' : String(routeOrder).padStart(2, '0');

    return `
      <svg width="48" height="58" viewBox="0 0 48 58" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M24 56C24 56 42 39.615 42 23.5C42 13.835 33.941 6 24 6C14.059 6 6 13.835 6 23.5C6 39.615 24 56 24 56Z" fill="${fillColor}" />
        <path d="M24 48C24 48 37 36.172 37 23.7C37 16.403 31.18 10.5 24 10.5C16.82 10.5 11 16.403 11 23.7C11 36.172 24 48 24 48Z" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2" />
        <circle cx="24" cy="23" r="10.5" fill="white" fill-opacity="0.94" />
        <text x="24" y="27" text-anchor="middle" font-family="Roboto, Segoe UI, sans-serif" font-size="10.5" font-weight="700" fill="${fillColor}">
          ${markerLabel}
        </text>
      </svg>
    `;
  }
}
