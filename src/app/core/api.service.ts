import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  get<T>(path: string, params?: Record<string, any>, headers?: Record<string, string>): Observable<T> {
    return this.http.get<T>(this.url(path), { params: this.toParams(params), headers: this.toHeaders(headers) });
  }

  post<T>(path: string, body?: any, headers?: Record<string, string>): Observable<T> {
    return this.http.post<T>(this.url(path), body, { headers: this.toHeaders(headers) });
  }

  put<T>(path: string, body?: any, headers?: Record<string, string>): Observable<T> {
    return this.http.put<T>(this.url(path), body, { headers: this.toHeaders(headers) });
  }

  delete<T>(path: string, headers?: Record<string, string>): Observable<T> {
    return this.http.delete<T>(this.url(path), { headers: this.toHeaders(headers) });
  }

  private url(path: string): string {
    return `${this.baseUrl}${path.startsWith('/') ? path : '/' + path}`;
  }

  private toParams(obj?: Record<string, any>): HttpParams | undefined {
    if (!obj) return undefined;
    let p = new HttpParams();
    for (const [k, v] of Object.entries(obj)) {
      if (v === undefined || v === null) continue;
      p = p.append(k, String(v));
    }
    return p;
  }

  private toHeaders(obj?: Record<string, string>): HttpHeaders | undefined {
    if (!obj) return undefined;
    let h = new HttpHeaders();
    for (const [k, v] of Object.entries(obj)) {
      h = h.set(k, v);
    }
    return h;
  }
}