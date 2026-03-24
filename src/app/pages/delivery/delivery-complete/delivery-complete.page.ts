import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-delivery-complete',
  templateUrl: './delivery-complete.page.html',
  styleUrls: ['./delivery-complete.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class DeliveryCompletePage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
