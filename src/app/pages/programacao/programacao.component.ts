import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ProgramacaoRow {
  dParados: number; // Dias Parados
  tempoFora: string; // ex: 12h, 3d
  frota: string;
  localizacao: { cidade: string; uf: string };
  motorista: string;
  situacaoVeiculo: string;
  origem: string; // cidade/UF
  inicioViagem: string; // data/hora
  destino: string; // cidade/UF
  pEntrega: string; // prazo entrega
  pViagem: string; // prazo viagem
  totalReceitas: number;
  totalDiario: number;
  observacao: string;
  receitasPVOR: number; // P.Viagem + OR (receitas)
  situacaoMotorista: string;
  tipoConjuntoVeiculo: string;
  tipoOperacaoFrota: string;
  ultManutencao: string; // data
  falta: number; // dias/ocorrências
  folga: number; // dias
  jornada: string; // status jornada
  entregas: number; // qtd
}

@Component({
  selector: 'app-programacao',
  templateUrl: './programacao.component.html',
  styleUrls: ['./programacao.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class ProgramacaoComponent {
  // Disponibiliza Math no template para usar Math.min/Math.max
  public Math = Math;
  // Filtros (espelhando imagem do ERP)
  filtroDataInicio?: string; // yyyy-mm-dd
  filtroDataRecebida?: string; // yyyy-mm-dd
  filtroEnvioSefaz: string = '';
  filtroRankingDiario: string = '';
  filtroFrota = '';
  filtroVeiculo = '';
  filtroCoordenador = '';
  filtroGestor = '';
  filtroMotorista = '';
  filtroCidade = '';
  filtroSituacaoVeiculo = '';
  filtroSituacaoMotorista = '';
  filtroTipoOperacaoFrota = '';
  filtroTempoMinFora = '';

  rows: ProgramacaoRow[] = [
    {
      dParados: 0,
      tempoFora: '—',
      frota: '116',
      localizacao: { cidade: 'SÃO PAULO', uf: 'SP' },
      motorista: 'João Santos',
      situacaoVeiculo: 'Em rota',
      origem: 'CASCAVEL/PR',
      inicioViagem: '17/10/2025 08:10',
      destino: 'SÃO PAULO/SP',
      pEntrega: '18/10 12:00',
      pViagem: '1d 4h',
      totalReceitas: 12500.0,
      totalDiario: 450.0,
      observacao: 'Carga frágil · rota via Londrina',
      receitasPVOR: 13200.0,
      situacaoMotorista: 'Trabalhando',
      tipoConjuntoVeiculo: 'Cavalo + Carreta',
      tipoOperacaoFrota: 'Transferência',
      ultManutencao: '10/10/2025',
      falta: 0,
      folga: 0,
      jornada: 'OK',
      entregas: 2,
    },
    {
      dParados: 2,
      tempoFora: '36h',
      frota: '201',
      localizacao: { cidade: 'CASCAVEL', uf: 'PR' },
      motorista: 'Maria Lima',
      situacaoVeiculo: 'Parado',
      origem: 'MARINGÁ/PR',
      inicioViagem: '—',
      destino: '—',
      pEntrega: '—',
      pViagem: '—',
      totalReceitas: 0,
      totalDiario: 0,
      observacao: 'Aguardando programação',
      receitasPVOR: 0,
      situacaoMotorista: 'Folga',
      tipoConjuntoVeiculo: 'Toco',
      tipoOperacaoFrota: 'Distribuição',
      ultManutencao: '05/09/2025',
      falta: 0,
      folga: 1,
      jornada: 'Folga',
      entregas: 0,
    }
  ];

  get filtered(): ProgramacaoRow[] {
    const parseTempo = (t: string) => {
      // "36h", "1d 4h", "—"
      if (!t || t === '—') return 0;
      const dMatch = t.match(/(\d+)d/);
      const hMatch = t.match(/(\d+)h/);
      const d = dMatch ? parseInt(dMatch[1], 10) : 0;
      const h = hMatch ? parseInt(hMatch[1], 10) : 0;
      return d * 24 + h;
    };

    const minFora = this.filtroTempoMinFora ? parseInt(this.filtroTempoMinFora, 10) : 0;
    return this.rows.filter(r =>
      (!this.filtroFrota || r.frota.toLowerCase().includes(this.filtroFrota.toLowerCase())) &&
      (!this.filtroVeiculo || r.tipoConjuntoVeiculo.toLowerCase().includes(this.filtroVeiculo.toLowerCase())) &&
      (!this.filtroCoordenador || 'coordenador_placeholder'.includes(this.filtroCoordenador.toLowerCase())) &&
      (!this.filtroGestor || 'gestor_placeholder'.includes(this.filtroGestor.toLowerCase())) &&
      (!this.filtroMotorista || r.motorista.toLowerCase().includes(this.filtroMotorista.toLowerCase())) &&
      (!this.filtroCidade || r.localizacao.cidade.toLowerCase().includes(this.filtroCidade.toLowerCase())) &&
      (!this.filtroSituacaoVeiculo || r.situacaoVeiculo.toLowerCase().includes(this.filtroSituacaoVeiculo.toLowerCase())) &&
      (!this.filtroSituacaoMotorista || r.situacaoMotorista.toLowerCase().includes(this.filtroSituacaoMotorista.toLowerCase())) &&
      (!this.filtroTipoOperacaoFrota || r.tipoOperacaoFrota.toLowerCase().includes(this.filtroTipoOperacaoFrota.toLowerCase())) &&
      (parseTempo(r.tempoFora) >= minFora)
    );
  }

  // Ações de filtro rápidas
  pesquisar(): void {/* no-op por enquanto, filtros são reativos */}
  mostrarPrincipal(): void {
    // Limpa filtros e foca em veículos em rota
    this.filtroSituacaoVeiculo = 'Em rota';
    this.filtroTempoMinFora = '';
  }
  mostrarParados(): void {
    this.filtroSituacaoVeiculo = 'Parado';
  }

  // Paginação
  page = 1;
  pageSize = 25;
  pageSizeOptions = [25, 50, 250];

  get paged(): ProgramacaoRow[] {
    const data = this.filtered;
    const start = (this.page - 1) * this.pageSize;
    return data.slice(start, start + this.pageSize);
  }
  get pageCount(): number {
    const total = this.filtered.length;
    return Math.max(1, Math.ceil(total / this.pageSize));
  }
  nextPage(): void { if (this.page < this.pageCount) this.page++; }
  prevPage(): void { if (this.page > 1) this.page--; }
  firstPage(): void { this.page = 1; }
  lastPage(): void { this.page = this.pageCount; }

  // Ações por linha
  operacionalizar(r: ProgramacaoRow): void {
    console.log('Operacionalizar', r);
  }
  verRota(r: ProgramacaoRow): void {
    console.log('Ver rota', r);
  }
  programarManutencao(r: ProgramacaoRow): void {
    console.log('Programar manutenção', r);
  }
  programarAcerto(r: ProgramacaoRow): void {
    console.log('Programar acerto', r);
  }
}