import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-day-summary',
  templateUrl: './day-summary.page.html',
  styleUrls: ['./day-summary.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class DaySummaryPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
