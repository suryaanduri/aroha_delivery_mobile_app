import { DeliveryOrder } from '../models/order.model';

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getMockDeliveryOrders(): DeliveryOrder[] {
  const deliveryDate = todayIsoDate();

  return [
    {
      id: 'demo-stop-1',
      customerName: 'Green Valley Residency',
      customerCode: 'AF-1042',
      address: '12 Lake View Road, Coimbatore',
      landmark: 'Near East Gate',
      routeLabel: 'Morning Route',
      scheduleType: 'daily',
      status: 'PENDING',
      deliveryStatus: 'PENDING',
      orderStatus: 'CONFIRMED',
      deliveryDate,
      timeSlot: '06:30 AM - 07:00 AM',
      sequence: 1,
      notes: 'Leave the bottles in the insulated crate near the security desk.',
      items: [
        { name: 'A2 Cow Milk', quantity: '2', unit: 'L' },
        { name: 'Fresh Curd', quantity: '1', unit: 'Tub' },
        { name: 'Paneer', quantity: '250', unit: 'g' },
      ],
    },
    {
      id: 'demo-stop-2',
      customerName: 'Maya Narayanan',
      customerCode: 'AF-2187',
      address: '44 Park Avenue, RS Puram',
      landmark: 'Opp. Bakery Corner',
      routeLabel: 'Morning Route',
      scheduleType: 'alternate_day',
      status: 'IN_PROGRESS',
      deliveryStatus: 'IN_PROGRESS',
      orderStatus: 'PACKED',
      deliveryDate,
      timeSlot: '07:00 AM - 07:30 AM',
      sequence: 2,
      notes: 'Customer prefers a quick handoff at the gate before 7:20 AM.',
      items: [
        { name: 'Buffalo Milk', quantity: '1', unit: 'L' },
        { name: 'Ghee', quantity: '500', unit: 'ml' },
      ],
    },
    {
      id: 'demo-stop-3',
      customerName: 'Apex Fitness Studio',
      customerCode: 'AF-3321',
      address: '9 Cross Cut Road, Gandhipuram',
      landmark: 'Behind City Pharmacy',
      routeLabel: 'Central Route',
      scheduleType: 'daily',
      status: 'PENDING',
      deliveryStatus: 'PENDING',
      orderStatus: 'CONFIRMED',
      deliveryDate,
      timeSlot: '07:30 AM - 08:00 AM',
      sequence: 3,
      notes: 'Drop at reception and ask for the morning shift manager.',
      items: [
        { name: 'Skim Milk', quantity: '4', unit: 'L' },
        { name: 'Greek Yogurt', quantity: '6', unit: 'Cups' },
        { name: 'Butter', quantity: '2', unit: 'Packs' },
        { name: 'Paneer', quantity: '500', unit: 'g' },
      ],
    },
    {
      id: 'demo-stop-4',
      customerName: 'Latha Traders',
      customerCode: 'AF-4176',
      address: '88 Mettupalayam Road, Sai Baba Colony',
      landmark: 'Next to Petrol Bunk',
      routeLabel: 'Central Route',
      scheduleType: 'one_time',
      status: 'DELIVERED',
      deliveryStatus: 'DELIVERED',
      orderStatus: 'COMPLETED',
      deliveryDate,
      timeSlot: '08:00 AM - 08:20 AM',
      sequence: 4,
      notes: 'Delivered successfully to the store manager.',
      items: [
        { name: 'Full Cream Milk', quantity: '3', unit: 'L' },
        { name: 'Fresh Curd', quantity: '2', unit: 'Tubs' },
      ],
    },
  ];
}

export function getMockDeliveryOrderById(orderId: string): DeliveryOrder | null {
  return getMockDeliveryOrders().find((order) => order.id === orderId) ?? null;
}
