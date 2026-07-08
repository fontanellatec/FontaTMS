import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LoginResponse {
  token: string;
  user?: {
    username: string;
    nome?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'erp_token';
  private readonly AUTH_KEY = 'isAuthenticated';

  private isAuthSignal = signal<boolean>(false);
  isAuthenticated = this.isAuthSignal.asReadonly();

  private userNameSignal = signal<string>('');
  userName = this.userNameSignal.asReadonly();

  constructor(private http: HttpClient, private router: Router) {
    this.restoreSession();
  }

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<any>(`${environment.apiUrl}/login`, { user: username, password }).pipe(
      map(response => {
        const token = response?.data?.token || response?.token;
        return {
          ...response,
          token
        } as LoginResponse;
      }),
      tap(response => {
        if (response && response.token) {
          localStorage.setItem(this.TOKEN_KEY, response.token);
          localStorage.setItem(this.AUTH_KEY, 'true');
          const userObj = response.user || (response as any).data?.user;
          const userNome = userObj?.nome || userObj?.username || username;
          localStorage.setItem('erp_user_name', userNome);
          this.userNameSignal.set(userNome);
          this.isAuthSignal.set(true);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.AUTH_KEY);
    localStorage.removeItem('erp_user_name');
    sessionStorage.removeItem(this.AUTH_KEY);
    this.isAuthSignal.set(false);
    this.userNameSignal.set('');
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private restoreSession(): void {
    const token = this.getToken();
    const isAuth = localStorage.getItem(this.AUTH_KEY) === 'true' || sessionStorage.getItem(this.AUTH_KEY) === 'true';
    if (token && isAuth) {
      this.isAuthSignal.set(true);
      const savedName = localStorage.getItem('erp_user_name') || 'Usuário';
      this.userNameSignal.set(savedName);
    } else {
      this.isAuthSignal.set(false);
      this.userNameSignal.set('');
    }
  }
}
