import { DeliveryMapStopViewModel, RouteStatsViewModel } from './map-view.util';
import { CHANDANAGAR_CENTER, LatLngLiteral } from './mock-coordinates.util';

export function orderStopsForRoute(stops: DeliveryMapStopViewModel[]): DeliveryMapStopViewModel[] {
  const sequencedStops = stops.filter((stop) => typeof stop.sequence === 'number');
  const unsequencedStops = stops.filter((stop) => typeof stop.sequence !== 'number');

  const ordered = [...sequencedStops].sort((left, right) => {
    const sequenceDelta = (left.sequence ?? 0) - (right.sequence ?? 0);
    if (sequenceDelta !== 0) {
      return sequenceDelta;
    }
    return left.customerName.localeCompare(right.customerName);
  });

  const nearestFirst = buildNearestFirstRoute(unsequencedStops, CHANDANAGAR_CENTER);
  return [...ordered, ...nearestFirst].map((stop, index) => ({
    ...stop,
    routeOrder: index + 1,
  }));
}

export function buildRouteStats(stops: DeliveryMapStopViewModel[]): RouteStatsViewModel {
  const totalStops = stops.length;
  const completedStops = stops.filter((stop) => stop.status === 'delivered').length;
  const pendingStops = totalStops - completedStops;
  const totalDistanceKm = calculateRouteDistance(
    stops.map((stop) => ({
      lat: stop.lat ?? CHANDANAGAR_CENTER.lat,
      lng: stop.lng ?? CHANDANAGAR_CENTER.lng,
    }))
  );

  return {
    totalStops,
    completedStops,
    pendingStops,
    totalDistanceKm,
    estimatedEtaMinutes: estimateRouteEtaMinutes(totalDistanceKm, pendingStops),
  };
}

export function calculateRouteDistance(points: LatLngLiteral[]): number {
  if (points.length < 2) {
    return 0;
  }

  let total = 0;
  for (let index = 0; index < points.length - 1; index += 1) {
    total += calculateDistanceKm(points[index], points[index + 1]);
  }
  return total;
}

export function calculateDistanceKm(from: LatLngLiteral, to: LatLngLiteral): number {
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(to.lat - from.lat);
  const deltaLng = toRadians(to.lng - from.lng);
  const fromLat = toRadians(from.lat);
  const toLat = toRadians(to.lat);

  const haversine =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function estimateRouteEtaMinutes(distanceKm: number, remainingStops: number): number {
  const averageSpeedKmh = 22;
  const driveMinutes = (distanceKm / averageSpeedKmh) * 60;
  const serviceMinutes = remainingStops * 6;

  return Math.max(8, Math.round(driveMinutes + serviceMinutes));
}

export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(distanceKm >= 10 ? 0 : 1)} km`;
}

export function formatEta(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes === 0 ? `${hours} hr` : `${hours} hr ${remainingMinutes} min`;
}

function buildNearestFirstRoute(
  stops: DeliveryMapStopViewModel[],
  startPoint: LatLngLiteral
): DeliveryMapStopViewModel[] {
  const remaining = [...stops];
  const ordered: DeliveryMapStopViewModel[] = [];
  let currentPoint = startPoint;

  while (remaining.length > 0) {
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    remaining.forEach((stop, index) => {
      const point = {
        lat: stop.lat ?? CHANDANAGAR_CENTER.lat,
        lng: stop.lng ?? CHANDANAGAR_CENTER.lng,
      };
      const distance = calculateDistanceKm(currentPoint, point);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    const [nextStop] = remaining.splice(nearestIndex, 1);
    ordered.push(nextStop);
    currentPoint = {
      lat: nextStop.lat ?? CHANDANAGAR_CENTER.lat,
      lng: nextStop.lng ?? CHANDANAGAR_CENTER.lng,
    };
  }

  return ordered;
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}
