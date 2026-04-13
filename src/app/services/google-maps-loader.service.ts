import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { environment } from 'src/environments/environment';

declare global {
  interface Window {
    __arohaGoogleMapsLoaderPromise?: Promise<void>;
  }
}

@Injectable({ providedIn: 'root' })
export class GoogleMapsLoaderService {
  private readonly document = inject(DOCUMENT);
  private readonly loadTimeoutMs = 8000;

  load(): Promise<void> {
    if (typeof window === 'undefined') {
      return Promise.resolve();
    }

    if (window.google?.maps) {
      return Promise.resolve();
    }

    if (window.__arohaGoogleMapsLoaderPromise) {
      return window.__arohaGoogleMapsLoaderPromise;
    }

    const apiKey = environment.googleMapsApiKey?.trim();
    if (!apiKey) {
      return Promise.reject(new Error('Google Maps API key is missing.'));
    }

    const existingScript = this.document.querySelector<HTMLScriptElement>('script[data-google-maps-loader="true"]');
    if (existingScript) {
      window.__arohaGoogleMapsLoaderPromise = new Promise((resolve, reject) => {
        existingScript.addEventListener('load', () => resolve(), { once: true });
        existingScript.addEventListener('error', () => reject(new Error('Failed to load Google Maps script.')), {
          once: true,
        });
      });
      return window.__arohaGoogleMapsLoaderPromise;
    }

    window.__arohaGoogleMapsLoaderPromise = new Promise((resolve, reject) => {
      const script = this.document.createElement('script');
      script.async = true;
      script.defer = true;
      script.dataset['googleMapsLoader'] = 'true';
      script.src =
        `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}` +
        '&libraries=geometry,marker&loading=async';
      script.onload = () => {
        this.waitForMapsApi()
          .then(() => resolve())
          .catch((error) => reject(error));
      };
      script.onerror = () => reject(new Error('Failed to load Google Maps script.'));
      this.document.head.appendChild(script);
    });

    return window.__arohaGoogleMapsLoaderPromise;
  }

  private waitForMapsApi(): Promise<void> {
    const startedAt = Date.now();

    return new Promise((resolve, reject) => {
      const check = () => {
        if (
          window.google?.maps?.Map &&
          window.google?.maps?.Polyline
        ) {
          resolve();
          return;
        }

        if (Date.now() - startedAt >= this.loadTimeoutMs) {
          reject(
            new Error(
              'Google Maps API did not become ready. Check that the Maps JavaScript API is enabled and billing is configured for this API key.'
            )
          );
          return;
        }

        window.setTimeout(check, 120);
      };

      check();
    });
  }
}
