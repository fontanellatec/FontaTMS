import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root'
})
export class AutocompleteSearchService {
  constructor(private http: HttpClient) {}

  search(type: 'veiculo' | 'coordenador' | 'motorista' | 'cidade', term: string): Observable<{ value: string; label: string; subtitle?: string }[]> {
    if (!term || term.length < 3) {
      return of([]);
    }

    const url = `${environment.apiUrl}/tms/search/${type}`;
    const body = { filtro: term };

    return this.http.post<any>(url, body).pipe(
      map(res => {
        // Mapeia e retorna os registros da chave "rows" enviada pelo backend
        return res?.rows || [];
      }),
      catchError(err => {
        console.error(`Erro ao buscar autocomplete para ${type}:`, err);
        return of([]);
      })
    );
  }
}
