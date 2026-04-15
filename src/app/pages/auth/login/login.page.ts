import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { eyeOffOutline, eyeOutline, lockClosedOutline, personCircleOutline } from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { getApiErrorMessage } from 'src/app/utils/api-contract.util';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonContent, IonIcon, IonSpinner, CommonModule, FormsModule],
})
export class LoginPage {
  username = '';
  password = '';
  showPassword = false;
  loading = false;
  errorMessage = '';
  submitted = false;

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService
  ) {
    addIcons({ eyeOffOutline, eyeOutline, lockClosedOutline, personCircleOutline });
  }

  get canSubmit(): boolean {
    return this.normalizedUsername.length > 0 && this.password.length > 0 && !this.loading;
  }

  get normalizedUsername(): string {
    return this.username.trim();
  }

  get usernameError(): string {
    if (!this.submitted || this.normalizedUsername.length > 0) {
      return '';
    }

    return 'Username is required.';
  }

  get passwordError(): string {
    if (!this.submitted || this.password.length > 0) {
      return '';
    }

    return 'Password is required.';
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onUsernameInput(value: string): void {
    this.username = value;
    this.clearErrorState();
  }

  onPasswordInput(value: string): void {
    this.password = value;
    this.clearErrorState();
  }

  async onSubmit(): Promise<void> {
    this.submitted = true;

    if (!this.canSubmit) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    try {
      await firstValueFrom(
        this.authService.login({ username: this.normalizedUsername, password: this.password })
      );

      const navigated = await this.router.navigateByUrl(this.authService.getPostAuthRedirectUrl(), {
        replaceUrl: true,
      });

      if (!navigated) {
        this.errorMessage = 'Login succeeded, but the app could not open your dashboard.';
      }
    } catch (err: unknown) {
      this.errorMessage = getApiErrorMessage(err, 'Login failed. Please try again.');
    } finally {
      this.loading = false;
    }
  }

  goToForgotPassword(): void {
    void this.router.navigate(['/forgot-password']);
  }

  private clearErrorState(): void {
    if (this.errorMessage) {
      this.errorMessage = '';
    }
  }
}
