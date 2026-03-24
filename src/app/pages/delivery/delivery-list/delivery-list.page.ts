import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-delivery-list',
  templateUrl: './delivery-list.page.html',
  styleUrls: ['./delivery-list.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class DeliveryListPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
