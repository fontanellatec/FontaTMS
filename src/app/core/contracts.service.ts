import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class ContractsService {
  constructor(private http: HttpClient) {}

  /**
   * Busca contratos no backend. Espera um array de objetos compatível com a listagem.
   * Caso o backend não esteja disponível, retorna um array vazio.
   */
  list(): Observable<any[]> {
    return this.http.get<any[]>('/api/contratos').pipe(
      catchError(() => of([]))
    );
  }
}