import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  FilterSectionComponent, 
  FilterConfig, 
  PageLayoutComponent, 
  KpiSectionComponent, 
  KpiConfig, 
  TrendComparisonChartComponent, 
  MiniTrendCardComponent, 
  SparklineChartComponent, 
  GridSectionComponent, 
  GridColumn, 
  ButtonComponent 
} from '@shared/components';
import { FormsModule } from '@angular/forms';
import { TcVehicle, TcFrete, OPERACOES_FROTA_CATALOG } from '../models/torre-controle.model';
import { TorreControleService } from '../services/torre-controle.service';

@Component({
  selector: 'app-torre-controle',
  templateUrl: './torre-controle-list.component.html',
  styleUrls: ['./torre-controle-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FilterSectionComponent,
    KpiSectionComponent,
    TrendComparisonChartComponent,
    MiniTrendCardComponent,
    SparklineChartComponent,
    GridSectionComponent,
    PageLayoutComponent,
    ButtonComponent
  ]
})
export class TorreControleComponent implements OnInit, AfterViewInit, OnDestroy {
  title = 'Torre de Controle';

  selectedTab: 'geral' | 'kmVazio' | 'custoOperacional' | 'excecoes' = 'geral';

  kmVazioTotal: number = 18000;
  pedagioTotal: number = 6500;
  abastecimentoTotal: number = 52000;
  proporcaoCombustivelVazioPerc: number = 71;

  private velocidadeMediaKmH: number = 60;
  private deadlineTargetPrazoRatio: number = 0.56;

  operacoesFrotaCatalog: string[] = OPERACOES_FROTA_CATALOG;

  get combustivelVazioEstimado(): number {
    const v = this.abastecimentoTotal * (this.proporcaoCombustivelVazioPerc / 100);
    return +v.toFixed(2);
  }
  get custoVazioEstimado(): number {
    const v = this.pedagioTotal + this.combustivelVazioEstimado;
    return +v.toFixed(2);
  }
  get custoPorKmVazio(): number {
    if (!this.kmVazioTotal) return 0;
    const v = this.custoVazioEstimado / this.kmVazioTotal;
    return +v.toFixed(2);
  }

  tempoVazioHoras: number = 1200;
  tempoOperacaoHoras: number = 3600;
  numeroViagens: number = 800;
  abastecimentosTotais: number = 1300;
  precoMedioLitro: number = 6.0;

  tendenciasDetalhadasCollapsed: boolean = false;
  toggleTendenciasDetalhadas(): void { this.tendenciasDetalhadasCollapsed = !this.tendenciasDetalhadasCollapsed; }

  rankingsCollapsed: boolean = false;
  tendenciasCollapsed: boolean = false;
  filtersCollapsed: boolean = true;
  toggleRankings(): void { this.rankingsCollapsed = !this.rankingsCollapsed; }
  toggleTendencias(): void { this.tendenciasCollapsed = !this.tendenciasCollapsed; }

  get percentTempoVazio(): number {
    if (!this.tempoOperacaoHoras) return 0;
    return +(((this.tempoVazioHoras / this.tempoOperacaoHoras) * 100)).toFixed(1);
  }
  get litrosVazioEstimado(): number {
    const r$ = this.combustivelVazioEstimado;
    const litros = r$ / (this.precoMedioLitro || 6);
    return +litros.toFixed(1);
  }
  get consumoMedioVazioKmPorLitro(): number {
    if (!this.litrosVazioEstimado) return 0;
    const raw = this.kmVazioTotal / this.litrosVazioEstimado;
    const clamped = Math.min(4.0, Math.max(2.0, raw));
    return +clamped.toFixed(2);
  }
  get tempoMedioVazioPorViagem(): number {
    if (!this.numeroViagens) return 0;
    return +((this.tempoVazioHoras / this.numeroViagens)).toFixed(2);
  }

  prevPercentTempoVazio: number = 0;
  prevKmVazioTotal: number = 0;
  prevCustoVazioEstimado: number = 0;
  prevCustoPorKmVazio: number = 0;
  prevConsumoMedioVazioKmPorLitro: number = 0;
  prevTempoMedioVazioPorViagem: number = 0;

  seriePercentTempoVazio6m: number[] = [];
  serieCustoPorKmVazio6m: number[] = [];
  serieConsumoMedioVazio6m: number[] = [];
  serieCustoVazioTotal6m: number[] = [];
  rankingKmVazioData: { placa: string; kmVazio: number; custoPorKm: number; consumoVazio: number; pedagioVazio: number; abastecimentoVazio: number; custoVazioTotal: number }[] = [];

  private computePrevAndSeries(): void {
    this.prevPercentTempoVazio = Math.max(0, +(this.percentTempoVazio * (0.95 + Math.random() * 0.1)).toFixed(1));
    this.prevKmVazioTotal = Math.round(this.kmVazioTotal * (0.92 + Math.random() * 0.12));
    this.prevCustoVazioEstimado = +((this.custoVazioEstimado * (0.9 + Math.random() * 0.15)).toFixed(2));
    this.prevCustoPorKmVazio = +((this.prevCustoVazioEstimado / (this.prevKmVazioTotal || 1)).toFixed(2));
    this.prevConsumoMedioVazioKmPorLitro = +((this.consumoMedioVazioKmPorLitro * (0.9 + Math.random() * 0.15)).toFixed(2));
    this.prevTempoMedioVazioPorViagem = +((this.tempoMedioVazioPorViagem * (0.9 + Math.random() * 0.15)).toFixed(2));

    this.seriePercentTempoVazio6m = this.gerarSerie6m(this.prevPercentTempoVazio, 10, 1).map(v => Math.max(0, Math.min(100, v)));
    this.serieCustoPorKmVazio6m = this.gerarSerie6m(this.prevCustoPorKmVazio, 12, 2);
    this.serieConsumoMedioVazio6m = this.gerarSerie6m(this.prevConsumoMedioVazioKmPorLitro, 8, 2).map(v => Math.min(4.0, Math.max(2.0, v)));
    this.serieCustoVazioTotal6m = this.gerarSerie6m(this.prevCustoVazioEstimado, 12, 2);

    this.computeRanking();

    this.prevKmCarregadoTotal = Math.round(this.kmCarregadoTotal * (0.92 + Math.random() * 0.12));
    this.prevPedagioOperacionalTotal = Math.round(this.pedagioOperacionalTotal * (0.9 + Math.random() * 0.15));
    this.prevAbastecimentoOperacionalTotal = +((this.abastecimentoOperacionalTotal * (0.9 + Math.random() * 0.15)).toFixed(2));
    this.prevOficinaMecanicaTotal = Math.round(this.oficinaMecanicaTotal * (0.9 + Math.random() * 0.15));
    this.prevConsumoMedioCarregadoKmPorLitro = +((this.consumoMedioCarregadoKmPorLitro * (0.9 + Math.random() * 0.15)).toFixed(2));
    this.prevTempoMedioCarregadoPorViagem = +((this.tempoMedioCarregadoPorViagem * (0.9 + Math.random() * 0.15)).toFixed(2));

    this.serieCustoOperacionalTotal6m = this.gerarSerie6m(this.prevCustoOperacionalTotal, 12, 2);
    this.serieCustoPorKmCarregado6m = this.gerarSerie6m(this.prevCustoPorKmCarregado, 12, 2);
    this.serieConsumoMedioCarregado6m = this.gerarSerie6m(this.prevConsumoMedioCarregadoKmPorLitro, 8, 2).map(v => Math.min(5.0, Math.max(2.0, v)));
    this.serieTempoMedioCarregado6m = this.gerarSerie6m(this.prevTempoMedioCarregadoPorViagem, 10, 2);

    this.computeRankingOperacional();
  }

  private trendIconColor(curr: number, prev: number, betterDirection: 'up' | 'down'): { icon: string; color: string } {
    const increased = curr > prev;
    const decreased = curr < prev;
    const improved = betterDirection === 'up' ? increased : decreased;
    const icon = increased ? '▲' : decreased ? '▼' : '↔';
    const color = improved ? 'var(--success)' : (increased || decreased) ? '#ef4444' : '#64748b';
    return { icon, color };
  }

  get kpisKmVazioPrincipais(): KpiConfig[] {
    const t1 = this.trendIconColor(this.percentTempoVazio, this.prevPercentTempoVazio, 'down');
    const t2 = this.trendIconColor(this.kmVazioTotal, this.prevKmVazioTotal, 'down');
    const t3 = this.trendIconColor(this.custoVazioEstimado, this.prevCustoVazioEstimado, 'down');
    const t4 = this.trendIconColor(this.custoPorKmVazio, this.prevCustoPorKmVazio, 'down');
    const t5 = this.trendIconColor(this.consumoMedioVazioKmPorLitro, this.prevConsumoMedioVazioKmPorLitro, 'up');
    const t6 = this.trendIconColor(this.tempoMedioVazioPorViagem, this.prevTempoMedioVazioPorViagem, 'down');
    const dKm = this.kmVazioTotal - this.prevKmVazioTotal;
    return [
      { label: '% de tempo vazio', value: this.percentTempoVazio, icon: 'pause-circle', format: 'percentage', color: t1.color, delta: this.deltaPercentTempoVazio, deltaFormat: 'percentage', betterDirection: 'down' },
      { label: 'KM vazio total', value: this.kmVazioTotal, icon: 'route', format: 'number', color: t2.color, delta: dKm, deltaFormat: 'number', betterDirection: 'down' },
      { label: 'Custo total vazio', value: this.custoVazioEstimado, icon: 'currency', format: 'currency', color: t3.color, delta: this.deltaCustoVazioTotal, deltaFormat: 'currency', betterDirection: 'down' },
      { label: 'Custo por KM vazio', value: this.custoPorKmVazio, icon: 'currency', format: 'currency', color: t4.color, delta: this.deltaCustoPorKmVazio, deltaFormat: 'currency', betterDirection: 'down' },
      { label: 'Consumo médio vazio (km/l)', value: this.consumoMedioVazioKmPorLitro, icon: 'refresh', format: 'number', color: t5.color, delta: this.deltaConsumoMedioVazio, deltaFormat: 'number', betterDirection: 'up' },
      { label: 'Tempo médio vazio por viagem (h)', value: this.tempoMedioVazioPorViagem, icon: 'clock', format: 'number', color: t6.color, delta: this.deltaTempoMedioVazio, deltaFormat: 'number', deltaSuffix: 'h', betterDirection: 'down' },
    ];
  }

  get kpisKmVazioAnaliticos(): KpiConfig[] {
    const abastecimentosVazioPerc = Math.round(this.proporcaoCombustivelVazioPerc);
    const custoMedioHoraVazia = this.tempoVazioHoras ? +(this.custoVazioEstimado / this.tempoVazioHoras).toFixed(2) : 0;
    return [
      { label: 'Custo combustível vazio (R$)', value: this.combustivelVazioEstimado, icon: 'currency', format: 'currency', color: '#7c3aed' },
      { label: 'Custo pedágio vazio (R$)', value: this.pedagioTotal, icon: 'currency', format: 'currency', color: '#0ea5e9' },
      { label: 'Custo médio por hora vazia (R$/h)', value: custoMedioHoraVazia, icon: 'currency', format: 'currency', color: 'var(--brand-primary)' },
      { label: 'Abastecimentos durante vazio (%)', value: abastecimentosVazioPerc, icon: 'refresh', format: 'percentage', color: 'var(--warning, #d97706)' },
      { label: 'Tempo médio até nova carga (h, proxy)', value: 10, icon: 'clock', format: 'number', color: '#64748b' },
    ];
  }

  get kpisKmVazio(): KpiConfig[] {
    return [
      { label: 'Km Vazio', value: this.kmVazioTotal, icon: 'route', format: 'number', color: 'var(--brand-primary)' },
      { label: 'Pedágio (total)', value: this.pedagioTotal, icon: 'currency', format: 'currency', color: '#0ea5e9' },
      { label: 'Abastecimento (total)', value: this.abastecimentoTotal, icon: 'currency', format: 'currency', color: '#7c3aed' },
      { label: 'Combustível (km vazio estimado)', value: this.combustivelVazioEstimado, icon: 'currency', format: 'currency', color: 'var(--warning, #d97706)' },
      { label: 'Custo Vazio (estimado)', value: this.custoVazioEstimado, icon: 'currency', format: 'currency', color: 'var(--success)' },
      { label: 'Custo por km vazio', value: this.custoPorKmVazio, icon: 'currency', format: 'currency', color: '#64748b' },
    ];
  }

  get rankingKmVazio(): { placa: string; kmVazio: number; custoPorKm: number; consumoVazio: number; pedagioVazio: number; abastecimentoVazio: number; custoVazioTotal: number }[] {
    return this.rankingKmVazioData;
  }

  private computeRanking(): void {
    const sample = this.vehicles.slice(0, 20);
    if (!sample.length) { this.rankingKmVazioData = []; return; }

    const totalKm = this.kmVazioTotal || 1;
    const totalPed = this.pedagioTotal || 0;
    const totalCombVazio = this.combustivelVazioEstimado || 0;

    const wKm = sample.map(() => 0.7 + Math.random() * 0.6);
    const wPed = sample.map(() => 0.7 + Math.random() * 0.6);
    const wComb = sample.map(() => 0.7 + Math.random() * 0.6);
    const sumKm = wKm.reduce((a, b) => a + b, 0);
    const sumPed = wPed.reduce((a, b) => a + b, 0);
    const sumComb = wComb.reduce((a, b) => a + b, 0);

    const res = sample.map((v, i) => {
      const kmVazio = Math.max(1, Math.round(totalKm * (wKm[i] / sumKm)));
      const pedagioVazio = Math.round(totalPed * (wPed[i] / sumPed));
      const abastecimentoVazio = +((totalCombVazio * (wComb[i] / sumComb)).toFixed(2));
      const consumoVazioRaw = this.consumoMedioVazioKmPorLitro * (0.85 + Math.random() * 0.3);
      const consumoVazio = +Math.min(5.0, Math.max(2.0, consumoVazioRaw)).toFixed(2);
      const custoVazioTotal = +(pedagioVazio + abastecimentoVazio).toFixed(2);
      const custoPorKm = +((custoVazioTotal / kmVazio)).toFixed(2);
      return { placa: v.placa, kmVazio, custoPorKm, consumoVazio, pedagioVazio, abastecimentoVazio, custoVazioTotal };
    });

    this.rankingKmVazioData = res.sort((a, b) => b.custoVazioTotal - a.custoVazioTotal);
  }

  private computeRankingOperacional(): void {
    const sample = this.vehicles.slice(0, 20);
    if (!sample.length) { this.rankingOperacionalData = []; return; }

    const totalKm = this.kmCarregadoTotal || 1;
    const totalPed = this.pedagioOperacionalTotal || 0;
    const totalComb = this.abastecimentoOperacionalTotal || 0;
    const totalOf = this.oficinaMecanicaTotal || 0;

    const wKm = sample.map(() => 0.7 + Math.random() * 0.6);
    const wPed = sample.map(() => 0.7 + Math.random() * 0.6);
    const wComb = sample.map(() => 0.7 + Math.random() * 0.6);
    const wOf = sample.map(() => 0.7 + Math.random() * 0.6);
    const sumKm = wKm.reduce((a, b) => a + b, 0);
    const sumPed = wPed.reduce((a, b) => a + b, 0);
    const sumComb = wComb.reduce((a, b) => a + b, 0);
    const sumOf = wOf.reduce((a, b) => a + b, 0);

    const res = sample.map((v, i) => {
      const kmCarregado = Math.max(1, Math.round(totalKm * (wKm[i] / sumKm)));
      const pedagio = Math.round(totalPed * (wPed[i] / sumPed));
      const abastecimento = +((totalComb * (wComb[i] / sumComb)).toFixed(2));
      const oficina = Math.round(totalOf * (wOf[i] / sumOf));
      const litros = abastecimento / (this.precoMedioLitro || 6);
      const consumoRaw = kmCarregado / (litros || 1);
      const consumoCarregado = +Math.min(6.0, Math.max(2.0, consumoRaw)).toFixed(2);
      const custoOperacionalTotal = +(pedagio + abastecimento + oficina).toFixed(2);
      const custoPorKm = +((custoOperacionalTotal / kmCarregado)).toFixed(2);
      return { placa: v.placa, kmCarregado, custoPorKm, consumoCarregado, pedagio, abastecimento, oficina, custoOperacionalTotal };
    });

    this.rankingOperacionalData = res.sort((a, b) => b.custoOperacionalTotal - a.custoOperacionalTotal);
  }

  get relacaoCustoVazioReceitaPerc(): number {
    const { inicio, fim } = this.intervalDates();
    const receita = this.faturamentoIntervalo(inicio, fim) || 0;
    if (!receita) return 0;
    return +(((this.custoVazioEstimado / receita) * 100).toFixed(1));
  }
  get variacaoPercentVazioMensal(): number { return +((this.percentTempoVazio - this.prevPercentTempoVazio).toFixed(1)); }
  get variacaoCustoPorKmMensal(): number { return +((this.custoPorKmVazio - this.prevCustoPorKmVazio).toFixed(2)); }

  filtroCoordenador: string = '';
  filtroGestor: string = '';
  filtroDataInicio: string | null = null;
  filtroDataFim: string | null = null;
  filtroFrota: number | null = null;
  filtroTipoOperacao: string = '';
  
  filtersConfig: FilterConfig[] = [
    { type: 'date', label: 'Data Início', key: 'dataInicio', value: this.filtroDataInicio },
    { type: 'date', label: 'Data Fim', key: 'dataFim', value: this.filtroDataFim },
    { type: 'text', label: 'Coordenador', key: 'coordenador', value: this.filtroCoordenador, placeholder: 'Nome do coordenador' },
    { type: 'text', label: 'Gestor', key: 'gestor', value: this.filtroGestor, placeholder: 'Nome do gestor' },
    { type: 'number', label: 'Frota', key: 'frota', value: this.filtroFrota, placeholder: 'Número da frota' },
    { type: 'select', label: 'Tipo Operação', key: 'tipoOperacao', value: this.filtroTipoOperacao, placeholder: 'Selecione a operação', options: this.operacoesFrotaCatalog.map(o => ({ value: o, label: o })) }
  ];

  onFiltersChange(values: any): void {
    this.filtroDataInicio = values?.dataInicio || null;
    this.filtroDataFim = values?.dataFim || null;
    this.filtroCoordenador = values?.coordenador || '';
    this.filtroGestor = values?.gestor || '';
    this.filtroFrota = values?.frota ? Number(values.frota) : null;
    this.filtroTipoOperacao = values?.tipoOperacao || '';
    this.computePrevAndSeries();
    if (this.mapReady) { this.postMapData(); }
  }

  onApplyFilters(values: any): void {
    this.onFiltersChange(values);
    this.loadData();
  }

  onClearFilters(): void {
    this.filtroCoordenador = '';
    this.filtroGestor = '';
    this.filtroDataInicio = null;
    this.filtroDataFim = null;
    this.filtroFrota = null;
    this.filtroTipoOperacao = '';
    this.filtersConfig = this.filtersConfig.map(f => ({ ...f, value: f.type === 'select' ? '' : null }));
    this.computePrevAndSeries();
    if (this.mapReady) { this.postMapData(); }
  }

  vehicles: TcVehicle[] = [];
  
  fretes: TcFrete[] = [];

  private startDateForPeriod(days = 30): Date {
    const now = new Date();
    return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  }
  private parseDateInput(d?: string | null): Date | null {
    if (!d) return null;
    const parts = d.split('-');
    if (parts.length !== 3) return null;
    const yyyy = Number(parts[0]);
    const mm = Number(parts[1]) - 1;
    const dd = Number(parts[2]);
    const dt = new Date(yyyy, mm, dd);
    return isNaN(dt.getTime()) ? null : dt;
  }
  private formatDateLabel(d: Date): string { return d.toLocaleDateString('pt-BR'); }
  private intervalDates(): {inicio: Date; fim: Date; hasCustom: boolean} {
    const iniSel = this.parseDateInput(this.filtroDataInicio);
    const fimSel = this.parseDateInput(this.filtroDataFim);
    const inicio = iniSel ?? this.startDateForPeriod(30);
    const fim = fimSel ?? new Date();
    return { inicio, fim, hasCustom: !!(iniSel || fimSel) };
  }
  private fretesIntervalo(): TcFrete[] {
    const { inicio, fim } = this.intervalDates();
    const tipo = (this.filtroTipoOperacao || '').trim();
    return this.fretes
      .filter(f => f.data >= inicio && f.data <= fim)
      .filter(f => !tipo || f.operacaoFrota === tipo);
  }

  private estimateSlaHoras(f: TcFrete): number {
    const distancia = Math.max(0, f.distanciaKm || 0);
    const baseHoras = distancia ? (distancia / 55) : 12;
    const bufferHoras = f.origemUf === f.destinoUf ? 8 : 16;
    return Math.max(12, +(baseHoras + bufferHoras).toFixed(1));
  }

  private classifyPendingByDeadline(f: TcFrete, now: Date): 'prazo' | 'atraso' {
    const elapsedHoras = +(Math.max(0, (now.getTime() - f.data.getTime())) / 36e5).toFixed(1);
    const etaHoras = +(Math.max(0, f.distanciaKm || 0) / this.velocidadeMediaKmH).toFixed(1);
    const slaHoras = this.estimateSlaHoras(f);
    return (elapsedHoras + etaHoras) <= slaHoras ? 'prazo' : 'atraso';
  }

  faturamentoPeriodo(days = 30): number {
    const ini = this.startDateForPeriod(days);
    const end = new Date();
    const total = this.fretes
      .filter(f => f.status === 'Concluido' && f.data >= ini && f.data <= end)
      .reduce((sum, f) => sum + f.valor, 0);
    return +total.toFixed(2);
  }
  private faturamentoIntervalo(inicio: Date, fim: Date): number {
    const total = this.fretes
      .filter(f => f.status === 'Concluido' && f.data >= inicio && f.data <= fim)
      .reduce((sum, f) => sum + f.valor, 0);
    return +total.toFixed(2);
  }

  get kpiConfigs(): KpiConfig[] {
    const viajando = this.vehicles.filter(v => v.status === 'Viajando').length;
    const vazios = this.vehicles.filter(v => v.status === 'Vazio').length;
    const disponiveis = this.vehicles.filter(v => v.status === 'Disponível').length;
    const manutencao = this.vehicles.filter(v => v.status === 'Manutenção').length;
    const parados = disponiveis + manutencao;
    const totalVeiculos = viajando + vazios + parados;

    const { inicio, fim, hasCustom } = this.intervalDates();
    const fretesNoIntervalo = this.fretesIntervalo();
    const concluidos = fretesNoIntervalo.filter(f => f.status === 'Concluido');
    const cancelados = fretesNoIntervalo.filter(f => f.status === 'Cancelado');
    const emRota = fretesNoIntervalo.filter(f => f.status === 'Em Rota');

    const faturamento = concluidos.reduce((sum, f) => sum + f.valor, 0);
    const ticketMedio = concluidos.length ? +(faturamento / concluidos.length).toFixed(2) : 0;
    const receitaProjetada = emRota.reduce((sum, f) => sum + f.valorPrevisto, 0);
    const otifRate = concluidos.length ? (concluidos.filter(f => f.onTime && f.inFull).length / concluidos.length) : 0;
    const cancelRate = fretesNoIntervalo.length ? (cancelados.length / fretesNoIntervalo.length) : 0;

    const fatLabel = hasCustom
      ? `Faturamento (${this.formatDateLabel(inicio)} - ${this.formatDateLabel(fim)})`
      : `Faturamento (Entregue)`;

    return [
      { label: 'Total de Veículos', value: totalVeiculos, icon: 'truck', format: 'number', color: 'var(--info)' },
      { label: 'Viajando', value: viajando, icon: 'route', format: 'number', color: 'var(--brand-primary)' },
      { label: 'Vazios', value: vazios, icon: 'stop-circle', format: 'number', color: 'var(--warning, #d97706)' },
      {
        label: 'Parados',
        value: parados,
        icon: 'pause-circle',
        format: 'number',
        color: '#64748b',
        children: [
          { label: 'Disponíveis', value: disponiveis, color: 'var(--success)', format: 'number' },
          { label: 'Manutenção', value: manutencao, color: 'var(--warning, #d97706)', format: 'number' }
        ]
      },
      { label: fatLabel, value: faturamento, icon: 'currency', format: 'currency', color: 'var(--success)' },
      { label: 'Receita Projetada', value: receitaProjetada, icon: 'currency', format: 'currency', color: '#0ea5e9' },
      { label: 'Entregas Concluídas', value: concluidos.length, icon: 'check-circle', format: 'number', color: 'var(--brand-primary)' },
      { label: 'Em Rota', value: emRota.length, icon: 'route', format: 'number', color: 'var(--info)' },
      { label: 'Ticket Médio', value: ticketMedio, icon: 'currency', format: 'currency', color: '#7c3aed' },
      { label: 'OTIF', value: +(otifRate * 100).toFixed(1), icon: 'refresh', format: 'percentage', color: '#22c55e' },
      { label: 'Cancelamentos', value: +(cancelRate * 100).toFixed(1), icon: 'stop-circle', format: 'percentage', color: '#ef4444' }
    ];
  }

  private mapIframe?: HTMLIFrameElement;
  private mapReady = false;
  private onMapMessageBound = (ev: MessageEvent) => this.onMapMessage(ev);

  constructor(private torreControleService: TorreControleService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.torreControleService.getVehicles().subscribe({
      next: (vehicles) => {
        this.vehicles = vehicles || [];
        this.postMapData();
        this.torreControleService.getFretes().subscribe({
          next: (fretes) => {
            this.fretes = (fretes || []).map(f => ({ ...f, data: new Date(f.data) }));
            this.computePrevAndSeries();
          },
          error: (err) => console.error('Erro ao carregar fretes', err)
        });
      },
      error: (err) => console.error('Erro ao carregar veículos', err)
    });
  }

  ngAfterViewInit(): void {
    this.mapIframe = document.getElementById('tc-map-iframe') as HTMLIFrameElement | null || undefined;
    window.addEventListener('message', this.onMapMessageBound);
    try { this.mapIframe?.addEventListener('load', () => this.postMapData()); } catch {}
    setTimeout(() => { if (this.mapReady) { this.postMapData(); } }, 500);
    setTimeout(() => this.postMapData(), 1200);
  }

  ngOnDestroy(): void { window.removeEventListener('message', this.onMapMessageBound); }

  private onMapMessage(ev: MessageEvent): void {
    const data: any = ev.data;
    if (!data || typeof data !== 'object') return;
    if (data.type === 'MAP_READY') { this.mapReady = true; this.postMapData(); }
  }

  private postMapData(): void {
    const list = (this.filtroFrota ? this.vehicles.filter(v => v.id === Number(this.filtroFrota)) : this.vehicles)
      .map(v => ({ id: v.id, nome: v.placa, placa: v.placa, uf: v.uf, lat: v.lat, lng: v.lng }));
    const payload: any = { type: 'MAP_DATA', filter: 'all', vehicles: list, loads: [], confirmedRoutes: [] };
    try { this.mapIframe?.contentWindow?.postMessage(payload, '*'); } catch {}
  }

  get matrizOperacaoFrotaReceita(): { operacao: string; receita: number }[] {
    const porOperacao = new Map<string, number>();
    this.fretesIntervalo()
      .filter(f => f.status === 'Concluido')
      .forEach(f => {
        const key = f.operacaoFrota || '—';
        porOperacao.set(key, (porOperacao.get(key) || 0) + f.valor);
      });
    const arr = Array.from(porOperacao.entries())
      .map(([operacao, receita]) => ({ operacao, receita: +receita.toFixed(2) }))
      .sort((a, b) => b.receita - a.receita);
    return arr;
  }

  get kpisOperacao(): KpiConfig[] {
    const k = this.kpiConfigs;
    const base: KpiConfig[] = [];
    const pick = (label: string) => k.find(item => item.label === label);
    const tv = pick('Total de Veículos'); if (tv) base.push(tv);
    const viajandoCount = this.vehicles.filter(v => v.status === 'Viajando').length;
    const vaziosCount = this.vehicles.filter(v => v.status === 'Vazio').length;
    const emRotaTotal = viajandoCount + vaziosCount;
    base.push({
      label: 'Em Rota',
      value: emRotaTotal,
      icon: 'route',
      format: 'number',
      color: 'var(--brand-primary)',
      children: [
        { label: 'Carregados', value: viajandoCount, color: 'var(--success)', format: 'number' },
        { label: 'Vazios', value: vaziosCount, color: 'var(--warning, #d97706)', format: 'number' }
      ]
    });
    const par = pick('Parados'); if (par) base.push(par);

    const fretes = this.fretesIntervalo();
    const realizadas = fretes.filter(f => f.status === 'Concluido').length;
    const pendentesList = fretes.filter(f => f.status === 'Em Rota');
    const pendentes = pendentesList.length;
    const geradas = fretes.length;
    const concluidosList = fretes.filter(f => f.status === 'Concluido');
    const otdPerc = concluidosList.length ? Math.round((concluidosList.filter(f => f.onTime).length / concluidosList.length) * 100) : 0;
    const otifPerc = concluidosList.length ? Math.round((concluidosList.filter(f => f.onTime && f.inFull).length / concluidosList.length) * 100) : 0;

    const now = new Date();
    const riskScores = pendentesList.map(f => {
      const elapsedHoras = +(Math.max(0, (now.getTime() - f.data.getTime())) / 36e5).toFixed(1);
      const etaHoras = +(Math.max(0, f.distanciaKm || 0) / this.velocidadeMediaKmH).toFixed(1);
      const slaHoras = this.estimateSlaHoras(f);
      const r = slaHoras ? ((elapsedHoras + etaHoras) / slaHoras) : 1;
      return Number.isFinite(r) ? r : 1;
    });
    let prazoCount = 0;
    let atrasoCount = 0;
    if (riskScores.length) {
      const sorted = [...riskScores].sort((a, b) => a - b);
      const idx = Math.max(0, Math.min(sorted.length - 1, Math.floor(this.deadlineTargetPrazoRatio * sorted.length) - 1));
      const threshold = sorted[idx];
      riskScores.forEach(r => { if (r <= threshold) prazoCount++; else atrasoCount++; });
    }

    base.push(
      { label: 'Entregas Geradas', value: geradas, icon: 'plus', format: 'number', color: '#0ea5e9' },
      {
        label: 'Qualidade de Entregas',
        value: realizadas,
        icon: 'check-circle',
        format: 'number',
        color: 'var(--brand-primary)',
        children: [
          { label: 'OTD', value: otdPerc, color: '#22c55e', format: 'percentage' },
          { label: 'OTIF', value: otifPerc, color: '#0ea5e9', format: 'percentage' }
        ]
      },
      {
        label: 'Pendentes',
        value: pendentes,
        icon: 'route',
        format: 'number',
        color: 'var(--info)',
        children: [
          { label: 'No prazo (chance)', value: prazoCount, color: '#22c55e', format: 'number' },
          { label: 'Com atraso (chance)', value: atrasoCount, color: '#ef4444', format: 'number' }
        ]
      }
    );

    return base;
  }

  get kpisReceita(): KpiConfig[] {
    const k = this.kpiConfigs;
    return k.filter(item => item.label.startsWith('Faturamento') || ['Receita Projetada', 'Ticket Médio'].includes(item.label));
  }

  get kpisQualidade(): KpiConfig[] {
    const k = this.kpiConfigs;
    return k.filter(item => ['OTIF', 'Cancelamentos'].includes(item.label));
  }

  kmCarregadoTotal: number = 120000;
  prevKmCarregadoTotal: number = 110000;
  pedagioOperacionalTotal: number = 12500;
  prevPedagioOperacionalTotal: number = 12000;
  abastecimentoOperacionalTotal: number = 480000;
  prevAbastecimentoOperacionalTotal: number = 450000;
  oficinaMecanicaTotal: number = 18000;
  prevOficinaMecanicaTotal: number = 15000;
  get litrosCarregadoEstimado(): number {
    const r$ = this.abastecimentoOperacionalTotal;
    const litros = r$ / (this.precoMedioLitro || 6);
    return +litros.toFixed(1);
  }
  get consumoMedioCarregadoKmPorLitro(): number {
    const litros = this.litrosCarregadoEstimado;
    if (!litros) return 0;
    const raw = this.kmCarregadoTotal / litros;
    const clamped = Math.min(5.0, Math.max(2.0, raw));
    return +clamped.toFixed(2);
  }
  get tempoMedioCarregadoPorViagem(): number {
    if (!this.numeroViagens) return 0;
    const horasCarregado = Math.max(0, this.tempoOperacaoHoras - this.tempoVazioHoras);
    return +((horasCarregado / this.numeroViagens)).toFixed(2);
  }
  get percentTempoCarregado(): number {
    const horasCarregado = Math.max(0, this.tempoOperacaoHoras - this.tempoVazioHoras);
    const perc = this.tempoOperacaoHoras ? (horasCarregado / this.tempoOperacaoHoras) * 100 : 0;
    return +perc.toFixed(1);
  }

  get custoOperacionalTotal(): number {
    return this.pedagioOperacionalTotal + this.abastecimentoOperacionalTotal + this.oficinaMecanicaTotal;
  }
  get prevCustoOperacionalTotal(): number {
    return this.prevPedagioOperacionalTotal + this.prevAbastecimentoOperacionalTotal + this.prevOficinaMecanicaTotal;
  }
  get custoPorKmCarregado(): number {
    const km = this.kmCarregadoTotal || 1;
    return +(this.custoOperacionalTotal / km).toFixed(2);
  }
  get prevCustoPorKmCarregado(): number {
    const kmPrev = this.prevKmCarregadoTotal || 1;
    const totalPrev = this.prevCustoOperacionalTotal;
    return +(totalPrev / kmPrev).toFixed(2);
  }
  get deltaCustoOperacionalTotal(): number { return +(this.custoOperacionalTotal - this.prevCustoOperacionalTotal).toFixed(2); }
  get deltaCustoPorKmCarregado(): number { return +(this.custoPorKmCarregado - this.prevCustoPorKmCarregado).toFixed(2); }
  get deltaConsumoMedioCarregado(): number { return +(this.consumoMedioCarregadoKmPorLitro - this.prevConsumoMedioCarregadoKmPorLitro).toFixed(2); }
  get deltaTempoMedioCarregado(): number { return +(this.tempoMedioCarregadoPorViagem - this.prevTempoMedioCarregadoPorViagem).toFixed(2); }

  get kpisCustoOperacionalPrincipais(): KpiConfig[] {
    const t1 = this.trendIconColor(this.percentTempoCarregado, this.percentTempoCarregado - 1, 'down');
    const t2 = this.trendIconColor(this.kmCarregadoTotal, this.prevKmCarregadoTotal, 'up');
    const t3 = this.trendIconColor(this.custoOperacionalTotal, this.prevCustoOperacionalTotal, 'down');
    const t4 = this.trendIconColor(this.custoPorKmCarregado, this.prevCustoPorKmCarregado, 'down');
    const t5 = this.trendIconColor(this.consumoMedioCarregadoKmPorLitro, this.prevConsumoMedioCarregadoKmPorLitro, 'up');
    const t6 = this.trendIconColor(this.tempoMedioCarregadoPorViagem, this.prevTempoMedioCarregadoPorViagem, 'down');
    const dKm = this.kmCarregadoTotal - this.prevKmCarregadoTotal;
    return [
      { label: '% de tempo carregado', value: this.percentTempoCarregado, icon: 'pause-circle', format: 'percentage', color: t1.color, delta: +(this.percentTempoCarregado - (this.percentTempoCarregado - 1)).toFixed(1), deltaFormat: 'percentage', betterDirection: 'down' },
      { label: 'KM carregado total', value: this.kmCarregadoTotal, icon: 'route', format: 'number', color: t2.color, delta: dKm, deltaFormat: 'number', betterDirection: 'up' },
      { label: 'Custo operacional total', value: this.custoOperacionalTotal, icon: 'currency', format: 'currency', color: t3.color, delta: this.deltaCustoOperacionalTotal, deltaFormat: 'currency', betterDirection: 'down' },
      { label: 'Custo por KM (carregado)', value: this.custoPorKmCarregado, icon: 'currency', format: 'currency', color: t4.color, delta: this.deltaCustoPorKmCarregado, deltaFormat: 'currency', betterDirection: 'down' },
      { label: 'Consumo médio carregado (km/l)', value: this.consumoMedioCarregadoKmPorLitro, icon: 'refresh', format: 'number', color: t5.color, delta: this.deltaConsumoMedioCarregado, deltaFormat: 'number', betterDirection: 'up' },
      { label: 'Tempo médio carregado por viagem (h)', value: this.tempoMedioCarregadoPorViagem, icon: 'clock', format: 'number', color: t6.color, delta: this.deltaTempoMedioCarregado, deltaFormat: 'number', deltaSuffix: 'h', betterDirection: 'down' },
    ];
  }

  get kpisCustoOperacionalAnaliticos(): KpiConfig[] {
    const horasCarregado = Math.max(0, this.tempoOperacaoHoras - this.tempoVazioHoras);
    const custoMedioHoraCarregado = horasCarregado ? +(this.custoOperacionalTotal / horasCarregado).toFixed(2) : 0;
    const abastecimentosCarregadoPerc = Math.max(0, Math.min(100, 100 - Math.round(this.proporcaoCombustivelVazioPerc)));
    return [
      { label: 'Custo combustível carregado (R$)', value: this.abastecimentoOperacionalTotal, icon: 'currency', format: 'currency', color: '#7c3aed' },
      { label: 'Custo pedágio carregado (R$)', value: this.pedagioOperacionalTotal, icon: 'currency', format: 'currency', color: '#0ea5e9' },
      { label: 'Custo médio por hora carregado (R$/h)', value: custoMedioHoraCarregado, icon: 'currency', format: 'currency', color: 'var(--brand-primary)' },
      { label: 'Abastecimentos durante carregado (%)', value: abastecimentosCarregadoPerc, icon: 'refresh', format: 'percentage', color: 'var(--warning, #d97706)' },
      { label: 'Oficina Mecânica (R$)', value: this.oficinaMecanicaTotal, icon: 'currency', format: 'currency', color: '#f59e0b' },
    ];
  }

  prevConsumoMedioCarregadoKmPorLitro: number = 0;
  prevTempoMedioCarregadoPorViagem: number = 0;
  serieCustoOperacionalTotal6m: number[] = [];
  serieCustoPorKmCarregado6m: number[] = [];
  serieConsumoMedioCarregado6m: number[] = [];
  serieTempoMedioCarregado6m: number[] = [];

  rankingOperacionalData: { placa: string; kmCarregado: number; custoPorKm: number; consumoCarregado: number; pedagio: number; abastecimento: number; oficina: number; custoOperacionalTotal: number }[] = [];
  get rankingCustoOperacional(): { placa: string; kmCarregado: number; custoPorKm: number; consumoCarregado: number; pedagio: number; abastecimento: number; oficina: number; custoOperacionalTotal: number }[] {
    return this.rankingOperacionalData;
  }

  get mapQuickStats(): { label: string; value: number; color: string }[] {
    const viajando = this.vehicles.filter(v => v.status === 'Viajando').length;
    const manutencao = this.vehicles.filter(v => v.status === 'Manutenção').length;
    const emRota = this.fretesIntervalo().filter(f => f.status === 'Em Rota').length;
    return [
      { label: 'Viajando', value: viajando, color: 'var(--brand-primary)' },
      { label: 'Em Rota', value: emRota, color: 'var(--info)' },
      { label: 'Manutenção', value: manutencao, color: 'var(--warning, #d97706)' }
    ];
  }

  get intervalLabel(): string {
    const { inicio, fim, hasCustom } = this.intervalDates();
    return hasCustom ? `${this.formatDateLabel(inicio)} - ${this.formatDateLabel(fim)}` : 'últimos 30 dias';
  }

  private gerarSerie6m(base: number, variacaoPerc: number, decimals: number = 2): number[] {
    const arr: number[] = [];
    let val = base;
    for (let i = 5; i >= 0; i--) {
      const factor = 1 + ((Math.random() - 0.5) * 2) * (variacaoPerc / 100);
      val = +(val * factor).toFixed(decimals);
      arr.unshift(val);
    }
    return arr;
  }
  get mesesUltimos6Labels(): string[] {
    const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const now = new Date();
    const labels: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(months[d.getMonth()]);
    }
    return labels;
  }
  onParamsChanged(): void { this.computePrevAndSeries(); }
  get deltaPercentTempoVazio(): number { return +(this.percentTempoVazio - this.prevPercentTempoVazio).toFixed(1); }
  get deltaCustoVazioTotal(): number { return +(this.custoVazioEstimado - this.prevCustoVazioEstimado).toFixed(2); }
  get deltaCustoPorKmVazio(): number { return +(this.custoPorKmVazio - this.prevCustoPorKmVazio).toFixed(2); }
  get deltaConsumoMedioVazio(): number { return +(this.consumoMedioVazioKmPorLitro - this.prevConsumoMedioVazioKmPorLitro).toFixed(2); }
  get deltaTempoMedioVazio(): number { return +(this.tempoMedioVazioPorViagem - this.prevTempoMedioVazioPorViagem).toFixed(2); }
  

  excecoesFiltersCollapsed = true;
  excecoesFiltersConfig: FilterConfig[] = [
    {
      type: 'select', label: 'Tipo', key: 'tipo', value: '',
      options: [
        { value: 'Atraso', label: 'Atrasos' },
        { value: 'Desvio de rota', label: 'Desvios de rota' },
        { value: 'Excesso de tempo parado', label: 'Excesso de tempo parado' }
      ],
      placeholder: 'Todos os tipos'
    },
    { type: 'select', label: 'Status', key: 'status', value: '', options: [
      { value: 'aberta', label: 'Aberta' },
      { value: 'em_andamento', label: 'Em andamento' },
      { value: 'resolvida', label: 'Resolvida' }
    ], placeholder: 'Todos os status' },
    { type: 'date', label: 'Data início', key: 'dataIni', value: '' },
    { type: 'date', label: 'Data fim', key: 'dataFim', value: '' },
    { type: 'text', label: 'Veículo', key: 'veiculo', placeholder: 'Ex.: FROTA-1234', value: '' },
    { type: 'text', label: 'Filial', key: 'filial', placeholder: 'Ex.: São Paulo', value: '' },
    { type: 'text', label: 'Responsável', key: 'responsavel', placeholder: 'Nome', value: '' }
  ];

  ocorrencias: { id: number; tipo: string; status: 'aberta'|'em_andamento'|'resolvida'; data: string; veiculo: string; filial: string; responsavel: string }[] = [
    { id: 1, tipo: 'Atraso', status: 'em_andamento', data: this.isoDaysAgo(1), veiculo: 'FROTA-1001', filial: 'São Paulo', responsavel: 'Ana' },
    { id: 2, tipo: 'Desvio de rota', status: 'aberta', data: this.isoDaysAgo(2), veiculo: 'FROTA-1002', filial: 'Rio de Janeiro', responsavel: 'Bruno' },
    { id: 3, tipo: 'Excesso de tempo parado', status: 'aberta', data: this.isoDaysAgo(0), veiculo: 'FROTA-1003', filial: 'Fortaleza', responsavel: 'Carla' },
    { id: 4, tipo: 'Atraso', status: 'resolvida', data: this.isoDaysAgo(0), veiculo: 'FROTA-1004', filial: 'São Paulo', responsavel: 'Diego' },
    { id: 5, tipo: 'Desvio de rota', status: 'em_andamento', data: this.isoDaysAgo(3), veiculo: 'FROTA-1005', filial: 'Belo Horizonte', responsavel: 'Eduardo' },
    { id: 6, tipo: 'Atraso', status: 'aberta', data: this.isoDaysAgo(4), veiculo: 'FROTA-1006', filial: 'Campinas', responsavel: 'Fernanda' },
    { id: 7, tipo: 'Excesso de tempo parado', status: 'resolvida', data: this.isoDaysAgo(0), veiculo: 'FROTA-1007', filial: 'Curitiba', responsavel: 'Gustavo' },
    { id: 8, tipo: 'Atraso', status: 'em_andamento', data: this.isoDaysAgo(5), veiculo: 'FROTA-1008', filial: 'São Paulo', responsavel: 'Helena' },
    { id: 9, tipo: 'Desvio de rota', status: 'resolvida', data: this.isoDaysAgo(1), veiculo: 'FROTA-1009', filial: 'Recife', responsavel: 'Igor' },
    { id: 10, tipo: 'Excesso de tempo parado', status: 'aberta', data: this.isoDaysAgo(2), veiculo: 'FROTA-1010', filial: 'Porto Alegre', responsavel: 'Juliana' }
  ];

  ocorrenciasFiltradas = [...this.ocorrencias];

  excecoesGridColumns: GridColumn[] = [
    { key: 'id', label: 'ID', width: '64px', align: 'center', sortable: true, sticky: true, stickyLeft: 0 },
    { key: 'data', label: 'Data', type: 'date', width: '120px', sortable: true },
    { key: 'tipo', label: 'Tipo', width: '220px', sortable: true },
    { key: 'status', label: 'Status', width: '140px', sortable: true },
    { key: 'veiculo', label: 'Veículo', width: '140px', sortable: true },
    { key: 'filial', label: 'Filial', width: '180px', sortable: true },
    { key: 'responsavel', label: 'Responsável', width: '180px', sortable: true }
  ];

  get totalOcorrencias(): number { return this.ocorrencias.length; }
  get totalAbertas(): number { return this.ocorrencias.filter(o => o.status !== 'resolvida').length; }
  get totalEmAndamento(): number { return this.ocorrencias.filter(o => o.status === 'em_andamento').length; }
  get resolvidasHoje(): number {
    const hoje = new Date().toISOString().slice(0,10);
    return this.ocorrencias.filter(o => o.status === 'resolvida' && o.data.slice(0,10) === hoje).length;
  }
  get percResolvidas(): number {
    const res = this.ocorrencias.filter(o => o.status === 'resolvida').length;
    return +((res / (this.totalOcorrencias || 1)) * 100).toFixed(1);
  }

  get kpisOcorrenciasPrincipais(): KpiConfig[] {
    return [
      { label: 'Total de ocorrências abertas', value: this.totalAbertas, icon: 'alert', format: 'number', color: '#ef4444' },
      { label: 'Ocorrências em andamento', value: this.totalEmAndamento, icon: 'refresh', format: 'number', color: '#0ea5e9' },
      { label: 'Resolvidas hoje', value: this.resolvidasHoje, icon: 'check-circle', format: 'number', color: '#22c55e' },
      { label: '% resolvidas', value: this.percResolvidas, icon: 'check-circle', format: 'percentage', color: 'var(--brand-primary)' }
    ];
  }

  get ocorrenciasPorTipoLabels(): string[] {
    return ['Atraso', 'Desvio de rota', 'Excesso de tempo parado'];
  }
  get ocorrenciasPorTipoCounts(): number[] {
    const map: Record<string, number> = { 'Atraso': 0, 'Desvio de rota': 0, 'Excesso de tempo parado': 0 };
    this.ocorrencias.forEach(o => { map[o.tipo] = (map[o.tipo] || 0) + 1; });
    return this.ocorrenciasPorTipoLabels.map(l => map[l] || 0);
  }
  get ocorrenciasResolucaoPercPorTipo(): number[] {
    const totalByType: Record<string, number> = { 'Atraso': 0, 'Desvio de rota': 0, 'Excesso de tempo parado': 0 };
    const resolvedByType: Record<string, number> = { 'Atraso': 0, 'Desvio de rota': 0, 'Excesso de tempo parado': 0 };
    this.ocorrencias.forEach(o => {
      totalByType[o.tipo] = (totalByType[o.tipo] || 0) + 1;
      if (o.status === 'resolvida') resolvedByType[o.tipo] = (resolvedByType[o.tipo] || 0) + 1;
    });
    return this.ocorrenciasPorTipoLabels.map(l => {
      const t = totalByType[l] || 0;
      const r = resolvedByType[l] || 0;
      return t ? Math.round((r / t) * 100) : 0;
    });
  }

  get statusDistribuicao(): { label: string; color: string; count: number }[] {
    const defs = [
      { label: 'Aberta', key: 'aberta' as const, color: '#ef4444' },
      { label: 'Em andamento', key: 'em_andamento' as const, color: '#0ea5e9' },
      { label: 'Resolvida', key: 'resolvida' as const, color: '#22c55e' }
    ];
    return defs.map(d => ({ label: d.label, color: d.color, count: this.ocorrencias.filter(o => o.status === d.key).length }));
  }
  get tipoDistribuicao(): { label: string; color: string; count: number }[] {
    const defs = [
      { label: 'Atraso', key: 'Atraso' as const, color: '#ef4444' },
      { label: 'Desvio de rota', key: 'Desvio de rota' as const, color: '#0ea5e9' },
      { label: 'Excesso de tempo parado', key: 'Excesso de tempo parado' as const, color: '#6366f1' }
    ];
    return defs.map(d => ({ label: d.label, color: d.color, count: this.ocorrencias.filter(o => o.tipo === d.key).length }));
  }
  get donutSegmentsTipo(): { dasharray: string; offset: number; color: string; label: string; perc: number }[] {
    const dist = this.tipoDistribuicao.filter(s => s.count > 0);
    const total = dist.reduce((acc, s) => acc + s.count, 0) || 1;
    const radius = 50;
    const circ = Math.PI * 2 * radius;
    let accPerc = 0;
    return dist.map(s => {
      const perc = +((s.count / total) * 100).toFixed(1);
      const len = (perc / 100) * circ;
      const dasharray = `${len} ${circ - len}`;
      const offset = (accPerc / 100) * circ;
      accPerc += perc;
      return { dasharray, offset, color: s.color, label: s.label, perc };
    });
  }
  get donutSegments(): { dasharray: string; offset: number; color: string; label: string; perc: number }[] {
    const total = this.statusDistribuicao.reduce((acc, s) => acc + s.count, 0) || 1;
    const radius = 50;
    const circ = Math.PI * 2 * radius;
    let accPerc = 0;
    return this.statusDistribuicao.map(s => {
      const p = s.count / total;
      const dasharray = `${(p * circ).toFixed(2)} ${circ.toFixed(2)}`;
      const seg = { dasharray, offset: +(accPerc * circ).toFixed(2), color: s.color, label: s.label, perc: Math.round(p * 100) };
      accPerc += p;
      return seg;
    });
  }

  get ocorrenciasTimelineLabels(): string[] {
    return Array.from({ length: 8 }).map((_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (7 - i));
      return `${(d.getDate()).toString().padStart(2, '0')}/${(d.getMonth()+1).toString().padStart(2, '0')}`;
    });
  }
  get ocorrenciasTimelineSeries(): number[] {
    const map: Record<string, number> = {};
    this.ocorrencias.forEach(o => {
      const d = new Date(o.data);
      const key = `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}`;
      map[key] = (map[key] || 0) + 1;
    });
    return this.ocorrenciasTimelineLabels.map(l => map[l] || 0);
  }

  zeroSeriesByLabel(labels: string[]): number[] { return labels.map(() => 0); }

  onExcecoesFiltersChange(values: any): void {
    this.applyExcecoesFilters(values);
  }
  onExcecoesApplyFilters(values: any): void {
    this.applyExcecoesFilters(values);
  }
  onExcecoesClearFilters(): void {
    const cleared: any = {};
    this.excecoesFiltersConfig.forEach(f => cleared[f.key] = '');
    this.applyExcecoesFilters(cleared);
  }
  private applyExcecoesFilters(values: any): void {
    const ini = values?.dataIni ? new Date(values.dataIni) : null;
    const fim = values?.dataFim ? new Date(values.dataFim) : null;
    const tipo = (values?.tipo || '').toString().toLowerCase();
    const status = (values?.status || '').toString().toLowerCase();
    const veiculo = (values?.veiculo || '').toString().toLowerCase();
    const filial = (values?.filial || '').toString().toLowerCase();
    const responsavel = (values?.responsavel || '').toString().toLowerCase();
    this.ocorrenciasFiltradas = this.ocorrencias.filter(o => {
      const d = new Date(o.data);
      const byTipo = !tipo || o.tipo.toLowerCase() === tipo;
      const byStatus = !status || o.status.toLowerCase() === status;
      const byIni = !ini || d >= ini;
      const byFim = !fim || d <= fim;
      const byVeic = !veiculo || o.veiculo.toLowerCase().includes(veiculo);
      const byFilial = !filial || o.filial.toLowerCase().includes(filial);
      const byResp = !responsavel || o.responsavel.toLowerCase().includes(responsavel);
      return byTipo && byStatus && byIni && byFim && byVeic && byFilial && byResp;
    });
  }

  private isoDaysAgo(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString();
  }
}