import { Component, OnInit, OnDestroy } from '@angular/core';
import { of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  FilterSectionComponent, 
  FilterConfig, 
  KpiSectionComponent, 
  KpiConfig, 
  PageLayoutComponent, 
  MapViewerComponent, 
  MapMarker, 
  MapPolyline, 
  ButtonComponent 
} from '@shared/components';
import { UF_COORDS, CITY_COORDS, CITY_TO_UF, getCityCoords } from '@core/constants/geo.constants';
import { EnderecoCompleto, IntencaoViagem, Veiculo, Vinculo, ViagemService } from '@core/services/viagem.service';
import { distanceKm, buildGreedyRoutePlan } from '@core/utils/route.utils';


@Component({
  selector: 'erp-controle-intencao-viagem',
  standalone: true,
  imports: [CommonModule, FormsModule, FilterSectionComponent, KpiSectionComponent, MapViewerComponent, PageLayoutComponent, ButtonComponent],
  templateUrl: './controle-intencao-viagem-list.component.html',
  styleUrls: ['./controle-intencao-viagem-list.component.scss']
})
export class ControleIntencaoViagemComponent implements OnInit, OnDestroy {
  private readonly useApi = false;
  selectedTab: 'criar' | 'confirmados' = 'criar';
  filtroOrigem = '';
  filtroDestino = '';
  filtroStatus = 'Todos';
  filtroTipoVeiculo = 'Todos';

  filtersCollapsed = true;
  filterConfigs: FilterConfig[] = [
    { type: 'text', label: 'Origem', key: 'origem', placeholder: 'UF/Cidade', value: '' },
    { type: 'text', label: 'Destino', key: 'destino', placeholder: 'UF/Cidade', value: '' },
    { type: 'select', label: 'Status', key: 'status', placeholder: 'Todos', value: '', options: [{ value: 'pendente', label: 'Pendente' }, { value: 'vinculado', label: 'Vinculado' }, { value: 'em_rota', label: 'Em rota' }, { value: 'concluido', label: 'Concluído' }] },
    { type: 'select', label: 'Tipo Veículo', key: 'tipoVeiculo', placeholder: 'Todos', value: '', options: [{ value: 'Leve', label: 'Leve' }, { value: 'VUC', label: 'VUC' }, { value: 'Toco', label: 'Toco' }, { value: 'Carreta', label: 'Carreta' }] }
  ];

  get kpiConfigs(): KpiConfig[] {
    return [
      { label: 'Pré-Cargas', value: this.countIntencoes, icon: 'plus', format: 'number' },
      { label: 'Vinculados', value: this.countVinculados, icon: 'truck', format: 'number' },
      { label: 'Em rota', value: this.countEmRota, icon: 'route', format: 'number' },
      { label: 'Concluídos', value: this.countConcluidos, icon: 'check-circle', format: 'number' }
    ];
  }

  intencoes: IntencaoViagem[] = [];
  veiculos: Veiculo[] = [];
  vinculos: Vinculo[] = [];

  get veiculosDisponiveis(): Veiculo[] {
    const bloqueados = new Set(this.vinculos.filter(v => v.confirmado).map(v => v.veiculo));
    const base = this.veiculos.filter(v => !bloqueados.has(v));
    const i = this.lockedIntencaoIndex !== null ? this.intencoes[this.lockedIntencaoIndex] : null;
    return i ? base.filter(v => this.viagemService.isVeiculoProximoDaOrigem(v, i)) : base;
  }

  selecionadaIntencaoIndex: number | null = null;
  selecionadoVeiculoIndex: number | null = null;
  lockedIntencaoIndex: number | null = null;
  lockedVeiculoIndex: number | null = null;

  modalMarkers: MapMarker[] = [];
  modalPolylines: MapPolyline[] = [];
  modalCenter: [number, number] = [-14.235004, -51.92528];
  modalZoom: number = 4;

  modalRouteTotalKm: number = 0;
  modalRouteEtaHoras: number = 0;
  modalRouteOrderedPoints: string[] = [];

  onSelecionarOuLockarIntencao(index: number): void {
    this.selecionadaIntencaoIndex = index;
    this.lockedIntencaoIndex = this.lockedIntencaoIndex === index ? null : index;
  }



  motoristaModalOpen = false;
  motoristaModalForIndex: number | null = null;
  motoristaTemp = '';
  openMotoristaModalFor(idx: number): void { this.motoristaModalForIndex = idx; this.motoristaTemp = this.vinculos[idx]?.motorista || ''; this.motoristaModalOpen = true; }
  closeMotoristaModal(): void { this.motoristaModalOpen = false; this.motoristaModalForIndex = null; this.motoristaTemp = ''; }
  saveMotorista(): void {
    if (this.motoristaModalForIndex === null) return;
    const v = this.vinculos[this.motoristaModalForIndex];
    if (!v) { this.closeMotoristaModal(); return; }
    const nome = (this.motoristaTemp || '').trim();
    if (nome) {
      v.motorista = nome;
      this.viagemService.saveVinculos(this.vinculos).subscribe();
    }
    this.closeMotoristaModal();
  }

  constructor(
    private viagemService: ViagemService
  ) {}

  ngOnInit(): void {
    this.syncFilterConfigValues();
    this.loadData();
  }

  private loadData(): void {
    this.viagemService.getVinculos().subscribe(vinculos => {
      this.vinculos = vinculos;
      this.viagemService.getVeiculos().subscribe(veiculos => {
        this.veiculos = veiculos;
        this.viagemService.getIntencoes().subscribe(intencoes => {
          this.intencoes = intencoes;
          this.removeLinkedIntencoes();
        });
      });
    });
  }

  get countIntencoes(): number { return this.intencoes.length; }
  get countVinculados(): number { return this.vinculos.filter(v => v.confirmado === true).length; }
  get countEmRota(): number { return this.vinculos.filter(v => v.status === 'em_rota').length; }
  get countConcluidos(): number { return this.vinculos.filter(v => v.status === 'concluido').length; }

  dragIntencaoIndex: number | null = null;
  dragOverVeiculoIndex: number | null = null;
  highlightVinculoRef: Vinculo | null = null;

  undoVisible = false;
  private undoTimer: any = null;
  private lastUndo: { intencao: IntencaoViagem; vinculoRef: Vinculo; originalIndex: number } | null = null;

  successVisible = false;
  successMessage = '';
  private successTimer: any = null;
  private showSuccess(msg: string, timeoutMs: number = 2200): void {
    this.successMessage = msg;
    this.successVisible = true;
    if (this.successTimer) { clearTimeout(this.successTimer); }
    this.successTimer = setTimeout(() => { this.successVisible = false; this.successMessage = ''; }, timeoutMs);
  }

  veiculoVinculosModalOpen = false;
  veiculoVinculosModalForIndex: number | null = null;

  ngOnDestroy(): void {
    if (this.successTimer) { clearTimeout(this.successTimer); }
    if (this.undoTimer) { clearTimeout(this.undoTimer); }
  }



  private intencaoEquals(a: IntencaoViagem, b: IntencaoViagem): boolean {
    if (!a || !b) return false;
    if (a.codigo && b.codigo) return a.codigo === b.codigo;
    return a.origem.uf === b.origem.uf && a.origem.cidade === b.origem.cidade &&
           a.destino.uf === b.destino.uf && a.destino.cidade === b.destino.cidade &&
           a.pesoKg === b.pesoKg && (a.tipoCarga || '') === (b.tipoCarga || '');
  }

  private removeLinkedIntencoes(): void {
    this.intencoes = this.intencoes.filter(i => !this.vinculos.some(v => this.intencaoEquals(v.intencao, i)));
  }

  onFiltersChange(values: any): void { this.applyFilters(values); }
  onApplyFilters(values: any): void {
    this.applyFilters(values);
    this.loadData();
  }
  private applyFilters(values: any): void {
    this.filtroOrigem = values?.origem || ''; this.filtroDestino = values?.destino || '';
    this.filtroStatus = values?.status ? values.status : 'Todos';
    this.filtroTipoVeiculo = values?.tipoVeiculo ? values.tipoVeiculo : 'Todos';
    this.syncFilterConfigValues();
  }

  onClearFilters(): void {
    this.filtroOrigem = ''; this.filtroDestino = ''; this.filtroStatus = 'Todos'; this.filtroTipoVeiculo = 'Todos';
    this.filterConfigs.forEach(f => f.value = '');
  }

  private syncFilterConfigValues(): void {
    const map: Record<string, any> = { origem: this.filtroOrigem, destino: this.filtroDestino, status: this.filtroStatus === 'Todos' ? '' : this.filtroStatus, tipoVeiculo: this.filtroTipoVeiculo === 'Todos' ? '' : this.filtroTipoVeiculo };
    this.filterConfigs.forEach(f => f.value = map[f.key] ?? '');
  }

  getStatusClass(status: Vinculo['status']) {
    const base = 'px-2.5 py-1 rounded-full text-xs font-semibold capitalize border';
    switch (status) {
      case 'em_rota':
        return `${base} bg-success-bg text-success border-success/35`;
      case 'pendente':
        return `${base} bg-warning-bg text-warning border-warning/35`;
      case 'concluido':
        return `${base} bg-info-bg text-info border-info/35`;
      case 'vinculado':
        return `${base} bg-purple-500/10 text-purple-600 border border-purple-600/30`;
      default:
        return `${base} bg-surface-secondary text-text-secondary border-border`;
    }
  }

  formatValorPreCarga(valor: number | null | undefined): string {
    if (valor == null) return '—';
    try {
      return valor.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    } catch {
      return `R$ ${valor.toFixed(2)}`;
    }
  }

  get preCargasDisponiveis(): IntencaoViagem[] {
    const v = this.lockedVeiculoIndex !== null ? this.veiculos[this.lockedVeiculoIndex] : null;
    return v ? this.intencoes.filter(i => this.viagemService.isIntencaoProximaDoDestinoVeiculo(i, v)) : this.intencoes;
  }

  onSelecionarOuLockarVeiculo(index: number): void {
    this.selecionadoVeiculoIndex = index;
    this.abrirModalVinculosVeiculo(index);
  }

  onToggleFiltroPorVeiculo(index: number, ev: MouseEvent): void {
    ev.stopPropagation();
    this.lockedVeiculoIndex = this.lockedVeiculoIndex === index ? null : index;
  }

  canVincular(): boolean { return this.selecionadaIntencaoIndex !== null && this.selecionadoVeiculoIndex !== null; }

  vincularSelecionados(): void {
    if (!this.canVincular()) return;
    const intencao = this.intencoes[this.selecionadaIntencaoIndex!];
    const veiculo = this.veiculos[this.selecionadoVeiculoIndex!];
    const vinculo: Vinculo = { intencao, veiculo, status: 'vinculado', confirmado: false };
    this.vinculos.unshift(vinculo);
    this.viagemService.saveVinculos(this.vinculos).subscribe();
    this.intencoes.splice(this.selecionadaIntencaoIndex!, 1);
    this.viagemService.saveIntencoes(this.intencoes).subscribe();
    this.showUndo(vinculo, intencao, this.selecionadaIntencaoIndex!);
    this.selecionadaIntencaoIndex = null;
    this.selecionadoVeiculoIndex = null;
  }

  onIntencaoDragStart(idx: number, ev: DragEvent): void { this.dragIntencaoIndex = idx; ev.dataTransfer?.setData('text/plain', String(idx)); }
  onIntencaoDragEnd(): void { this.dragIntencaoIndex = null; }
  onVeiculoDragOver(ev: DragEvent): void { ev.preventDefault(); }
  onVeiculoDragEnter(idx: number): void { this.dragOverVeiculoIndex = idx; }
  onVeiculoDragLeave(idx: number): void { if (this.dragOverVeiculoIndex === idx) this.dragOverVeiculoIndex = null; }
  onVeiculoDrop(veiculoIndex: number): void {
    if (this.dragIntencaoIndex === null) return;
    this.selecionadaIntencaoIndex = this.dragIntencaoIndex;
    this.selecionadoVeiculoIndex = veiculoIndex;
    this.vincularSelecionados();
    this.dragOverVeiculoIndex = null;
  }

  removerVinculo(i: number): void {
    const v = this.vinculos[i];
    if (!v) return;
    this.vinculos.splice(i, 1);
    this.viagemService.saveVinculos(this.vinculos).subscribe();
    this.intencoes.unshift(v.intencao);
    this.viagemService.saveIntencoes(this.intencoes).subscribe();
    this.renderModalMap();
  }

  excluirVinculoConfirmado(i: number): void {
    const v = this.vinculos[i];
    if (!v || !v.confirmado) return;
    const removeActions$ = v.viagemId
      ? this.viagemService.removerViagem(v.viagemId)
      : of(undefined);

    removeActions$.subscribe(() => {
      this.vinculos.splice(i, 1);
      this.viagemService.saveVinculos(this.vinculos).subscribe(() => {
        this.intencoes.unshift(v.intencao);
        this.viagemService.saveIntencoes(this.intencoes).subscribe(() => {
          this.removeLinkedIntencoes();
          this.renderModalMap();
        });
      });
    });
  }

  addIntencoesExemplo(): void {
    this.viagemService.addIntencoesExemplo(this.intencoes, this.vinculos).subscribe(novas => {
      this.intencoes = novas;
      this.removeLinkedIntencoes();
    });
  }

  private showUndo(vinculoRef: Vinculo, intencao: IntencaoViagem, originalIndex: number): void {
    this.highlightVinculoRef = vinculoRef;
    this.undoVisible = true;
    this.lastUndo = { intencao, vinculoRef, originalIndex };
    if (this.undoTimer) clearTimeout(this.undoTimer);
    this.undoTimer = setTimeout(()=> this.clearUndo(), 4000);
  }

  clearUndo(): void { this.undoVisible = false; this.highlightVinculoRef = null; }

  undoLinking(): void {
    if (!this.lastUndo) return;
    const { intencao, vinculoRef, originalIndex } = this.lastUndo;
    const idx = this.vinculos.indexOf(vinculoRef);
    if (idx >= 0) this.vinculos.splice(idx,1);
    this.intencoes.splice(originalIndex, 0, intencao);
    this.viagemService.saveVinculos(this.vinculos).subscribe();
    this.viagemService.saveIntencoes(this.intencoes).subscribe();
    this.clearUndo();
  }

  vinculosCountDoVeiculo(veiculoIndex: number): number { return this.vinculos.filter(v => this.veiculos.indexOf(v.veiculo) === veiculoIndex).length; }
  vinculosPendentesCountDoVeiculo(veiculoIndex: number): number {
    return this.vinculos.filter(v => this.veiculos.indexOf(v.veiculo) === veiculoIndex && v.status === 'vinculado' && !v.confirmado).length;
  }

  abrirModalVinculosVeiculo(veiculoIndex: number): void {
    this.veiculoVinculosModalForIndex = veiculoIndex;
    this.veiculoVinculosModalOpen = true;
    this.renderModalMap();
  }

  fecharModalVinculosVeiculo(): void {
    this.veiculoVinculosModalOpen = false;
    this.veiculoVinculosModalForIndex = null;
    this.modalMarkers = [];
    this.modalPolylines = [];
  }

  get modalVinculos(): { i: number; v: Vinculo }[] { return this.vinculos.map((v, i) => ({ i, v })).filter(x => this.veiculos.indexOf(x.v.veiculo) === this.veiculoVinculosModalForIndex); }

  iniciarRota(i: number): void { const v = this.vinculos[i]; if (!v) return; v.status = 'em_rota'; this.viagemService.saveVinculos(this.vinculos).subscribe(); }
  concluirVinculo(i: number): void { const v = this.vinculos[i]; if (!v) return; v.status = 'concluido'; this.viagemService.saveVinculos(this.vinculos).subscribe(); }
  confirmarVinculo(i: number): void {
    const v = this.vinculos[i];
    if (!v) return;
    this.viagemService.confirmarVinculos([v]).subscribe(() => {
      this.openMotoristaModalFor(i);
    });
  }
  confirmarComMotorista(): void { this.saveMotorista(); }

  private getCoordsForVehicle(v: Veiculo): [number, number] | null {
    const loc = v.localizacao || '';
    const uf = CITY_TO_UF[loc] || v.destinoUf || '';
    return getCityCoords(uf, loc);
  }

  private getCoordsForVeiculoDestino(v: Veiculo): [number, number] | null {
    const destUf = v.destinoUf || CITY_TO_UF[v.destinoCidade || ''] || '';
    return getCityCoords(destUf, v.destinoCidade);
  }

  private renderModalMap(): void {
    const markers: MapMarker[] = [];
    const polylines: MapPolyline[] = [];

    const idx = this.veiculoVinculosModalForIndex;
    if (idx === null || idx === undefined) {
      this.modalMarkers = [];
      this.modalPolylines = [];
      return;
    }
    const veiculo = this.veiculos[idx];
    const vCoords = this.getCoordsForVehicle(veiculo);
    const vDestCoords = this.getCoordsForVeiculoDestino(veiculo);
    const startMarkerCoords = vDestCoords || vCoords;

    if (startMarkerCoords) {
      markers.push({
        lat: startMarkerCoords[0],
        lng: startMarkerCoords[1],
        iconType: 'truck',
        tooltipText: `Veículo: ${veiculo.placa}`
      });
    }

    const vincs = this.getModalVinculosOrdered();

    for (const v of vincs) {
      const oc = getCityCoords(v.intencao.origem.uf, v.intencao.origem.cidade);
      const dc = getCityCoords(v.intencao.destino.uf, v.intencao.destino.cidade);
      if (oc) {
        markers.push({
          lat: oc[0],
          lng: oc[1],
          iconType: 'origin',
          popupHtml: `Origem: ${v.intencao.origem.cidade} - ${v.intencao.origem.uf}`
        });
      }
      if (dc) {
        markers.push({
          lat: dc[0],
          lng: dc[1],
          iconType: 'destination',
          popupHtml: `Destino: ${v.intencao.destino.cidade} - ${v.intencao.destino.uf}`
        });
      }
    }

    const firstOrigCoords = vincs.length
      ? getCityCoords(vincs[0].intencao.origem.uf, vincs[0].intencao.origem.cidade)
      : null;
    const start = vDestCoords || vCoords || firstOrigCoords;
    const plan = start ? buildGreedyRoutePlan(vincs, start) : [];
    this.modalRouteOrderedPoints = plan.map(p => p.label);
    const routeWaypoints = plan.map(p => p.coords);

    let totalKm = 0;
    for (let i = 0; i < routeWaypoints.length - 1; i++) {
      totalKm += distanceKm(routeWaypoints[i], routeWaypoints[i + 1]);
    }
    this.modalRouteTotalKm = Math.round(totalKm);
    const velocidadeMedia = 60;
    this.modalRouteEtaHoras = totalKm > 0 ? +(totalKm / velocidadeMedia).toFixed(1) : 0;

    if (routeWaypoints.length >= 2) {
      polylines.push({
        points: routeWaypoints,
        color: '#2563eb',
        weight: 4,
        opacity: 0.9
      });
    }

    this.modalMarkers = markers;
    this.modalPolylines = polylines;

    if (vincs.length === 0 && vCoords) {
      this.modalCenter = vCoords;
      this.modalZoom = 6;
    }
  }



  getPreVinculadosCountForVehicleIndex(idx: number): number {
    return this.vinculos.filter(v => this.veiculos.indexOf(v.veiculo) === idx && v.status === 'vinculado').length;
  }

  getPreVinculadosPesoKgForVehicleIndex(idx: number): number {
    return this.vinculos
      .filter(v => this.veiculos.indexOf(v.veiculo) === idx && v.status === 'vinculado')
      .reduce((sum, v) => sum + (v.intencao.pesoKg || 0), 0);
  }

  private getModalVinculosOrdered(): Vinculo[] {
    const idx = this.veiculoVinculosModalForIndex;
    return (idx !== null && idx !== undefined) ? this.vinculos.filter(v => this.veiculos.indexOf(v.veiculo) === idx).slice().reverse() : [];
  }

  get modalResumoValorTotal(): number { return this.getModalVinculosOrdered().reduce((s, v) => s + (v.intencao?.valorPreCarga || 0), 0); }
  get modalResumoOrigemInicial(): string { const f = this.getModalVinculosOrdered()[0]; return f?.intencao?.origem ? `${f.intencao.origem.cidade} - ${f.intencao.origem.uf}` : '—'; }
  get modalResumoDestinoFinal(): string { const o = this.getModalVinculosOrdered(); const l = o.length ? o[o.length - 1] : null; return l?.intencao?.destino ? `${l.intencao.destino.cidade} - ${l.intencao.destino.uf}` : '—'; }
  get modalResumoDataColetaInicial(): string { return this.getModalVinculosOrdered()[0]?.intencao?.dataColeta || '—'; }
  get modalResumoDataEntregaFinal(): string { const o = this.getModalVinculosOrdered(); return (o.length ? o[o.length - 1] : null)?.intencao?.dataEntrega || '—'; }

  getCapacidadeUsoPercentForVehicleIndex(idx: number): number {
    const veiculo = this.veiculos[idx];
    if (!veiculo) return 0;
    const capacidade = this.viagemService.getVehicleCapacityKg(veiculo);
    const carga = this.getPreVinculadosPesoKgForVehicleIndex(idx);
    return capacidade > 0 ? Math.max(0, Math.min(100, Math.round((carga / capacidade) * 100))) : 0;
  }

  isCapacidadeExcedidaForVehicleIndex(idx: number): boolean {
    const veiculo = this.veiculos[idx];
    if (!veiculo) return false;
    const capacidade = this.viagemService.getVehicleCapacityKg(veiculo);
    const carga = this.getPreVinculadosPesoKgForVehicleIndex(idx);
    return capacidade > 0 && carga > capacidade;
  }

  confirmarTodosVinculosVeiculo(): void {
    const idx = this.veiculoVinculosModalForIndex;
    if (idx === null || idx === undefined) return;
    const pendingVincs = this.vinculos.filter(v => this.veiculos.indexOf(v.veiculo) === idx && v.status === 'vinculado' && !v.confirmado);
    if (pendingVincs.length === 0) return;

    this.viagemService.confirmarVinculos(pendingVincs).subscribe(() => {
      this.showSuccess('Vínculos confirmados com sucesso.');
      this.fecharModalVinculosVeiculo();
      this.loadData();
    });
  }

  getConfirmadosCountForVehicleIndex(idx: number): number {
    return this.vinculos.filter(v => this.veiculos.indexOf(v.veiculo) === idx && v.confirmado === true).length;
  }

  get confirmedVinculos(): { i: number; v: Vinculo }[] {
    return this.vinculos.map((v, i) => ({ i, v })).filter(x => x.v.confirmado === true);
  }

  get confirmedGroups(): { veiculo: Veiculo; items: { i: number; v: Vinculo }[] }[] {
    const groups = new Map<Veiculo, { veiculo: Veiculo; items: { i: number; v: Vinculo }[] }>();
    this.vinculos.forEach((v, i) => {
      if (v?.confirmado) {
        if (!groups.has(v.veiculo)) groups.set(v.veiculo, { veiculo: v.veiculo, items: [] });
        groups.get(v.veiculo)!.items.push({ i, v });
      }
    });
    return Array.from(groups.values());
  }

  getPesoTotalGrupo(items: { i: number; v: Vinculo }[]): number {
    return items.reduce((acc, it) => acc + (it.v.intencao?.pesoKg || 0), 0);
  }

  excluirGrupoConfirmado(veiculo: Veiculo): void {
    if (!veiculo) return;
    const removidos = this.vinculos.filter(v => v?.confirmado && v.veiculo.placa === veiculo.placa);
    if (!removidos.length) return;
    const manter = this.vinculos.filter(v => !(v?.confirmado && v.veiculo.placa === veiculo.placa));
    const viagemIds = removidos.map(v => v.viagemId).filter(Boolean) as string[];
    this.viagemService.removerViagens(viagemIds).subscribe(() => {
      this.vinculos = manter;
      this.viagemService.saveVinculos(this.vinculos).subscribe(() => {
        removidos.forEach(v => this.intencoes.unshift(v.intencao));
        this.viagemService.saveIntencoes(this.intencoes).subscribe(() => {
          this.showSuccess('Grupo removido. Pré-cargas devolvidas.');
        });
      });
    });
  }
}
