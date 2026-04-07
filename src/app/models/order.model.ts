export interface OrderItem {
  name: string;
  quantity: number | string;
  unit?: string;
  type?: string;
}

export interface DeliveryOrder {
  id: string;
  orderId?: string;
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
  items: OrderItem[];
  notes?: string;
  sequence?: number;
}
