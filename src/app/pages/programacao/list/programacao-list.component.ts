import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChangeDetectorRef } from '@angular/core';
import {
  FilterSectionComponent,
  FilterConfig,
  PageLayoutComponent,
  KpiSectionComponent,
  KpiConfig,
  ActionButtonComponent,
  ActionButtonConfig,
  GridSectionComponent,
  GridColumn
} from '@shared/components';
import { ProgramacaoRow } from '../models/programacao.model';
import { ProgramacaoService } from '../services/programacao.service';
import { FILTER_CONFIGS, GRID_COLUMNS, getKpiConfigs } from './programacao-list.config';
import { EntregasModalComponent } from '../components/entregas-modal/entregas-modal.component';

@Component({
  selector: 'app-programacao',
  templateUrl: './programacao-list.component.html',
  styleUrls: ['./programacao-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FilterSectionComponent,
    KpiSectionComponent,
    ActionButtonComponent,
    GridSectionComponent,
    PageLayoutComponent,
    EntregasModalComponent
  ]
})
export class ProgramacaoComponent implements OnInit {
  constructor(
    private cdr: ChangeDetectorRef,
    private programacaoService: ProgramacaoService
  ) { }
  loading = false;
  filtersCollapsed = true;
  kpisCollapsed = false;
  totalMotoristas = 0;
  veiculosEmRota = 0;
  veiculosParados = 0;
  receitaTotal = 0;
  filterConfigs = FILTER_CONFIGS;
  kpiConfigs: KpiConfig[] = getKpiConfigs(0, 0, 0, 0);

  actionButtonConfigs: ActionButtonConfig[] = [];

  useMockData = true;
  rows: ProgramacaoRow[] = [];

  filtroDataInicio: string | null = null;
  filtroDataRecebida: string | null = null;
  filtroEnvioSefaz: string = '';
  filtroRankingDiario: string = '';
  filtroFrota: string = '';
  filtroVeiculo: string = '';
  filtroCoordenador: string = '';
  filtroMotorista: string = '';
  filtroCidade: string = '';
  filtroSituacaoVeiculo: string = '';
  filtroSituacaoMotorista: string = '';
  filtroTipoOperacaoFrota: string = '';
  filtroTempoMinFora: string = '';

  get filtered(): ProgramacaoRow[] {
    let data = this.rows;
    if (this.filtroEnvioSefaz) { }
    if (this.filtroRankingDiario) { }
    if (this.filtroFrota) data = data.filter(r => r.frota.includes(String(this.filtroFrota)));
    if (this.filtroVeiculo) {
      const placa = this.filtroVeiculo.includes('||')
        ? this.filtroVeiculo.split('||')[1]
        : this.filtroVeiculo;
      data = data.filter(r => r.veiculoPlaca && r.veiculoPlaca.toLowerCase().includes(placa.toLowerCase()));
    }
    if (this.filtroCoordenador) {
      const nomeCoordenador = this.filtroCoordenador.includes('||')
        ? this.filtroCoordenador.split('||')[1]
        : this.filtroCoordenador;
      data = data.filter(r => r.coordenador && r.coordenador.toLowerCase().includes(nomeCoordenador.toLowerCase()));
    }
    if (this.filtroMotorista) {
      const nomeMotorista = this.filtroMotorista.includes('||')
        ? this.filtroMotorista.split('||')[1]
        : this.filtroMotorista;
      data = data.filter(r => r.motorista && r.motorista.toLowerCase().includes(nomeMotorista.toLowerCase()));
    }
    if (this.filtroCidade) {
      const nomeCidade = this.filtroCidade.includes('||')
        ? this.filtroCidade.split('||')[1]
        : this.filtroCidade;
      data = data.filter(r => r.localizacao && r.localizacao.cidade && r.localizacao.cidade.toLowerCase().includes(nomeCidade.toLowerCase()));
    }
    if (this.filtroSituacaoVeiculo) data = data.filter(r => r.situacaoVeiculo === this.filtroSituacaoVeiculo);
    if (this.filtroSituacaoMotorista) data = data.filter(r => r.situacaoMotorista === this.filtroSituacaoMotorista);
    if (this.filtroTipoOperacaoFrota) data = data.filter(r => r.tipoOperacaoFrota === this.filtroTipoOperacaoFrota);
    if (this.filtroTempoMinFora) {
      const min = Number(this.filtroTempoMinFora) || 0;
      data = data.filter(r => (Number(this.tempoForaDiasInt(r.tempoFora)) || 0) >= min);
    }
    return data;
  }

  page = 1;
  pageSize = 25;
  pageSizeOptions = [25, 50, 250];

  get paged(): ProgramacaoRow[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filtered.slice(start, start + this.pageSize);
  }
  get pageCount(): number {
    const total = this.filtered.length;
    return Math.max(1, Math.ceil(total / this.pageSize));
  }
  nextPage(): void { if (this.page < this.pageCount) this.page++; }
  prevPage(): void { if (this.page > 1) this.page--; }
  firstPage(): void { this.page = 1; }
  lastPage(): void { this.page = this.pageCount; }

  verRota(r: ProgramacaoRow): void { console.log('Ver rota', r); }

  entregasModalOpen = false;
  selectedFrota = '';

  private formatTempoForaAsDays(t: string): string {
    const val = this.tempoForaDiasInt(t);
    const n = typeof val === 'string' ? Number(val) : val;
    return String(n || 0);
  }

  private tempoForaDiasInt(t: string): number | string {
    if (!t) return 0;
    const plain = t.trim();
    if (/^\d+$/.test(plain)) return Number(plain);
    const dMatch = plain.match(/(\d+)d/i);
    const hMatch = plain.match(/(\d+)h/i);
    const d = dMatch ? Number(dMatch[1]) : 0;
    const h = hMatch ? Number(hMatch[1]) : 0;
    return d + (h / 24);
  }

  gridCollapsed = false;
  gridColumns = GRID_COLUMNS;

  get gridRows(): any[] {
    return this.paged.map(row => ({
      ...row,
      tempoFora: Number(this.formatTempoForaAsDays(row.tempoFora)),
      localizacao: `${row.localizacao.cidade}/${row.localizacao.uf}`
    }));
  }

  onGridAction(evt: { action: string; row: any }): void {
    switch (evt.action) {
      case 'abrir-entregas':
        this.abrirEntregas(evt.row as ProgramacaoRow);
        break;
      case 'abrir-jornada':
        this.abrirJornada(evt.row as ProgramacaoRow);
        break;
    }
  }

  onActionButtonClick(action: string): void { console.log('Ação:', action); }
  abrirEntregas(r: ProgramacaoRow): void {
    this.selectedFrota = r.frota;
    this.entregasModalOpen = true;
  }

  abrirJornada(r: ProgramacaoRow): void { console.log('Abrir Jornada (modal)', r); }

  toggleFilters(): void { this.filtersCollapsed = !this.filtersCollapsed; }

  limparFiltros(): void {
    this.filtroDataInicio = null;
    this.filtroDataRecebida = null;
    this.filtroEnvioSefaz = '';
    this.filtroRankingDiario = '';
    this.filtroFrota = '';
    this.filtroVeiculo = '';
    this.filtroCoordenador = '';
    this.filtroMotorista = '';
    this.filtroCidade = '';
    this.filtroSituacaoVeiculo = '';
    this.filtroSituacaoMotorista = '';
    this.filtroTipoOperacaoFrota = '';
    this.filtroTempoMinFora = '';
    this.calcularMetricas();
  }

  aplicarFiltros(): void {
    this.page = 1;
    this.loadProgramacoes();
  }
  toggleKpis(): void { this.kpisCollapsed = !this.kpisCollapsed; }

  private calcularMetricas(): void {
    const data = this.filtered;
    this.totalMotoristas = data.length;
    this.veiculosEmRota = data.filter(r => r.situacaoVeiculo === 'Em Rota').length;
    this.veiculosParados = data.filter(r => r.situacaoVeiculo === 'Parado').length;
    this.receitaTotal = data.reduce((sum, r) => sum + r.totalReceitas, 0);
    this.updateKpiValues();
  }

  private updateKpiValues(): void {
    this.kpiConfigs = getKpiConfigs(
      this.totalMotoristas,
      this.veiculosEmRota,
      this.veiculosParados,
      this.receitaTotal
    );
  }

  onFiltersChange(filterValues: any): void {
    this.filtroFrota = filterValues.frota || '';
    this.filtroVeiculo = filterValues.veiculo || '';
    this.filtroCoordenador = filterValues.coordenador || '';
    this.filtroMotorista = filterValues.motorista || '';
    this.filtroCidade = filterValues.cidade || '';
    this.filtroSituacaoVeiculo = filterValues.situacaoVeiculo || '';
    this.filtroSituacaoMotorista = filterValues.situacaoMotorista || '';
    this.filtroTipoOperacaoFrota = filterValues.tipoOperacaoFrota || '';
    this.filtroTempoMinFora = filterValues.tempoMinFora || '';
    this.calcularMetricas();
  }

  onApplyFilters(filterValues: any): void { this.onFiltersChange(filterValues); this.aplicarFiltros(); }

  ngOnInit(): void {
    this.loadProgramacoes();
  }

  loadProgramacoes(): void {
    this.loading = true;
    this.cdr.detectChanges();
    this.programacaoService.getProgramacoes().subscribe({
      next: (data) => {
        this.rows = data || [];
        this.calcularMetricas();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
}