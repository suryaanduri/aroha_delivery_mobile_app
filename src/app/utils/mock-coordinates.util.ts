import { DeliveryMapStopViewModel } from './map-view.util';

export interface LatLngLiteral {
  lat: number;
  lng: number;
}

export const CHANDANAGAR_CENTER: LatLngLiteral = {
  lat: 17.4948,
  lng: 78.3242,
};

const STABLE_OFFSETS_KM: ReadonlyArray<{ northKm: number; eastKm: number }> = [
  { northKm: 0.7, eastKm: 0.6 },
  { northKm: 1.1, eastKm: 1.4 },
  { northKm: 1.8, eastKm: 0.4 },
  { northKm: 1.2, eastKm: -1.3 },
  { northKm: 0.4, eastKm: -2.0 },
  { northKm: -0.8, eastKm: -1.6 },
  { northKm: -1.7, eastKm: -0.7 },
  { northKm: -1.4, eastKm: 0.9 },
  { northKm: -0.5, eastKm: 1.9 },
  { northKm: 2.2, eastKm: -0.4 },
  { northKm: 2.0, eastKm: 1.8 },
  { northKm: -2.1, eastKm: 1.5 },
];

export function withMockCoordinates(stop: DeliveryMapStopViewModel): DeliveryMapStopViewModel {
  if (isValidCoordinate(stop.lat) && isValidCoordinate(stop.lng)) {
    return stop;
  }

  return {
    ...stop,
    ...getStableMockCoordinates(stop.orderId || stop.id, stop.sequence),
  };
}

export function getStableMockCoordinates(seed: string, sequence?: number | null): LatLngLiteral {
  const normalizedSeed = `${seed}:${sequence ?? 'x'}`;
  const hash = hashString(normalizedSeed);
  const preferredIndex = typeof sequence === 'number' && sequence > 0 ? sequence - 1 : hash;
  const baseOffset = STABLE_OFFSETS_KM[preferredIndex % STABLE_OFFSETS_KM.length];

  const northDriftKm = ((hash % 17) - 8) * 0.06;
  const eastDriftKm = (((Math.floor(hash / 17)) % 17) - 8) * 0.06;

  return offsetFromCenter(baseOffset.northKm + northDriftKm, baseOffset.eastKm + eastDriftKm);
}

function offsetFromCenter(northKm: number, eastKm: number): LatLngLiteral {
  const latOffset = northKm / 111;
  const lngOffset = eastKm / (111 * Math.cos((CHANDANAGAR_CENTER.lat * Math.PI) / 180));

  return {
    lat: Number((CHANDANAGAR_CENTER.lat + latOffset).toFixed(6)),
    lng: Number((CHANDANAGAR_CENTER.lng + lngOffset).toFixed(6)),
  };
}

function isValidCoordinate(value: number | null): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}
