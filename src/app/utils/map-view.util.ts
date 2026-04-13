import { DeliveryStatus, ScheduleType } from '../components/status-chip/status-chip.component';
import { DeliveryOrder } from '../models/order.model';
import { formatDeliveryStatusLabel, normalizeDeliveryStatus, normalizeScheduleType } from './delivery-view.util';

export interface DeliveryMapStopViewModel {
  id: string;
  orderId: string;
  customerName: string;
  address: string;
  landmark: string;
  routeLabel: string;
  area: string;
  sequence: number | null;
  routeOrder: number;
  timeSlot: string;
  scheduleType: ScheduleType;
  status: DeliveryStatus;
  deliveryStatusLabel: string;
  orderStatusLabel: string;
  itemCount: number;
  productSummary: string;
  lat: number | null;
  lng: number | null;
}

export interface RouteStatsViewModel {
  totalStops: number;
  completedStops: number;
  pendingStops: number;
  totalDistanceKm: number;
  estimatedEtaMinutes: number;
}

export function mapOrderToDeliveryMapStopViewModel(order: DeliveryOrder, index = 0): DeliveryMapStopViewModel {
  const routeSequence = typeof order.sequence === 'number' && Number.isFinite(order.sequence) ? order.sequence : null;
  const deliveryStatusValue = order.deliveryStatus ?? order.status ?? '';

  return {
    id: order.id ?? order.orderId ?? String(index),
    orderId: order.orderId?.trim() || order.id || String(index),
    customerName: order.customerName?.trim() || 'Customer',
    address: order.address?.trim() || 'Address unavailable',
    landmark: order.landmark?.trim() || '',
    routeLabel: order.routeLabel?.trim() || '',
    area: order.area?.trim() || '',
    sequence: routeSequence,
    routeOrder: routeSequence ?? index + 1,
    timeSlot: order.timeSlot?.trim() || '',
    scheduleType: normalizeScheduleType(order.scheduleType),
    status: normalizeDeliveryStatus(deliveryStatusValue),
    deliveryStatusLabel: formatDeliveryStatusLabel(deliveryStatusValue),
    orderStatusLabel: formatDeliveryStatusLabel(order.orderStatus),
    itemCount: getItemCount(order),
    productSummary: getProductSummary(order),
    lat: getFiniteCoordinate(order.location?.lat),
    lng: getFiniteCoordinate(order.location?.lng),
  };
}

function getFiniteCoordinate(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function getItemCount(order: DeliveryOrder): number {
  if (typeof order.itemCount === 'number' && Number.isFinite(order.itemCount)) {
    return order.itemCount;
  }

  return order.items?.length ?? 0;
}

function getProductSummary(order: DeliveryOrder): string {
  if (order.productSummary?.trim()) {
    return order.productSummary.trim();
  }

  const itemCount = getItemCount(order);
  return `${itemCount} product${itemCount === 1 ? '' : 's'}`;
}
