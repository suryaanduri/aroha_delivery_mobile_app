import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-delivery-detail',
  templateUrl: './delivery-detail.page.html',
  styleUrls: ['./delivery-detail.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class DeliveryDetailPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
