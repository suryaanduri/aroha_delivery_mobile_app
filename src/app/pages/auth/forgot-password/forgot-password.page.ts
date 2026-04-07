import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonButton, IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBackOutline, mailOutline } from 'ionicons/icons';
import { AuthService } from 'src/app/services/auth.service';
import { getApiErrorMessage } from 'src/app/utils/api-contract.util';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
  standalone: true,
  imports: [IonButton, IonContent, IonIcon, IonSpinner, CommonModule, FormsModule],
})
export class ForgotPasswordPage {
  email = '';
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService
  ) {
    addIcons({ arrowBackOutline, mailOutline });
  }

  get canSubmit(): boolean {
    return this.email.trim().length > 0 && !this.loading;
  }

  onSubmit(): void {
    if (!this.canSubmit) return;

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.forgotPassword({ email: this.email.trim() }).subscribe({
      next: (res) => {
        this.loading = false;
        this.successMessage = res.message || 'A temporary password has been sent to your email. Please check your inbox.';
        setTimeout(() => void this.router.navigate(['/login']), 2500);
      },
      error: (err: unknown) => {
        this.loading = false;
        this.errorMessage = getApiErrorMessage(err, 'Something went wrong. Please try again.');
      },
    });
  }

  goBack(): void {
    void this.router.navigate(['/login']);
  }
}
