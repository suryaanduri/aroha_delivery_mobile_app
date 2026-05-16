import { HttpErrorResponse, HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from '../services/auth.service';

export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  auth.initializeAuth();

  const apiBaseUrl = environment.apiBaseUrl.trim();
  const isApiRequest = isApiUrl(req.url, apiBaseUrl);
  const isPublicRoute = req.url.includes('/credential-login') || req.url.includes('/forgot-password');
  const isRefreshRoute = req.url.includes('/refreshToken');

  const outgoing = attachCredentials(req, auth.token, isApiRequest, isPublicRoute);

  return next(outgoing).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        isApiRequest &&
        !isPublicRoute &&
        !isRefreshRoute &&
        auth.storedRefreshToken
      ) {
        // Silent token refresh — retry original request once with new token
        return auth.refreshAccessToken().pipe(
          switchMap(() => {
            const retried = attachCredentials(req, auth.token, isApiRequest, false);
            return next(retried);
          }),
          catchError((refreshError: unknown) => {
            // Refresh failed — session is truly expired, log out
            auth.handleUnauthorized();
            return throwError(() => refreshError);
          }),
        );
      }

      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        isApiRequest &&
        !isPublicRoute &&
        !auth.storedRefreshToken
      ) {
        // No refresh token stored — log out immediately
        auth.handleUnauthorized();
      }

      return throwError(() => error);
    }),
  );
};

function attachCredentials(
  req: HttpRequest<unknown>,
  token: string | null,
  isApiRequest: boolean,
  isPublicRoute: boolean,
): HttpRequest<unknown> {
  if (!isApiRequest) return req;

  let request = req.clone({ withCredentials: true });

  if (token && !isPublicRoute) {
    request = request.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return request;
}

function isApiUrl(url: string, apiBaseUrl: string): boolean {
  if (apiBaseUrl.length > 0 && url.startsWith(apiBaseUrl)) return true;
  return url.startsWith('/api/') || url.startsWith('api/');
}
