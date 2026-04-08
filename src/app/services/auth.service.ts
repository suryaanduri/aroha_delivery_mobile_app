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
  user?: AuthUser;
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
      const { data, message } = unwrapApiSuccess<LoginData | Record<string, unknown>>(res, 'Login successful');
      const root = res as Record<string, unknown>;

      const user = this.extractLoginUser(res, data);
      if (!user) {
        throw new Error('Invalid login response from server');
      }

      return {
        success: true,
        message,
        mustResetPassword: this.extractMustResetPassword(root, data),
        user,
      };
    }

    // Backward compatibility with old direct LoginResponse payload.
    return res as LoginResponse;
  }

  /**
   * Tries `data.user`, then user-shaped `data` (flat), then top-level `user`.
   * Temporary-password / must-reset responses often omit `data.user` or put fields on `data` directly.
   */
  private extractLoginUser(res: unknown, data: unknown): AuthUser | null {
    const root = res && typeof res === 'object' ? (res as Record<string, unknown>) : {};

    if (data && typeof data === 'object' && data !== null) {
      const d = data as Record<string, unknown>;
      const fromNested = this.normalizeAuthUser(d['user']);
      if (fromNested) {
        return fromNested;
      }
      const fromFlat = this.normalizeAuthUser(d);
      if (fromFlat) {
        return fromFlat;
      }
    }

    return this.normalizeAuthUser(root['user']);
  }

  private extractMustResetPassword(root: Record<string, unknown>, data: unknown): boolean {
    if (typeof root['mustResetPassword'] === 'boolean') {
      return root['mustResetPassword'];
    }
    if (data && typeof data === 'object' && data !== null && 'mustResetPassword' in data) {
      return Boolean((data as LoginData).mustResetPassword);
    }
    return false;
  }

  /** Accepts nested `data.user`, top-level `user`, or `data` shaped like a user (common for must-reset flows). */
  private normalizeAuthUser(raw: unknown): AuthUser | null {
    if (raw === null || raw === undefined) {
      return null;
    }
    if (typeof raw !== 'object') {
      return null;
    }
    const o = raw as Record<string, unknown>;
    const id = o['id'] != null ? String(o['id']) : '';
    const email = o['email'] != null ? String(o['email']) : '';
    const username =
      o['username'] != null ? String(o['username']) : o['userName'] != null ? String(o['userName']) : email;
    const name =
      o['name'] != null ? String(o['name']) : o['fullName'] != null ? String(o['fullName']) : username;
    const role = o['role'] != null ? String(o['role']) : '';

    if (!id && !email && !username) {
      return null;
    }

    return { id, email, username, name, role };
  }
}
