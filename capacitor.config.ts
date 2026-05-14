import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.arohafresh.delivery',
  appName: 'Aroha Fresh Delivery',
  webDir: 'www',
  plugins: {
    StatusBar: {
      overlaysWebView: false,
      style: 'LIGHT',
      backgroundColor: '#1a4d3f',
    },
    SplashScreen: {
      launchShowDuration: 0,
    },
    Camera: {
      presentationStyle: 'fullscreen',
    },
  },
  android: {
    backgroundColor: '#1a4d3f',
    allowMixedContent: false,
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#1a4d3f',
  },
  server: {
    // Allow hot-reload during dev; commented out for production builds
    // url: 'http://192.168.1.x:8100',
    cleartext: false,
  },
};

export default config;
