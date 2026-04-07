import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  ApiSuccessResponse,
  AuthUser,
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponse,
  ResetPasswordRequest,
} from '../models/auth.model';
import { unwrapApiSuccess } from '../utils/api-contract.util';

interface LoginData {
  user: AuthUser;
  mustResetPassword?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly baseUrl = `${environment.apiBaseUrl}${environment.authPrefix}`;
  private currentUser: AuthUser | null = null;
  private _mustResetPassword = false;

  constructor(private readonly http: HttpClient) {}

  get user(): AuthUser | null {
    return this.currentUser;
  }

  get isLoggedIn(): boolean {
    return this.currentUser !== null;
  }

  get mustResetPassword(): boolean {
    return this._mustResetPassword;
  }

  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<unknown>(`${this.baseUrl}/credential-login`, payload)
      .pipe(
        map((res) => this.mapLoginResponse(res)),
        tap((res) => {
          if (res.success) {
            this.currentUser = res.user;
            this._mustResetPassword = res.mustResetPassword;
          }
        })
      );
  }

  resetPassword(payload: ResetPasswordRequest): Observable<ApiSuccessResponse> {
    return this.http
      .post<unknown>(`${this.baseUrl}/reset-password`, payload)
      .pipe(
        map((res) => unwrapApiSuccess<unknown>(res, 'Password updated')),
        map((result) => ({
          success: true,
          message: result.message,
        })),
        tap((res) => {
          if (res.success) {
            this._mustResetPassword = false;
          }
        })
      );
  }

  forgotPassword(payload: ForgotPasswordRequest): Observable<ApiSuccessResponse> {
    return this.http
      .post<unknown>(`${this.baseUrl}/forgot-password`, payload)
      .pipe(
        map((res) => unwrapApiSuccess<unknown>(res, 'Temporary password sent')),
        map((result) => ({
          success: true,
          message: result.message,
        }))
      );
  }

  logout(): void {
    this.currentUser = null;
    this._mustResetPassword = false;
  }

  private mapLoginResponse(res: unknown): LoginResponse {
    if (res && typeof res === 'object' && 'success' in (res as Record<string, unknown>)) {
      const { data, message } = unwrapApiSuccess<LoginData>(res, 'Login successful');
      if (!data?.user) {
        throw new Error('Invalid login response from server');
      }
      return {
        success: true,
        message,
        mustResetPassword: Boolean(data?.mustResetPassword),
        user: data.user,
      };
    }

    // Backward compatibility with old direct LoginResponse payload.
    return res as LoginResponse;
  }
}
