import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.getToken();
    const cloned = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
    return next.handle(cloned).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // TODO: lidar com expiração de sessão (ex.: redirect login / refresh)
          console.warn('Não autorizado (401).');
        }
        return throwError(() => error);
      })
    );
  }

  private getToken(): string | null {
    try { return localStorage.getItem('erp_token'); } catch { return null; }
  }
}