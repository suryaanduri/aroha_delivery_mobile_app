import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { unwrapApiSuccess } from '../utils/api-contract.util';

export interface DeliveryPersonProfile {
  id: string;
  name: string;
  email: string;
  mobile: string;
  username: string;
  assignedArea: string;
  status: string;
  createdAt: string;
}

export interface UpdateProfilePayload {
  name?: string;
  email?: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly baseUrl = `${environment.apiBaseUrl}${environment.authPrefix}`;

  constructor(private readonly http: HttpClient) {}

  getMyProfile(): Observable<DeliveryPersonProfile> {
    return this.http.get<unknown>(`${this.baseUrl}/me`).pipe(
      map((res) => {
        const { data } = unwrapApiSuccess<DeliveryPersonProfile>(res, 'Profile loaded');
        if (!data) throw new Error('Profile data missing');
        return data;
      })
    );
  }

  updateMyProfile(payload: UpdateProfilePayload): Observable<DeliveryPersonProfile> {
    return this.http.patch<unknown>(`${this.baseUrl}/me`, payload).pipe(
      map((res) => {
        const { data } = unwrapApiSuccess<DeliveryPersonProfile>(res, 'Profile updated');
        if (!data) throw new Error('Profile data missing');
        return data;
      })
    );
  }
}
