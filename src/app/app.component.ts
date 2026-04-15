import { Component, OnDestroy, OnInit } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { PluginListenerHandle } from '@capacitor/core';
import { StatusBar } from '@capacitor/status-bar';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit, OnDestroy {
  private resumeListener: PluginListenerHandle | null = null;

  async ngOnInit(): Promise<void> {
    await this.syncStatusBarInset();

    if (Capacitor.isNativePlatform()) {
      this.resumeListener = await App.addListener('resume', async () => {
        await this.syncStatusBarInset();
      });
    }
  }

  ngOnDestroy(): void {
    void this.resumeListener?.remove();
  }

  private async syncStatusBarInset(): Promise<void> {
    if (typeof document === 'undefined') {
      return;
    }

    const root = document.documentElement;
    if (!Capacitor.isNativePlatform()) {
      root.style.setProperty('--app-native-status-bar-height', '0px');
      return;
    }

    try {
      const info = await StatusBar.getInfo();
      const height = Math.max(0, Math.round(info.height ?? 0));
      root.style.setProperty('--app-native-status-bar-height', `${height}px`);
    } catch {
      root.style.setProperty('--app-native-status-bar-height', '0px');
    }
  }
}
