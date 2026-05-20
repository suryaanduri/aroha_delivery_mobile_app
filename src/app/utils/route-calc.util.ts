import { DeliveryStatus } from '../components/status-chip/status-chip.component';
import { DeliveryMapStopViewModel, RouteStatsViewModel } from './map-view.util';
import { CHANDANAGAR_CENTER, LatLngLiteral } from './mock-coordinates.util';

// ── Shared stop shape required for optimization ────────────────────────────

interface OptimizableStop {
  id: string;
  lat: number | null;
  lng: number | null;
  status: DeliveryStatus;
}

// ── GPS helper ─────────────────────────────────────────────────────────────

/**
 * Returns the driver's current GPS position.
 * Falls back to CHANDANAGAR_CENTER when permissions are denied or timeout fires.
 */
export function getDriverLocation(): Promise<LatLngLiteral> {
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(CHANDANAGAR_CENTER),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 },
    );
  });
}

// ── Route optimization (Nearest-Neighbor heuristic) ───────────────────────

/**
 * Optimizes a list of stops using the Nearest-Neighbor heuristic.
 *
 * - Only PENDING stops (assigned / pending / in-progress) are reordered.
 * - Already-terminal stops (delivered / cancelled / skipped / failed) are
 *   appended at the end, sorted by their original routeOrder/sequence.
 * - Returns a NEW array with `routeOrder` rewritten from 1.
 */
export function optimizeStopsFromLocation<T extends OptimizableStop & { routeOrder?: number }>(
  stops: T[],
  startPoint: LatLngLiteral,
): T[] {
  const TERMINAL: DeliveryStatus[] = ['delivered', 'cancelled', 'skipped', 'failed'];

  const pending = stops.filter((s) => !TERMINAL.includes(s.status));
  const terminal = stops.filter((s) => TERMINAL.includes(s.status));

  const optimized = nearestNeighbor(pending, startPoint);
  const terminalSorted = [...terminal].sort(
    (a, b) => (a.routeOrder ?? 99) - (b.routeOrder ?? 99),
  );

  return [...optimized, ...terminalSorted].map((stop, index) => ({
    ...stop,
    routeOrder: index + 1,
  }));
}

function nearestNeighbor<T extends OptimizableStop>(
  stops: T[],
  startPoint: LatLngLiteral,
): T[] {
  const remaining = [...stops];
  const ordered: T[] = [];
  let current = startPoint;

  while (remaining.length > 0) {
    let nearestIdx = 0;
    let nearestDist = Infinity;

    remaining.forEach((stop, idx) => {
      const pt = stopCoord(stop);
      const dist = calculateDistanceKm(current, pt);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIdx = idx;
      }
    });

    const [next] = remaining.splice(nearestIdx, 1);
    ordered.push(next);
    current = stopCoord(next);
  }

  return ordered;
}

function stopCoord(stop: OptimizableStop): LatLngLiteral {
  return {
    lat: typeof stop.lat === 'number' ? stop.lat : CHANDANAGAR_CENTER.lat,
    lng: typeof stop.lng === 'number' ? stop.lng : CHANDANAGAR_CENTER.lng,
  };
}

// ── Per-stop ETA enrichment (list view) ──────────────────────────────────

interface EtaEnrichable {
  lat: number | null;
  lng: number | null;
  status: string;
  estimatedArrival?: string;
  distanceFromPrev?: string;
}

/**
 * Walks the optimized stop list in order, computing cumulative drive time and
 * estimated arrival clock-time for every pending stop.
 * Terminal stops (delivered / cancelled / skipped / failed) are left unchanged.
 */
export function enrichStopsWithETA<T extends EtaEnrichable>(
  stops: T[],
  driverLocation: LatLngLiteral,
): T[] {
  const TERMINAL = new Set(['delivered', 'cancelled', 'skipped', 'failed']);
  let nowMs = Date.now();
  let currentLoc = driverLocation;

  return stops.map((stop) => {
    if (TERMINAL.has(stop.status)) return stop;

    const stopLoc: LatLngLiteral = {
      lat: typeof stop.lat === 'number' ? stop.lat : driverLocation.lat,
      lng: typeof stop.lng === 'number' ? stop.lng : driverLocation.lng,
    };

    const distKm = calculateDistanceKm(currentLoc, stopLoc);
    const driveMs = (distKm / 22) * 3_600_000; // 22 km/h urban average
    const serviceMs = 6 * 60_000;               // 6 min per stop
    nowMs += driveMs + serviceMs;
    currentLoc = stopLoc;

    const eta = new Date(nowMs);
    const hh = eta.getHours();
    const mm = eta.getMinutes().toString().padStart(2, '0');
    const label = `${hh % 12 || 12}:${mm} ${hh >= 12 ? 'PM' : 'AM'}`;
    const distLabel = distKm < 1
      ? `${Math.round(distKm * 1000)} m`
      : `~${distKm.toFixed(1)} km`;

    return { ...stop, estimatedArrival: label, distanceFromPrev: distLabel };
  });
}

// ── Map-page helpers (kept for DeliveryMapStopViewModel) ──────────────────

export function orderStopsForRoute(
  stops: DeliveryMapStopViewModel[],
  startPoint: LatLngLiteral = CHANDANAGAR_CENTER,
): DeliveryMapStopViewModel[] {
  return optimizeStopsFromLocation(stops, startPoint);
}

export function buildRouteStats(stops: DeliveryMapStopViewModel[]): RouteStatsViewModel {
  const totalStops = stops.length;
  const completedStops = stops.filter((s) => s.status === 'delivered').length;
  const pendingStops = totalStops - completedStops;

  const pendingCoords = stops
    .filter((s) => !['delivered', 'cancelled', 'skipped', 'failed'].includes(s.status))
    .map((s) => ({
      lat: s.lat ?? CHANDANAGAR_CENTER.lat,
      lng: s.lng ?? CHANDANAGAR_CENTER.lng,
    }));

  const totalDistanceKm = calculateRouteDistance(pendingCoords);

  return {
    totalStops,
    completedStops,
    pendingStops,
    totalDistanceKm,
    estimatedEtaMinutes: estimateRouteEtaMinutes(totalDistanceKm, pendingStops),
  };
}

// ── Distance / geometry ───────────────────────────────────────────────────

export function calculateRouteDistance(points: LatLngLiteral[]): number {
  if (points.length < 2) return 0;

  let total = 0;
  for (let i = 0; i < points.length - 1; i += 1) {
    total += calculateDistanceKm(points[i], points[i + 1]);
  }
  return total;
}

export function calculateDistanceKm(from: LatLngLiteral, to: LatLngLiteral): number {
  const R = 6371;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2;

  // 1.4× road-to-straight-line factor for urban India
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 1.4;
}

export function estimateRouteEtaMinutes(distanceKm: number, remainingStops: number): number {
  const driveMinutes = (distanceKm / 22) * 60; // 22 km/h urban average
  const serviceMinutes = remainingStops * 6;    // 6 min per stop handoff
  return Math.max(8, Math.round(driveMinutes + serviceMinutes));
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(km >= 10 ? 0 : 1)} km`;
}

export function formatEta(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
