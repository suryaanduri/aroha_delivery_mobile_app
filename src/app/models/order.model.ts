export interface OrderItem {
  name: string;
  quantity: number | string;
  unit?: string;
  type?: string;
}

export interface ReturnableBottle {
  id: string;
  userId: string;
  orderId: string;
  variantId: string;
  quantity: number;
  deliveryDate: string;
  expectedReturnDate: string | null;
  status: 'PENDING' | 'RETURNED' | 'DAMAGED' | 'LOST';
  variant?: {
    variantLabel: string;
    sku: string;
    images: string[];
    bottleType: string;
    product?: { name: string };
  };
}

export interface DeliveryOrder {
  id: string;
  orderId?: string;
  userId?: string;
  customerName: string;
  customerCode?: string;
  customerPhone?: string;
  address: string;
  landmark?: string;
  area?: string;
  routeLabel?: string;
  scheduleType?: string;
  status?: string;
  deliveryStatus?: string;
  orderStatus?: string;
  deliveryDate: string;
  timeSlot?: string;
  itemCount?: number;
  productSummary?: string;
  location?: {
    lat?: number | null;
    lng?: number | null;
  };
  items?: OrderItem[];
  notes?: string;
  sequence?: number;
  cancelReason?: string;
  deliveryProofImage?: string;
  deliveryNotes?: string;
}
