import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  chevronForwardOutline,
  logOutOutline,
  personCircleOutline,
  statsChartOutline,
} from 'ionicons/icons';
import { PageShellComponent } from 'src/app/components/page-shell/page-shell.component';
import { TopHeaderComponent } from 'src/app/components/top-header/top-header.component';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-more',
  templateUrl: './more.page.html',
  styleUrls: ['./more.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonIcon,
    PageShellComponent,
    RouterLink,
    TopHeaderComponent,
  ],
})
export class MorePage {
  constructor(
    private readonly authService: AuthService,
    private readonly alertController: AlertController
  ) {
    addIcons({
      chevronForwardOutline,
      logOutOutline,
      personCircleOutline,
      statsChartOutline,
    });
  }

  get agentName(): string {
    return this.authService.user?.name ?? 'Delivery Partner';
  }

  get agentRole(): string {
    return this.authService.user?.role ?? 'Route Operations';
  }

  async confirmLogout(): Promise<void> {
    const alert = await this.alertController.create({
      cssClass: 'app-confirm-alert',
      header: 'Logout?',
      message: 'You will need to sign in again to view your delivery route.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'app-confirm-alert__cancel',
        },
        {
          text: 'Logout',
          role: 'destructive',
          cssClass: 'app-confirm-alert__confirm',
          handler: () => {
            this.authService.logout();
          },
        },
      ],
    });

    await alert.present();
  }
}
