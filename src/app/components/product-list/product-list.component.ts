import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cubeOutline, waterOutline } from 'ionicons/icons';

export interface DeliveryProductItem {
  name: string;
  quantity: string;
}

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, IonIcon],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss',
})
export class ProductListComponent {
  @Input() milkItems: DeliveryProductItem[] = [];
  @Input() extraItems: DeliveryProductItem[] = [];
  @Input() layout: 'compact' | 'expanded' = 'compact';

  constructor() {
    addIcons({ cubeOutline, waterOutline });
  }
}
