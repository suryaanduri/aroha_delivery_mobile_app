import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { IonButton, IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  calendarOutline,
  locateOutline,
  locationOutline,
  mapOutline,
  navigateOutline,
  timeOutline
} from 'ionicons/icons';
import { PageShellComponent } from 'src/app/components/page-shell/page-shell.component';
import { SectionHeaderComponent } from 'src/app/components/section-header/section-header.component';
import { StatusChipComponent } from 'src/app/components/status-chip/status-chip.component';
import { SurfaceCardComponent } from 'src/app/components/surface-card/surface-card.component';
import { TopHeaderComponent } from 'src/app/components/top-header/top-header.component';

@Component({
  selector: 'app-delivery-map',
  templateUrl: './delivery-map.page.html',
  styleUrls: ['./delivery-map.page.scss'],
  standalone: true,
  imports: [
    IonButton,
    IonContent,
    IonIcon,
    CommonModule,
    RouterLink,
    PageShellComponent,
    SectionHeaderComponent,
    StatusChipComponent,
    SurfaceCardComponent,
    TopHeaderComponent,
  ]
})
export class DeliveryMapPage {
  readonly totalStops = 5;
  readonly activeStopId = 1;
  readonly routeDistance = '8.4 km';
  readonly routeEta = '1h 12m';
  readonly stops = [
    { id: 1, name: 'Green Meadows Residency', area: 'Anna Nagar West', status: 'in-progress', eta: 'Now', pinClass: 'pin--one' },
    { id: 2, name: 'Maya Krishnan', area: 'Mogappair East', status: 'pending', eta: '7 min', pinClass: 'pin--two' },
    { id: 3, name: 'Vignesh Villa', area: 'Shenoy Nagar', status: 'pending', eta: '16 min', pinClass: 'pin--three' },
    { id: 4, name: 'Lakshmi Narayanan', area: 'Mylapore', status: 'delivered', eta: 'Done', pinClass: 'pin--four' },
    { id: 5, name: 'Skyline Heights', area: 'Kilpauk', status: 'delivered', eta: 'Done', pinClass: 'pin--five' }
  ] as const;

  constructor(private readonly router: Router) {
    addIcons({
      arrowBackOutline,
      calendarOutline,
      locateOutline,
      locationOutline,
      mapOutline,
      navigateOutline,
      timeOutline
    });
  }

  get activeStop() {
    return this.stops.find((stop) => stop.id === this.activeStopId) ?? this.stops[0];
  }

  openStop(stopId: number): void {
    void this.router.navigate(['/delivery', stopId]);
  }
    get todayLabel(): string {
    return new Date().toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  }
}
