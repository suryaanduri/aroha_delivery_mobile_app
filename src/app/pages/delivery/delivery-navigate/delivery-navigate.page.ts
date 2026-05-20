import { Component, NgZone, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { NavController } from '@ionic/angular';
import { GoogleMapsModule } from '@angular/google-maps';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  arrowForwardOutline,
  arrowUpOutline,
  boatOutline,
  flagOutline,
  gitBranchOutline,
  navigateOutline,
  openOutline,
  refreshOutline,
  syncOutline,
} from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';
import { GoogleMapsLoaderService } from 'src/app/services/google-maps-loader.service';
import { OrderService } from 'src/app/services/order.service';
import { getApiErrorMessage } from 'src/app/utils/api-contract.util';
import { CHANDANAGAR_CENTER } from 'src/app/utils/mock-coordinates.util';

interface NavStep {
  instruction: string;
  distance: string;
  icon: string;
  endLat: number;
  endLng: number;
}

/** Metres within which the driver is considered to have "passed" a step waypoint. */
const STEP_ADVANCE_RADIUS = 40;
/** Metres within which the driver is considered to have arrived at the destination. */
const ARRIVAL_RADIUS = 30;

@Component({
  selector: 'app-delivery-navigate',
  templateUrl: './delivery-navigate.page.html',
  styleUrls: ['./delivery-navigate.page.scss'],
  standalone: true,
  imports: [CommonModule, GoogleMapsModule, IonContent, IonIcon],
})
export class DeliveryNavigatePage implements OnDestroy {
  private readonly stopId: string;

  // ── State ──────────────────────────────────────────────────────────────────
  loading = true;
  errorMessage = '';
  googleMapsLoaded = false;
  arrived = false;

  customerName = '';
  routeDistance = '';
  routeDuration = '';

  steps: NavStep[] = [];
  currentStepIndex = 0;

  driverLocation = CHANDANAGAR_CENTER;

  // ── Google Maps internals ──────────────────────────────────────────────────
  map?: google.maps.Map;
  private directionsRenderer?: google.maps.DirectionsRenderer;
  private driverMarker?: google.maps.marker.AdvancedMarkerElement;
  private watchId: number | null = null;

  /** Destination used for external-maps fallback */
  private externalMapsUrl = '';

  mapOptions: google.maps.MapOptions = {
    center: CHANDANAGAR_CENTER,
    zoom: 16,
    disableDefaultUI: true,
    clickableIcons: false,
    gestureHandling: 'greedy',
    mapId: 'AROHA_DELIVERY_ROUTE_MAP',
  };

  constructor(
    private readonly route: ActivatedRoute,
    private readonly navCtrl: NavController,
    private readonly orderService: OrderService,
    private readonly mapsLoader: GoogleMapsLoaderService,
    private readonly zone: NgZone,
  ) {
    this.stopId = this.route.snapshot.paramMap.get('id') ?? '';
    addIcons({
      arrowBackOutline,
      arrowForwardOutline,
      arrowUpOutline,
      boatOutline,
      flagOutline,
      gitBranchOutline,
      navigateOutline,
      openOutline,
      refreshOutline,
      syncOutline,
    });
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  async ionViewDidEnter(): Promise<void> {
    await this.init();
  }

  /**
   * ionViewWillLeave fires reliably when the user navigates away, even when
   * Ionic's IonRouterOutlet keeps the component alive in its page cache.
   * This stops the GPS watch immediately so it doesn't drain battery.
   */
  ionViewWillLeave(): void {
    this.clearWatch();
  }

  ngOnDestroy(): void {
    this.clearWatch();
    if (this.driverMarker) this.driverMarker.map = null;
    this.directionsRenderer?.setMap(null);
  }

  // ── Public handlers ────────────────────────────────────────────────────────

  onMapReady(map: unknown): void {
    this.map = map as google.maps.Map;

    this.directionsRenderer = new google.maps.DirectionsRenderer({
      suppressMarkers: false,
      polylineOptions: {
        strokeColor: '#1a4d3f',
        strokeWeight: 5,
        strokeOpacity: 0.85,
      },
    });
    this.directionsRenderer.setMap(this.map);
  }

  goBack(): void {
    void this.navCtrl.back();
  }

  openExternalMaps(): void {
    if (this.externalMapsUrl) {
      window.open(this.externalMapsUrl, '_system');
    }
  }

  retry(): void {
    this.errorMessage = '';
    void this.init();
  }

  // ── Core initialization ────────────────────────────────────────────────────

  private async init(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';
    this.arrived = false;
    this.steps = [];
    this.currentStepIndex = 0;
    this.clearWatch();

    try {
      const [order] = await Promise.all([
        firstValueFrom(this.orderService.getOrderById(this.stopId)),
        this.mapsLoader.load().then(() => { this.googleMapsLoaded = true; }),
      ]);

      if (!order) {
        this.errorMessage = 'Delivery not found.';
        this.loading = false;
        return;
      }

      this.customerName = order.customerName ?? 'Delivery stop';

      const destLat = order.location?.lat;
      const destLng = order.location?.lng;
      const destAddress = order.landmark
        ? `${order.address}, ${order.landmark}`
        : (order.address ?? '');

      // Build external-maps fallback URL
      if (typeof destLat === 'number' && typeof destLng === 'number') {
        this.externalMapsUrl =
          `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=driving`;
      } else {
        this.externalMapsUrl =
          `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destAddress)}&travelmode=driving`;
      }

      // Get driver's GPS position first
      const driverPos = await this.getDriverPosition();
      this.driverLocation = driverPos;

      // Update map centre to driver
      this.mapOptions = { ...this.mapOptions, center: driverPos };

      // Fetch route and render
      await this.fetchAndRenderRoute(driverPos, destLat, destLng, destAddress);

      // Start GPS tracking
      this.startWatch();
    } catch (err: unknown) {
      this.errorMessage = getApiErrorMessage(err, 'Unable to load route. Please try again.');
    } finally {
      this.loading = false;
    }
  }

  private getDriverPosition(): Promise<{ lat: number; lng: number }> {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(CHANDANAGAR_CENTER),
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 },
      );
    });
  }

  private async fetchAndRenderRoute(
    origin: { lat: number; lng: number },
    destLat: number | null | undefined,
    destLng: number | null | undefined,
    destAddress: string,
  ): Promise<void> {
    const directionsService = new google.maps.DirectionsService();

    const destination: google.maps.LatLng | string =
      typeof destLat === 'number' && typeof destLng === 'number'
        ? new google.maps.LatLng(destLat, destLng)
        : destAddress;

    const result = await directionsService.route({
      origin: new google.maps.LatLng(origin.lat, origin.lng),
      destination,
      travelMode: google.maps.TravelMode.DRIVING,
    });

    if (!result.routes.length) {
      throw new Error('No route found. Check destination address.');
    }

    // Render route on map
    if (this.directionsRenderer) {
      this.directionsRenderer.setDirections(result);
    }

    // Pan map to driver
    if (this.map) {
      this.map.panTo(origin);

      // Show driver position marker
      const pin = document.createElement('div');
      pin.innerHTML = `
        <svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
          <circle cx="14" cy="14" r="13" fill="#1a6bff" stroke="#fff" stroke-width="3"/>
          <circle cx="14" cy="14" r="5" fill="#fff"/>
        </svg>`;
      this.driverMarker = new google.maps.marker.AdvancedMarkerElement({
        map: this.map,
        position: origin,
        content: pin.firstElementChild as HTMLElement,
        title: 'Your location',
        zIndex: 50,
      });
    }

    // Parse steps from the first leg
    const leg = result.routes[0].legs[0];
    this.routeDistance = leg.distance?.text ?? '';
    this.routeDuration = leg.duration?.text ?? '';

    this.steps = leg.steps.map((step) => ({
      instruction: this.stripHtml(step.instructions ?? ''),
      distance: step.distance?.text ?? '',
      icon: this.maneuverToIcon(step.maneuver),
      endLat: step.end_location.lat(),
      endLng: step.end_location.lng(),
    }));
  }

  // ── GPS watch ──────────────────────────────────────────────────────────────

  private startWatch(): void {
    this.clearWatch();
    this.watchId = navigator.geolocation.watchPosition(
      (pos) => this.zone.run(() => this.onPositionUpdate(pos)),
      () => { /* silently ignore errors — map stays static */ },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 },
    );
  }

  private clearWatch(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  private onPositionUpdate(pos: GeolocationPosition): void {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    const driverLatLng = new google.maps.LatLng(lat, lng);

    // Update driver marker
    this.driverLocation = { lat, lng };
    if (this.driverMarker) {
      this.driverMarker.position = { lat, lng };
    }

    // Pan map to stay centred on driver
    this.map?.panTo({ lat, lng });

    if (!this.steps.length || this.arrived) return;

    // Check arrival at final destination
    const lastStep = this.steps[this.steps.length - 1];
    const dest = new google.maps.LatLng(lastStep.endLat, lastStep.endLng);
    if (google.maps.geometry.spherical.computeDistanceBetween(driverLatLng, dest) < ARRIVAL_RADIUS) {
      this.arrived = true;
      this.clearWatch();
      return;
    }

    // Advance step if driver is close to current step's end waypoint
    const step = this.steps[this.currentStepIndex];
    if (step && this.currentStepIndex < this.steps.length - 1) {
      const stepEnd = new google.maps.LatLng(step.endLat, step.endLng);
      if (google.maps.geometry.spherical.computeDistanceBetween(driverLatLng, stepEnd) < STEP_ADVANCE_RADIUS) {
        this.currentStepIndex++;
      }
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  get currentStep(): NavStep | null {
    return this.steps[this.currentStepIndex] ?? null;
  }

  private stripHtml(html: string): string {
    const el = document.createElement('div');
    el.innerHTML = html;
    return el.textContent ?? '';
  }

  private maneuverToIcon(maneuver: string | undefined): string {
    if (!maneuver) return 'arrow-up-outline';
    if (maneuver.includes('left')) return 'arrow-back-outline';
    if (maneuver.includes('right')) return 'arrow-forward-outline';
    if (maneuver.includes('uturn')) return 'refresh-outline';
    if (maneuver.includes('roundabout')) return 'sync-outline';
    if (maneuver.includes('merge') || maneuver.includes('fork') || maneuver.includes('ramp')) return 'git-branch-outline';
    if (maneuver.includes('ferry')) return 'boat-outline';
    return 'arrow-up-outline';
  }
}
