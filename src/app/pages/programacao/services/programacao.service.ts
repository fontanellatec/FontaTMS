import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '@env/environment';
import { ProgramacaoRow, DetalhesFrotaResponse, PlanoViagemGroup, PlanoViagemRow, OutraReceitaRow, ManifestoGroup } from '../models/programacao.model';

function parsePtBrDateToIso(dateStr: any): string {
  if (!dateStr) return '';
  const str = String(dateStr).trim();
  const match = str.match(/^(\d{2})\/(\d{2})\/(\d{4})(.*)$/);
  if (match) {
    return `${match[3]}-${match[2]}-${match[1]}${match[4]}`;
  }
  return str;
}

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
          inicioViagem: parsePtBrDateToIso(r.dataInicioViagem),
          destino: r.cidadeDestino || '',
          pEntrega: parsePtBrDateToIso(r.pEntrega),
          pViagem: String(r.pViagem || ''),
          totalReceitas: Number(r.totalReceitas) || 0,
          totalDiario: Number(r.totalDiario) || 0,
          observacao: r.observacao || '',
          receitasPVOR: Number(r.qtdReceita) || 0,
          situacaoMotorista: r.situacaoMotorista === -1 ? 'Indefinido' : String(r.situacaoMotorista || ''),
          tipoConjuntoVeiculo: r.tipoConjuntoVeiculo || '',
          tipoOperacaoFrota: r.tipoOperacaoFrota || '',
          ultManutencao: parsePtBrDateToIso(r.ultManutencao),
          falta: Number(r.falta) || 0,
          folga: Number(r.folga) || 0,
          jornada: r.jornada || '',
          entregas: typeof r.entregas === 'number' ? r.entregas : 0,
          qtdReceita: Number(r.qtdReceita) || 0,
          veiculoPlaca: r.veiculo?.placa || r.placa || '',
          coordenador: r.veiculo?.coordenador || ''
        }));
      })
    );
  }

  getDetalhesFrota(frota: string): Observable<DetalhesFrotaResponse> {
    return this.http.get<DetalhesFrotaResponse>(`${this.baseUrl}/${frota}/detalhes`).pipe(
      map(res => {
        const isEmpty = !res || 
          (!res.entregasPVGroups?.length && 
           !res.planoViagemRows?.length && 
           !res.outrasReceitasRows?.length && 
           !res.manifestosGroups?.length);

        if (isEmpty) {
          return this.getMockDetalhes(frota);
        }
        return res;
      }),
      catchError(() => {
        console.warn(`[ProgramacaoService] Falha na requisição detalhes da frota ${frota}. Usando mock local.`);
        return of(this.getMockDetalhes(frota));
      })
    );
  }

  private getMockDetalhes(frota: string): DetalhesFrotaResponse {
    return {
      entregasPVGroups: [
        {
          pvNumero: `PV-00${frota}1`,
          emissao: new Date().toISOString(),
          conhecimentos: [
            {
              numero: 'CTe-29402',
              armazemPrev: 'A1',
              formaFinal: false,
              armazenagem: true,
              dataEntrega: new Date().toISOString().slice(0, 10),
              armazem: 'Armazém Central SP',
              observacao: 'Carga frágil, descarregar com cuidado'
            },
            {
              numero: 'CTe-29403',
              armazemPrev: 'B2',
              formaFinal: true,
              armazenagem: false,
              dataEntrega: new Date().toISOString().slice(0, 10),
              armazem: 'Armazém Filial RJ',
              observacao: 'Prioridade na entrega'
            }
          ]
        }
      ],
      planoViagemRows: [
        {
          pvNumero: `PV-00${frota}1`,
          emissao: new Date().toISOString(),
          origem: 'São Paulo - SP',
          destino: 'Rio de Janeiro - RJ',
          valor: '2500.00',
          dataEntrega: new Date().toISOString().slice(0, 10),
          horaEntrega: '14:30'
        }
      ],
      outrasReceitasRows: [
        {
          recNumero: `REC-00${frota}A`,
          emissao: new Date().toISOString(),
          origem: 'Campinas - SP',
          destino: 'Resende - RJ',
          valor: '450.00',
          dataEntrega: new Date().toISOString().slice(0, 10),
          horaEntrega: '16:15'
        }
      ],
      manifestosGroups: [
        {
          pvNumero: `PV-00${frota}1`,
          emissao: new Date().toISOString(),
          manifestos: [
            {
              numero: `MDF-00${frota}7`,
              emissao: new Date().toISOString(),
              origem: 'São Paulo - SP',
              destino: 'Rio de Janeiro - RJ',
              status: 'Emitido',
              chaveAcesso: '35260712345678901234550010000055211234567890'
            }
          ]
        }
      ]
    };
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
