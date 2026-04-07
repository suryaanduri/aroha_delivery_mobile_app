import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonButton, IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  eyeOffOutline,
  eyeOutline,
  lockClosedOutline,
  shieldCheckmarkOutline,
} from 'ionicons/icons';
import { AuthService } from 'src/app/services/auth.service';
import { getApiErrorMessage } from 'src/app/utils/api-contract.util';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.page.html',
  styleUrls: ['./reset-password.page.scss'],
  standalone: true,
  imports: [IonButton, IonContent, IonIcon, IonSpinner, CommonModule, FormsModule],
})
export class ResetPasswordPage {
  oldPassword = '';
  newPassword = '';
  confirmPassword = '';
  showOld = false;
  showNew = false;
  showConfirm = false;
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService
  ) {
    addIcons({ eyeOffOutline, eyeOutline, lockClosedOutline, shieldCheckmarkOutline });
  }

  get validationError(): string {
    if (!this.oldPassword) return '';
    if (!this.newPassword) return '';
    if (this.newPassword.length > 0 && this.newPassword.length < 6) {
      return 'New password must be at least 6 characters.';
    }
    if (this.newPassword && this.oldPassword && this.newPassword === this.oldPassword) {
      return 'New password must be different from old password.';
    }
    if (this.confirmPassword && this.newPassword !== this.confirmPassword) {
      return 'Passwords do not match.';
    }
    return '';
  }

  get canSubmit(): boolean {
    return (
      this.oldPassword.length > 0 &&
      this.newPassword.length >= 6 &&
      this.confirmPassword.length > 0 &&
      this.newPassword === this.confirmPassword &&
      this.newPassword !== this.oldPassword &&
      !this.loading
    );
  }

  onSubmit(): void {
    if (!this.canSubmit) return;

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService
      .resetPassword({
        oldPassword: this.oldPassword,
        newPassword: this.newPassword,
        confirmPassword: this.confirmPassword,
      })
      .subscribe({
        next: (res) => {
          this.loading = false;
          this.successMessage = res.message || 'Password updated successfully!';
          setTimeout(() => void this.router.navigate(['/dashboard']), 1200);
        },
        error: (err: unknown) => {
          this.loading = false;
          this.errorMessage = getApiErrorMessage(err, 'Failed to update password. Please try again.');
        },
      });
  }
}
