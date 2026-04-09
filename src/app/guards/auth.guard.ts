import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  auth.initializeAuth();

  if (!auth.isLoggedIn) {
    return router.createUrlTree(['/login']);
  }

  if (auth.mustResetPassword) {
    return router.createUrlTree(['/reset-password']);
  }

  return true;
};

export const resetPasswordGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  auth.initializeAuth();

  if (!auth.isLoggedIn) {
    return router.createUrlTree(['/login']);
  }

  if (!auth.mustResetPassword) {
    return router.createUrlTree(['/dashboard']);
  }

  return true;
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  auth.initializeAuth();

  if (!auth.isLoggedIn) {
    return true;
  }

  return router.parseUrl(auth.getPostAuthRedirectUrl());
};
