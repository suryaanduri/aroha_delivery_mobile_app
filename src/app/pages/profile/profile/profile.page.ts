import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon, IonSpinner, IonToast } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  checkmarkOutline,
  createOutline,
  closeOutline,
  lockClosedOutline,
  mailOutline,
  personOutline,
  phonePortraitOutline,
  locationOutline,
  refreshOutline,
  shieldCheckmarkOutline,
} from 'ionicons/icons';
import { AuthService } from 'src/app/services/auth.service';
import { ProfileService, DeliveryPersonProfile } from 'src/app/services/profile.service';
import { getApiErrorMessage } from 'src/app/utils/api-contract.util';
import { PageShellComponent } from 'src/app/components/page-shell/page-shell.component';
import { SurfaceCardComponent } from 'src/app/components/surface-card/surface-card.component';
import { TopHeaderComponent } from 'src/app/components/top-header/top-header.component';
import { SectionHeaderComponent } from 'src/app/components/section-header/section-header.component';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonIcon,
    IonSpinner,
    IonToast,
    CommonModule,
    FormsModule,
    PageShellComponent,
    SurfaceCardComponent,
    TopHeaderComponent,
    SectionHeaderComponent,
  ],
})
export class ProfilePage implements OnInit {
  profile: DeliveryPersonProfile | null = null;
  loading = true;
  errorMessage = '';
  saving = false;
  isEditing = false;

  editName = '';
  editEmail = '';
  nameError = '';
  emailError = '';

  toastMessage = '';
  toastOpen = false;
  toastColor: 'success' | 'danger' = 'success';

  constructor(
    private readonly authService: AuthService,
    private readonly profileService: ProfileService
  ) {
    addIcons({
      checkmarkOutline,
      createOutline,
      closeOutline,
      lockClosedOutline,
      mailOutline,
      personOutline,
      phonePortraitOutline,
      locationOutline,
      refreshOutline,
      shieldCheckmarkOutline,
    });
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  get initials(): string {
    const name = this.profile?.name ?? this.authService.user?.name ?? '';
    return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
  }

  get memberSince(): string {
    if (!this.profile?.createdAt) return '';
    return new Date(this.profile.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  }

  loadProfile(): void {
    this.loading = true;
    this.errorMessage = '';
    this.profileService.getMyProfile().subscribe({
      next: (p) => { this.profile = p; this.loading = false; },
      error: (err: unknown) => {
        this.errorMessage = getApiErrorMessage(err, 'Unable to load profile.');
        this.loading = false;
      },
    });
  }

  startEdit(): void {
    if (!this.profile) return;
    this.editName = this.profile.name;
    this.editEmail = this.profile.email;
    this.nameError = '';
    this.emailError = '';
    this.isEditing = true;
  }

  cancelEdit(): void {
    this.isEditing = false;
  }

  validateForm(): boolean {
    this.nameError = '';
    this.emailError = '';
    let valid = true;
    if (!this.editName.trim()) { this.nameError = 'Name is required.'; valid = false; }
    if (!this.editEmail.trim()) { this.emailError = 'Email is required.'; valid = false; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.editEmail)) { this.emailError = 'Invalid email format.'; valid = false; }
    return valid;
  }

  saveProfile(): void {
    if (!this.validateForm() || this.saving) return;
    this.saving = true;
    this.profileService.updateMyProfile({ name: this.editName.trim(), email: this.editEmail.trim() }).subscribe({
      next: (updated) => {
        this.profile = updated;
        this.isEditing = false;
        this.saving = false;
        this.showToast('Profile updated successfully.', 'success');
      },
      error: (err: unknown) => {
        this.saving = false;
        this.showToast(getApiErrorMessage(err, 'Unable to save profile.'), 'danger');
      },
    });
  }

  private showToast(message: string, color: 'success' | 'danger'): void {
    this.toastMessage = message;
    this.toastColor = color;
    this.toastOpen = true;
  }
}
