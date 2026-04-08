import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { DeliveryOrder } from '../models/order.model';
import { ApiSuccessResponse } from '../models/auth.model';
import { unwrapApiSuccess } from '../utils/api-contract.util';

interface OrdersDataPayload {
  orders?: DeliveryOrder[];
}

export interface UpdateOrderStatusPayload {
  status: 'DELIVERED' | 'CANCELLED' | 'SKIPPED';
  reason?: string;
  proofImage?: string;
  notes?: string;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly baseUrl = `${environment.apiBaseUrl}/api/order/delivery`;

  constructor(private readonly http: HttpClient) {}

  getOrders(filters?: { status?: string; deliveryDate?: string }): Observable<DeliveryOrder[]> {
    let params = new HttpParams();
    if (filters?.status) {
      params = params.set('status', filters.status);
    }
    if (filters?.deliveryDate) {
      params = params.set('deliveryDate', filters.deliveryDate);
    }
    return this.http.get<unknown>(`${this.baseUrl}/orders`, { params }).pipe(map((res) => this.extractOrders(res)));
  }

  getOrderById(orderId: string, filters?: { deliveryDate?: string }): Observable<DeliveryOrder | null> {
    return this.getOrders(filters).pipe(
      map((orders) => orders.find((order) => this.getOrderId(order) === orderId) ?? null)
    );
  }

  updateOrderStatus(orderId: string, payload: UpdateOrderStatusPayload): Observable<ApiSuccessResponse> {
    return this.http
      .put<unknown>(`${this.baseUrl}/orders/${orderId}/status`, payload)
      .pipe(
        map((res) => unwrapApiSuccess<unknown>(res, 'Status updated successfully')),
        map((result) => ({
          success: true,
          message: result.message,
        }))
      );
  }

  private extractOrders(res: unknown): DeliveryOrder[] {
    const { data } = unwrapApiSuccess<OrdersDataPayload | DeliveryOrder[]>(res, 'Orders loaded');
    return this.extractOrdersArray(data);
  }

  private extractOrdersArray(data: OrdersDataPayload | DeliveryOrder[] | undefined): DeliveryOrder[] {
    if (Array.isArray(data)) {
      return data;
    }
    if (!data || typeof data !== 'object') {
      return [];
    }

    const payload = data as Record<string, unknown>;
    if (Array.isArray(payload['orders'])) {
      return payload['orders'] as DeliveryOrder[];
    }
    for (const key of ['data', 'results', 'content']) {
      const value = payload[key];
      if (Array.isArray(value)) {
        return value as DeliveryOrder[];
      }
      if (value && typeof value === 'object' && Array.isArray((value as { orders?: unknown }).orders)) {
        return (value as { orders: DeliveryOrder[] }).orders;
      }
    }
    return [];
  }

  private getOrderId(order: DeliveryOrder): string {
    return order.id ?? order.orderId ?? '';
  }
}
