import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { homeOutline, listOutline, mapOutline, statsChartOutline } from 'ionicons/icons';

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
  constructor() {
    addIcons({
      homeOutline,
      listOutline,
      mapOutline,
      statsChartOutline,
    });
  }
}
