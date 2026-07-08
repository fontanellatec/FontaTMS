import { Injectable, Injector } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private injector: Injector) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.getToken();
    const cloned = token ? req.clone({ setHeaders: { Authorization: `${token}` } }) : req;

    return next.handle(cloned).pipe(
      map(event => {
        if (event instanceof HttpResponse) {
          const body = event.body;
          if (body && body.success === false) {
            throw new HttpErrorResponse({
              error: body,
              status: body.status || 400,
              statusText: body.message || 'Erro de Negócio',
              url: event.url || undefined
            });
          }
        }
        return event;
      }),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 || error.status === 403) {
          console.warn('Não autorizado (401/403). Efetuando logout e redirecionando...');
          try {
            const authService = this.injector.get(AuthService);
            authService.logout();
          } catch (err) {
            console.error('Erro ao chamar logout() no AuthService pelo Interceptor:', err);
          }
        }
        return throwError(() => error);
      })
    );
  }

  private getToken(): string | null {
    try { return localStorage.getItem('erp_token'); } catch { return null; }
  }
}