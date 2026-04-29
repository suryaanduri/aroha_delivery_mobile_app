import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import {
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { ellipsisHorizontalOutline, homeOutline, listOutline, mapOutline } from 'ionicons/icons';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    IonIcon,
    IonLabel,
    IonRouterOutlet,
    IonTabBar,
    IonTabButton,
    IonTabs,
    RouterLink,
    RouterLinkActive,
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
})
export class MainLayoutComponent {
  constructor(private readonly router: Router) {
    addIcons({
      ellipsisHorizontalOutline,
      homeOutline,
      listOutline,
      mapOutline,
    });
  }

  get isMoreTabActive(): boolean {
    return ['/more', '/profile', '/day-summary'].some((path) => this.router.url.startsWith(path));
  }
}
