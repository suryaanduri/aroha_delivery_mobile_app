export interface RuntimeEnvironmentConfig {
  apiBaseUrl: string;
  authPrefix: string;
  googleMapsApiKey: string;
}

declare global {
  interface Window {
    __AROHA_RUNTIME_CONFIG__?: Partial<RuntimeEnvironmentConfig>;
  }
}

function readMetaContent(name: string): string | undefined {
  if (typeof document === 'undefined') {
    return undefined;
  }

  const value = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)?.content?.trim();
  return value ? value : undefined;
}

function readWindowConfig(): Partial<RuntimeEnvironmentConfig> {
  if (typeof window === 'undefined') {
    return {};
  }

  return window.__AROHA_RUNTIME_CONFIG__ ?? {};
}

function getOverrideValue(
  windowValue: string | undefined,
  metaValue: string | undefined,
  fallback: string
): string {
  if (typeof windowValue === 'string' && windowValue.trim().length > 0) {
    return windowValue.trim();
  }

  if (typeof metaValue === 'string' && metaValue.trim().length > 0) {
    return metaValue.trim();
  }

  return fallback;
}

export function resolveRuntimeConfig(defaults: RuntimeEnvironmentConfig): RuntimeEnvironmentConfig {
  const windowConfig = readWindowConfig();

  return {
    apiBaseUrl: getOverrideValue(
      windowConfig.apiBaseUrl,
      readMetaContent('aroha-api-base-url'),
      defaults.apiBaseUrl
    ),
    authPrefix: getOverrideValue(
      windowConfig.authPrefix,
      readMetaContent('aroha-auth-prefix'),
      defaults.authPrefix
    ),
    googleMapsApiKey: getOverrideValue(
      windowConfig.googleMapsApiKey,
      readMetaContent('aroha-google-maps-api-key'),
      defaults.googleMapsApiKey
    ),
  };
}
