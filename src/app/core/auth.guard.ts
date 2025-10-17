import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';

export const authGuard: CanActivateFn = (route, state): boolean | UrlTree => {
  const router = inject(Router);
  const isAuthenticated =
    localStorage.getItem('isAuthenticated') === 'true' ||
    sessionStorage.getItem('isAuthenticated') === 'true';

  if (!isAuthenticated) {
    return router.parseUrl('/login');
  }
  return true;
};