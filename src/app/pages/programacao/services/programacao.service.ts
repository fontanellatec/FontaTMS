import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '@env/environment';
import { ProgramacaoRow, DetalhesFrotaResponse } from '../models/programacao.model';

@Injectable({
  providedIn: 'root'
})
export class ProgramacaoService {
  private readonly baseUrl = `${environment.apiUrl}/programacao`;

  constructor(private http: HttpClient) { }

  getProgramacoes(): Observable<ProgramacaoRow[]> {
    const token = localStorage.getItem('erp_token') || '';
    const headers = { 'Authorization': `${token}` };
    const body = { request: 'get_data' };

    return this.http.post<any>(this.baseUrl, body, { headers }).pipe(
      map(res => {
        const rawRows = res?.rows || [];
        return rawRows.map((r: any) => ({
          dParados: typeof r.dParados === 'number' ? r.dParados : 0,
          tempoFora: String(r.tempoFora || '0'),
          frota: String(r.frota || ''),
          localizacao: {
            cidade: r.veiculo?.cidadeUltimaLoc || '',
            uf: r.veiculo?.estadoUltimaLoc || ''
          },
          motorista: r.motorista || 'Sem motorista',
          situacaoVeiculo: r.situacaoVeiculo || (r.dParados > 0 ? 'Parado' : 'Em Rota'),
          origem: r.cidadeOrigem || '',
          inicioViagem: r.dataInicioViagem || '',
          destino: r.cidadeDestino || '',
          pEntrega: r.pEntrega || '',
          pViagem: String(r.pViagem || ''),
          totalReceitas: Number(r.totalReceitas) || 0,
          totalDiario: Number(r.totalDiario) || 0,
          observacao: r.observacao || '',
          receitasPVOR: Number(r.qtdReceita) || 0,
          situacaoMotorista: r.situacaoMotorista === -1 ? 'Indefinido' : String(r.situacaoMotorista || ''),
          tipoConjuntoVeiculo: r.tipoConjuntoVeiculo || '',
          tipoOperacaoFrota: r.tipoOperacaoFrota || '',
          ultManutencao: String(r.ultManutencao || ''),
          falta: Number(r.falta) || 0,
          folga: Number(r.folga) || 0,
          jornada: r.jornada || '',
          entregas: typeof r.entregas === 'number' ? r.entregas : 0,
          qtdReceita: Number(r.qtdReceita) || 0
        }));
      })
    );
  }

  getDetalhesFrota(frota: string): Observable<DetalhesFrotaResponse> {
    return this.http.get<DetalhesFrotaResponse>(`${this.baseUrl}/${frota}/detalhes`);
  }

  salvarPlanoViagem(pvNumero: string, dataEntrega: string, horaEntrega: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/plano-viagem/salvar`, {
      pvNumero,
      dataEntrega,
      horaEntrega
    });
  }

  salvarOutraReceita(recNumero: string, dataEntrega: string, horaEntrega: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/outra-receita/salvar`, {
      recNumero,
      dataEntrega,
      horaEntrega
    });
  }

  encerrarManifesto(manifestoNumero: string, dataEncerramento: string, ufEncerramento: string, cidadeEncerramento: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/manifesto/encerrar`, {
      manifestoNumero,
      dataEncerramento,
      ufEncerramento,
      cidadeEncerramento
    });
  }

  cancelarManifesto(manifestoNumero: string, justificativa: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/manifesto/cancelar`, {
      manifestoNumero,
      justificativa
    });
  }
}
