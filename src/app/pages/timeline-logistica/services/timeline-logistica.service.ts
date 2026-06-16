import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { TimelineFleetModalData, TimelineEventModalData } from '../models/timeline-logistica.model';

@Injectable({
  providedIn: 'root'
})
export class TimelineLogisticaService {
  private readonly baseUrl = `${environment.apiUrl}/timeline-logistica`;

  constructor(private http: HttpClient) {}

  getFrotasTimeline(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/frotas`);
  }

  getFinanceiroFrota(frotaId: string): Observable<TimelineFleetModalData> {
    return this.http.get<TimelineFleetModalData>(`${this.baseUrl}/frota/${frotaId}/financeiro`);
  }

  getDetalheEvento(eventoId: string): Observable<TimelineEventModalData> {
    return this.http.get<TimelineEventModalData>(`${this.baseUrl}/evento/${eventoId}`);
  }
}
