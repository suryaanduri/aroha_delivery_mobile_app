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

  if (normalized === 'ASSIGNED') return 'assigned';
  if (normalized === 'DELIVERED' || normalized === 'COMPLETED') return 'delivered';
  if (normalized === 'IN_PROGRESS' || normalized === 'IN-PROGRESS' || normalized === 'STARTED') return 'in-progress';
  if (normalized === 'CANCELLED' || normalized === 'CANCELED') return 'cancelled';
  if (normalized === 'FAILED') return 'failed';
  if (normalized === 'SKIPPED') return 'skipped';

  return 'pending';
}

export function isTerminalStatus(status?: string): boolean {
  const s = normalizeDeliveryStatus(status);
  return s === 'delivered' || s === 'cancelled' || s === 'failed' || s === 'skipped';
}

export function normalizeScheduleType(type?: string): ScheduleType {
  if (!type) return 'daily';

  const normalized = type.toLowerCase().replace(/_/g, '-');
  if (normalized.includes('alternate')) return 'alternate-day';
  if (normalized === 'onetime' || (normalized.includes('one') && normalized.includes('time'))) return 'one-time';

  return 'daily';
}

export function formatDeliveryStatusLabel(status?: string): string {
  if (!status || !status.trim()) return '';

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
    address: order.address?.trim() || 'Location not available',
    landmark: order.landmark ?? '',
    routeLabel: order.routeLabel ?? `Stop ${String(sequence).padStart(2, '0')}`,
    scheduleType: normalizeScheduleType(order.scheduleType),
    status: normalizeDeliveryStatus(deliveryStatusValue),
    deliveryStatusLabel: formatDeliveryStatusLabel(deliveryStatusValue),
    orderStatusLabel: formatDeliveryStatusLabel(order.orderStatus),
    productSummary: getProductSummary(order, items.length),
    timeSlot: order.timeSlot ?? '',
    sequenceLabel: `#${String(sequence).padStart(2, '0')}`,
    items,
  };
}

export function formatProductCountLabel(count: number): string {
  return `${count} product${count !== 1 ? 's' : ''}`;
}

/** Short line items preview for lists ("2 Milk, 1 Bread +3 more"). */
export function formatOrderItemsPreview(order: DeliveryOrder): string {
  const items = order.items;
  if (!items?.length) {
    return order.productSummary?.trim() ?? '';
  }
  const head = items
    .slice(0, 2)
    .map((i) => `${i.quantity} ${i.name}`)
    .join(', ');
  const more = items.length - 2;
  return more > 0 ? `${head} +${more} more` : head;
}

function getProductSummary(order: DeliveryOrder, itemCountFromItems: number): string {
  if (order.productSummary?.trim()) {
    return order.productSummary.trim();
  }

  if (typeof order.itemCount === 'number') {
    return formatProductCountLabel(order.itemCount);
  }

  return formatProductCountLabel(itemCountFromItems);
}
