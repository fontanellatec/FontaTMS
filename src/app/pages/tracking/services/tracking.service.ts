import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { TrackedVehicle } from '../models/tracking.model';

@Injectable({
  providedIn: 'root'
})
export class TrackingService {
  private readonly baseUrl = `${environment.apiUrl}/tracking`;

  constructor(private http: HttpClient) {}

  getTrackedVehicles(): Observable<TrackedVehicle[]> {
    return this.http.get<TrackedVehicle[]>(`${this.baseUrl}/veiculos`);
  }
}
