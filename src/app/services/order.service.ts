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

interface OrderDataPayload {
  order?: DeliveryOrder;
}

export interface GetOrdersFilters {
  status?: string;
  deliveryDate?: string;
  lat?: number;
  lng?: number;
  page?: number;
  limit?: number;
}

export const STATIC_DELIVERY_ORDERS_QUERY: Readonly<Required<Pick<GetOrdersFilters, 'lat' | 'lng' | 'page' | 'limit'>>> =
  {
    lat: 17.492105,
    lng: 78.327663,
    page: 1,
    limit: 20,
  };

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

  getOrders(filters?: GetOrdersFilters): Observable<DeliveryOrder[]> {
    let params = new HttpParams();
    if (filters?.status) {
      params = params.set('status', filters.status);
    }
    if (filters?.deliveryDate) {
      params = params.set('deliveryDate', filters.deliveryDate);
    }
    if (typeof filters?.lat === 'number') {
      params = params.set('lat', String(filters.lat));
    }
    if (typeof filters?.lng === 'number') {
      params = params.set('lng', String(filters.lng));
    }
    if (typeof filters?.page === 'number') {
      params = params.set('page', String(filters.page));
    }
    if (typeof filters?.limit === 'number') {
      params = params.set('limit', String(filters.limit));
    }
    return this.http.get<unknown>(`${this.baseUrl}/orders`, { params }).pipe(map((res) => this.extractOrders(res)));
  }

  getOrderById(orderId: string, filters?: { deliveryDate?: string }): Observable<DeliveryOrder | null> {
    return this.http
      .get<unknown>(`${this.baseUrl}/orders/${orderId}`)
      .pipe(map((res) => this.extractOrder(res)));
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

  private extractOrder(res: unknown): DeliveryOrder | null {
    const { data } = unwrapApiSuccess<OrderDataPayload | DeliveryOrder | undefined>(res, 'Order loaded');
    return this.extractOrderValue(data);
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

  private extractOrderValue(data: OrderDataPayload | DeliveryOrder | undefined): DeliveryOrder | null {
    if (!data || typeof data !== 'object') {
      return null;
    }

    if (this.looksLikeOrder(data)) {
      return data as DeliveryOrder;
    }

    const payload = data as Record<string, unknown>;
    for (const key of ['order', 'data', 'result', 'content']) {
      const value = payload[key];
      if (this.looksLikeOrder(value)) {
        return value as DeliveryOrder;
      }
    }

    return null;
  }

  private looksLikeOrder(value: unknown): value is DeliveryOrder {
    return !!value && typeof value === 'object' && ('id' in value || 'orderId' in value);
  }
}
