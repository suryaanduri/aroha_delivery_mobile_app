import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { NavController } from '@ionic/angular';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { PluginListenerHandle } from '@capacitor/core';
import { StatusBar } from '@capacitor/status-bar';

/**
 * Routes where the back button should minimize the app rather than navigate back.
 * Auth sub-pages (/forgot-password, /reset-password) are intentionally excluded — they
 * may have history (user came from /login) so `canGoBack` handles them correctly.
 */
const ROOT_ROUTES = new Set([
  '/dashboard',
  '/deliveries',
  '/map',
  '/more',
  '/login',
]);

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit, OnDestroy {
  private resumeListener: PluginListenerHandle | null = null;
  private backButtonListener: PluginListenerHandle | null = null;

  constructor(
    private readonly router: Router,
    private readonly navCtrl: NavController,
  ) {}

  async ngOnInit(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await this.syncStatusBarInset();

      this.resumeListener = await App.addListener('resume', async () => {
        await this.syncStatusBarInset();
      });

      this.backButtonListener = await App.addListener('backButton', ({ canGoBack }) => {
        // Strip query params and hash to get the bare path
        const path = this.router.url.split('?')[0].split('#')[0];

        if (ROOT_ROUTES.has(path) || !canGoBack) {
          // On a root screen or no navigation history — send the app to the background
          void App.minimizeApp();
        } else {
          // On a sub-page — go back to the previous screen
          this.navCtrl.back();
        }
      });
    }
  }

  ngOnDestroy(): void {
    void this.resumeListener?.remove();
    void this.backButtonListener?.remove();
  }

  private async syncStatusBarInset(): Promise<void> {
    const root = document.documentElement;
    try {
      const info = await StatusBar.getInfo();
      const height = Math.max(0, Math.round(info.height ?? 0));
      root.style.setProperty('--app-native-status-bar-height', `${height}px`);
    } catch {
      root.style.setProperty('--app-native-status-bar-height', '0px');
    }
  }
}
