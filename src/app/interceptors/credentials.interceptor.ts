import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from '../services/auth.service';

export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const apiBaseUrl = environment.apiBaseUrl.trim();

  auth.initializeAuth();

  const isApiRequest = isApiRequestUrl(req.url, apiBaseUrl);
  const isPublicAuthRequest =
    req.url.includes('/credential-login') ||
    req.url.includes('/forgot-password');

  let request = req;

  if (isApiRequest) {
    request = request.clone({ withCredentials: true });
  }

  const token = auth.token;
  if (isApiRequest && token && !isPublicAuthRequest) {
    request = request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(request).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        isApiRequest &&
        !isPublicAuthRequest
      ) {
        auth.handleUnauthorized();
      }

      return throwError(() => error);
    })
  );
};

function isApiRequestUrl(url: string, apiBaseUrl: string): boolean {
  if (apiBaseUrl.length > 0 && url.startsWith(apiBaseUrl)) {
    return true;
  }

  return url.startsWith('/api/') || url.startsWith('api/');
}
