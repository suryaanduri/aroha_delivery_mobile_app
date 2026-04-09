import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import {
  ApiSuccessResponse,
  AuthUser,
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponse,
  ResetPasswordRequest,
  StoredAuthSession,
} from '../models/auth.model';
import { unwrapApiSuccess } from '../utils/api-contract.util';

interface LoginData {
  user?: AuthUser;
  mustResetPassword?: boolean;
  token?: string;
  accessToken?: string;
  jwt?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private static readonly STORAGE_KEY = 'aroha.auth.session';
  private readonly baseUrl = `${environment.apiBaseUrl}${environment.authPrefix}`;
  private currentUser: AuthUser | null = null;
  private _mustResetPassword = false;
  private accessToken: string | null = null;
  private initialized = false;

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router
  ) {}

  get user(): AuthUser | null {
    return this.currentUser;
  }

  get isLoggedIn(): boolean {
    return this.currentUser !== null;
  }

  get hasInitialized(): boolean {
    return this.initialized;
  }

  get mustResetPassword(): boolean {
    return this._mustResetPassword;
  }

  get token(): string | null {
    return this.accessToken;
  }

  initializeAuth(): void {
    if (this.initialized) {
      return;
    }

    this.initialized = true;

    const storage = this.getStorage();
    if (!storage) {
      return;
    }

    const raw = storage.getItem(AuthService.STORAGE_KEY);
    if (!raw) {
      return;
    }

    try {
      const stored = JSON.parse(raw) as Partial<StoredAuthSession>;
      const user = this.normalizeAuthUser(stored.user);

      if (!user) {
        this.clearPersistedSession();
        return;
      }

      this.currentUser = user;
      this._mustResetPassword = Boolean(stored.mustResetPassword);
      this.accessToken = typeof stored.accessToken === 'string' && stored.accessToken.trim().length > 0
        ? stored.accessToken
        : null;
    } catch {
      this.clearPersistedSession();
    }
  }

  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<unknown>(`${this.baseUrl}/credential-login`, payload)
      .pipe(
        map((res) => this.mapLoginResponse(res)),
        tap((res) => {
          if (res.success) {
            this.setSession({
              user: res.user,
              mustResetPassword: res.mustResetPassword,
              accessToken: res.accessToken,
            });
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
            this.persistSession();
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
    this.clearSessionState();
    void this.router.navigateByUrl('/login');
  }

  handleUnauthorized(): void {
    this.clearSessionState();
    void this.router.navigateByUrl('/login');
  }

  getPostAuthRedirectUrl(): string {
    return this.mustResetPassword ? '/reset-password' : '/dashboard';
  }

  private setSession(session: StoredAuthSession): void {
    this.currentUser = session.user;
    this._mustResetPassword = session.mustResetPassword;
    this.accessToken = session.accessToken?.trim() ? session.accessToken : null;
    this.persistSession();
  }

  private persistSession(): void {
    const storage = this.getStorage();
    if (!storage || !this.currentUser) {
      return;
    }

    const session: StoredAuthSession = {
      user: this.currentUser,
      mustResetPassword: this._mustResetPassword,
      accessToken: this.accessToken ?? undefined,
    };

    storage.setItem(AuthService.STORAGE_KEY, JSON.stringify(session));
  }

  private clearSessionState(): void {
    this.currentUser = null;
    this._mustResetPassword = false;
    this.accessToken = null;
    this.clearPersistedSession();
  }

  private clearPersistedSession(): void {
    const storage = this.getStorage();
    storage?.removeItem(AuthService.STORAGE_KEY);
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
        accessToken: this.extractAccessToken(root, data),
      };
    }

    // Backward compatibility with old direct LoginResponse payload.
    const response = res as LoginResponse;
    return {
      ...response,
      accessToken: this.extractAccessToken(
        response as unknown as Record<string, unknown>,
        response as unknown
      ),
    };
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

  private extractAccessToken(root: Record<string, unknown>, data: unknown): string | undefined {
    const token = this.findTokenValue(data) ?? this.findTokenValue(root);
    return token?.trim() ? token : undefined;
  }

  private findTokenValue(source: unknown): string | null {
    if (!source || typeof source !== 'object') {
      return null;
    }

    const record = source as Record<string, unknown>;
    for (const key of ['token', 'accessToken', 'jwt']) {
      const value = record[key];
      if (typeof value === 'string' && value.trim().length > 0) {
        return value;
      }
    }

    return null;
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

  private getStorage(): Storage | null {
    return typeof localStorage === 'undefined' ? null : localStorage;
  }
}
