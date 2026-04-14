import { resolveRuntimeConfig } from './runtime-config';

const runtimeConfig = resolveRuntimeConfig({
  apiBaseUrl: 'https://dev.arohafresh.com',
  authPrefix: '/api/auth',
  googleMapsApiKey: 'AIzaSyCrsj87LulFb6IHGA31UKn58UXMhW9_L_I',
});

export const environment = {
  production: false,
  ...runtimeConfig,
};
