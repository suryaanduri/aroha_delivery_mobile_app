import { DeliveryProductItem } from '../components/product-list/product-list.component';
import { DeliveryStatus, ScheduleType } from '../components/status-chip/status-chip.component';
import { DeliveryOrder } from '../models/order.model';

export interface DeliveryStopViewModel {
  id: string;
  customerName: string;
  customerCode: string;
  address: string;
  landmark: string;
  routeLabel: string;
  scheduleType: ScheduleType;
  status: DeliveryStatus;
  deliveryStatusLabel: string;
  orderStatusLabel: string;
  productSummary: string;
  timeSlot: string;
  sequenceLabel: string;
  items: DeliveryProductItem[];
}

export function normalizeDeliveryStatus(status?: string): DeliveryStatus {
  const normalized = (status ?? '').toUpperCase();

  if (normalized === 'DELIVERED' || normalized === 'COMPLETED') return 'delivered';
  if (normalized === 'IN_PROGRESS' || normalized === 'IN-PROGRESS' || normalized === 'STARTED') return 'in-progress';
  if (normalized === 'CANCELLED' || normalized === 'CANCELED' || normalized === 'FAILED') return 'failed';
  if (normalized === 'SKIPPED') return 'skipped';

  return 'pending';
}

export function normalizeScheduleType(type?: string): ScheduleType {
  if (!type) return 'daily';

  const normalized = type.toLowerCase().replace(/_/g, '-');
  if (normalized.includes('alternate')) return 'alternate-day';
  if (normalized === 'onetime' || (normalized.includes('one') && normalized.includes('time'))) return 'one-time';

  return 'daily';
}

export function formatDeliveryStatusLabel(status?: string): string {
  if (!status || !status.trim()) return 'N/A';

  return status
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function mapOrderItems(order: DeliveryOrder): DeliveryProductItem[] {
  return (order.items ?? []).map((item) => ({
    name: item.name ?? 'Item',
    quantity: [item.quantity, item.unit].filter(Boolean).join(' '),
  }));
}

export function mapOrderToDeliveryStopViewModel(order: DeliveryOrder, index = 0): DeliveryStopViewModel {
  const items = mapOrderItems(order);
  const sequence = order.sequence ?? index + 1;
  const deliveryStatusValue = order.deliveryStatus ?? order.status ?? '';

  return {
    id: order.id ?? order.orderId ?? String(index),
    customerName: order.customerName ?? '',
    customerCode: order.customerCode ?? '',
    address: order.address ?? '',
    landmark: order.landmark ?? '',
    routeLabel: order.routeLabel ?? `Stop ${String(sequence).padStart(2, '0')}`,
    scheduleType: normalizeScheduleType(order.scheduleType),
    status: normalizeDeliveryStatus(deliveryStatusValue),
    deliveryStatusLabel: deliveryStatusValue.trim() || 'N/A',
    orderStatusLabel: order.orderStatus?.trim() || 'N/A',
    productSummary: getProductSummary(order, items.length),
    timeSlot: order.timeSlot ?? '',
    sequenceLabel: `#${String(sequence).padStart(2, '0')}`,
    items,
  };
}

function getProductSummary(order: DeliveryOrder, itemCountFromItems: number): string {
  if (order.productSummary?.trim()) {
    return order.productSummary.trim();
  }

  if (typeof order.itemCount === 'number') {
    return `${order.itemCount} product${order.itemCount !== 1 ? 's' : ''}`;
  }

  return `${itemCountFromItems} product${itemCountFromItems !== 1 ? 's' : ''}`;
}
