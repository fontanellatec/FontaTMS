import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { TcVehicle, TcFrete } from '../models/torre-controle.model';

@Injectable({
  providedIn: 'root'
})
export class TorreControleService {
  private readonly baseUrl = `${environment.apiUrl}/torre-controle`;

  constructor(private http: HttpClient) {}

  getVehicles(): Observable<TcVehicle[]> {
    return this.http.get<TcVehicle[]>(`${this.baseUrl}/veiculos`);
  }

  getFretes(): Observable<TcFrete[] | any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/fretes`);
  }
}
