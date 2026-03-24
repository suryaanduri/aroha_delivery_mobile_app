import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonButton, IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { eyeOffOutline, eyeOutline, lockClosedOutline, personCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonButton, IonContent, IonIcon, CommonModule, FormsModule]
})
export class LoginPage {
  username = '';
  password = '';
  showPassword = false;

  constructor() {
    addIcons({
      eyeOffOutline,
      eyeOutline,
      lockClosedOutline,
      personCircleOutline
    });
  }

  get canSubmit(): boolean {
    return this.username.trim().length > 0 && this.password.length > 0;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (!this.canSubmit) {
      return;
    }
  }
}
