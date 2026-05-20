import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonIcon, IonRouterOutlet } from '@ionic/angular/standalone';
import { NavController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  ellipsisHorizontalOutline,
  homeOutline,
  listOutline,
  mapOutline,
} from 'ionicons/icons';

interface TabItem {
  label: string;
  icon: string;
  path: string;
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, IonIcon, IonRouterOutlet],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
})
export class MainLayoutComponent {
  readonly tabs: TabItem[] = [
    { label: 'Home',      icon: 'home-outline',               path: '/dashboard' },
    { label: 'List View', icon: 'list-outline',               path: '/deliveries' },
    { label: 'Map View',  icon: 'map-outline',                path: '/map' },
    { label: 'More',      icon: 'ellipsis-horizontal-outline', path: '/more' },
  ];

  constructor(
    private readonly router: Router,
    private readonly navCtrl: NavController,
  ) {
    addIcons({ ellipsisHorizontalOutline, homeOutline, listOutline, mapOutline });
  }

  isActive(path: string): boolean {
    const url = this.router.url;
    if (path === '/deliveries') {
      return url === '/deliveries' || url.startsWith('/deliveries?') || url.startsWith('/deliveries/') || url.startsWith('/delivery/');
    }
    if (path === '/more') {
      return url.startsWith('/more') || url.startsWith('/profile') || url.startsWith('/day-summary');
    }
    return url.startsWith(path);
  }

  navigate(path: string): void {
    void this.navCtrl.navigateRoot(path, { animated: false });
  }
}
