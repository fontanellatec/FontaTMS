import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state): boolean | UrlTree => {
  const router = inject(Router);
  const authService = inject(AuthService);

  const token = authService.getToken();
  const isAuthenticated = authService.isAuthenticated();

  if (isAuthenticated && token) {
    return true;
  }

  // Backup/restauração rápida caso ocorra concorrência na inicialização do sinal
  const isAuthStorage = localStorage.getItem('isAuthenticated') === 'true' ||
                        sessionStorage.getItem('isAuthenticated') === 'true';
  if (token && isAuthStorage) {
    return true;
  }

  // Limpa estados inconsistentes (ex: flag ativa sem token) e redireciona
  authService.logout();
  return router.parseUrl('/login');
};