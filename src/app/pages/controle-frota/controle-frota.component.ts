import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface FleetRecord {
  frota: string;
  veiculo: string;
  tipoConjuntoVeiculo: string;
  situacaoVeiculo: string;
  tipoOperacaoFrota: string;
  motorista: string;
  situacaoMotorista: string;
  categoriaMotorista: string;
  gestor: string;
}

@Component({
  selector: 'erp-controle-frota',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './controle-frota.component.html',
  styleUrls: ['./controle-frota.component.scss']
})
export class ControleFrotaComponent {
  // Filtros
  filtroDataBase = '';
  filtroFrota = '';
  filtroTipoOperacaoFrota = '';
  filtroTipoConjuntoVeiculo = '';
  filtroSituacaoVeiculo = '';
  filtroSituacaoMotorista = '';
  filtroCategoriaMotorista = '';
  filtroVeiculo = '';
  filtroMotorista = '';

  // Segmento ativo
  segmento: 'Veiculo' | 'Motorista' = 'Veiculo';

  // Dados mockados (placeholder até integração)
  records: FleetRecord[] = [
    { frota: '88', veiculo: 'EHB1222', tipoConjuntoVeiculo: 'RODOTREM', situacaoVeiculo: 'MANUTENÇÃO', tipoOperacaoFrota: 'LOG - XG05', motorista: 'ALEXANDRE DA SILVA LEMES', situacaoMotorista: 'Aguardando Descarga', categoriaMotorista: 'Categoria II', gestor: 'Marcio Sauter' },
    { frota: '273', veiculo: 'MTI780 - QWX2032', tipoConjuntoVeiculo: 'BITREM', situacaoVeiculo: 'SEM MOTORISTA', tipoOperacaoFrota: 'DISTRIBUIÇÃO URBANA', motorista: '—', situacaoMotorista: '—', categoriaMotorista: 'Categoria I', gestor: 'Marcio Sauter' },
    { frota: '319', veiculo: 'RX3460', tipoConjuntoVeiculo: 'LS', situacaoVeiculo: 'EM ROTA', tipoOperacaoFrota: 'LOG - CS', motorista: 'JOÃO SILVA', situacaoMotorista: 'Em viagem', categoriaMotorista: 'Categoria II', gestor: 'Samuel de Mello Alves' },
    { frota: '410', veiculo: 'MV1638', tipoConjuntoVeiculo: 'RODOTREM', situacaoVeiculo: 'EM ROTA', tipoOperacaoFrota: 'TRANSFERÊNCIA', motorista: 'GUILHERME', situacaoMotorista: 'Disponível', categoriaMotorista: 'Categoria I', gestor: 'Marcio Sauter' },
    { frota: '551', veiculo: 'MV1650', tipoConjuntoVeiculo: 'BITREM', situacaoVeiculo: 'EM VIAGEM', tipoOperacaoFrota: 'DISTRIBUIÇÃO URBANA', motorista: 'ALAN COLONEGO', situacaoMotorista: 'Em viagem', categoriaMotorista: 'Categoria II', gestor: 'Guilherme Master Mattos' },
    { frota: '568', veiculo: 'QQ2161', tipoConjuntoVeiculo: 'CARRETA', situacaoVeiculo: 'PARADO', tipoOperacaoFrota: 'LOG - CR', motorista: 'MATEUS', situacaoMotorista: 'Folga', categoriaMotorista: 'Categoria I', gestor: 'Anderson Pedroso' },
    { frota: '773', veiculo: 'QPW840', tipoConjuntoVeiculo: 'BITREM', situacaoVeiculo: 'EM ROTA', tipoOperacaoFrota: 'DISTRIBUIÇÃO URBANA', motorista: 'ALAN COLONEGO', situacaoMotorista: 'Em viagem', categoriaMotorista: 'Categoria II', gestor: 'Marcio Sauter' },
    { frota: '982', veiculo: 'PPP9650 - PJP777 - GGP9900', tipoConjuntoVeiculo: 'BITREM', situacaoVeiculo: 'MANUTENÇÃO', tipoOperacaoFrota: 'LOG - XG05', motorista: 'GABRIEL', situacaoMotorista: 'Suspenso', categoriaMotorista: 'Categoria I', gestor: 'Marcio Sauter' }
  ];

  // Paginação
  page = 1;
  pageSizeOptions = [10, 20, 50];
  pageSize = 10;

  // Expor Math para uso no template
  Math = Math;

  // --- Modal de Vínculo ---
  vinculoModalOpen = false;
  vinculoTab: 'Motorista' | 'Gestor' | 'Engate' | 'TipoConjunto' = 'Motorista';
  selectedRecord: FleetRecord | null = null;
  vinculoKeepMotorista = false;
  vinculo = {
    data: '',
    hora: '',
    tipo: 'Saída',
    veiculo1: '',
    veiculo2: '',
    motoristaTelefone: '',
    motoristaNome: '',
    situacaoMotorista: '',
    dataInicio: '',
    dataFim: ''
  };

  // Engate: estado de UI e DnD
  engateVehiclePlate = '';
  engateSlots: (string | null)[] = [];
  engateQuery = '';
  engateDragOverIndex: number | null = null; // -1 para área disponível
  allPlates: string[] = [];
  engateTipo: string = '';

  get platesFiltered(): string[] {
    const q = this.engateQuery.trim().toLowerCase();
    const arr = this.allPlates;
    if (!q) return arr;
    return arr.filter(p => p.toLowerCase().includes(q));
  }

  private formatDate(d: Date): string {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }
  private formatTime(d: Date): string {
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  get filtered(): FleetRecord[] {
    const df = this.filtroDataBase.trim().toLowerCase();
    const fF = this.filtroFrota.trim().toLowerCase();
    const fT = this.filtroTipoOperacaoFrota.trim().toLowerCase();
    const fC = this.filtroTipoConjuntoVeiculo.trim().toLowerCase();
    const fSV = this.filtroSituacaoVeiculo.trim().toLowerCase();
    const fSM = this.filtroSituacaoMotorista.trim().toLowerCase();
    const fCat = this.filtroCategoriaMotorista.trim().toLowerCase();
    const fV = this.filtroVeiculo.trim().toLowerCase();
    const fM = this.filtroMotorista.trim().toLowerCase();

    // Data base (df) é informativo; sem filtro hard aqui
    return this.records.filter(r =>
      (!fF || r.frota.toLowerCase().includes(fF)) &&
      (!fT || r.tipoOperacaoFrota.toLowerCase().includes(fT)) &&
      (!fC || r.tipoConjuntoVeiculo.toLowerCase().includes(fC)) &&
      (!fSV || r.situacaoVeiculo.toLowerCase().includes(fSV)) &&
      (!fSM || r.situacaoMotorista.toLowerCase().includes(fSM)) &&
      (!fCat || r.categoriaMotorista.toLowerCase().includes(fCat)) &&
      (!fV || r.veiculo.toLowerCase().includes(fV)) &&
      (!fM || r.motorista.toLowerCase().includes(fM))
    );
  }

  get pageCount(): number { return Math.max(1, Math.ceil(this.filtered.length / this.pageSize)); }
  get paged(): FleetRecord[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filtered.slice(start, start + this.pageSize);
  }

  pesquisar(): void { /* filtros são reativos; sem ação adicional */ }

  setSegmento(seg: 'Veiculo' | 'Motorista'): void { this.segmento = seg; }

  firstPage(): void { this.page = 1; }
  prevPage(): void { this.page = Math.max(1, this.page - 1); }
  nextPage(): void { this.page = Math.min(this.pageCount, this.page + 1); }
  lastPage(): void { this.page = this.pageCount; }

  setPageSize(sz: number): void { this.pageSize = Number(sz); this.page = 1; }

  vincular(r: FleetRecord): void {
    this.selectedRecord = r;
    const now = new Date();
    this.vinculo.data = this.formatDate(now);
    this.vinculo.hora = this.formatTime(now);
    this.vinculo.tipo = 'Saída';
    const parts = r.veiculo.split(/\s*-\s*|\s+/).filter(Boolean);
    this.vinculo.veiculo1 = parts[0] || '';
    this.vinculo.veiculo2 = parts[1] || '';
    this.vinculo.motoristaNome = r.motorista === '—' ? '' : r.motorista;
    this.vinculo.situacaoMotorista = r.situacaoMotorista || '';
    this.vinculo.dataInicio = '';
    this.vinculo.dataFim = '';
    this.vinculoKeepMotorista = false;
    this.vinculoTab = 'Motorista';
    this.vinculoModalOpen = true;

    // Inicializa Engate conforme registro
    this.initEngateFromRecord(r);
  }

  // Engate helpers
  private getEngateSlotCount(): number {
    // Fixar em 3 reboques conforme requisito
    return 3;
  }

  private computeAllPlates(): void {
    const type = (this.engateTipo || '').toUpperCase();
    const set = new Set<string>();
    for (const rec of this.records) {
      if (type && !rec.tipoConjuntoVeiculo.toUpperCase().includes(type)) continue;
      const tokens = rec.veiculo.split(/\s*-\s*|\s+/).filter(Boolean);
      for (const t of tokens) {
        const v = t.toUpperCase();
        if (/^[A-Z0-9]{3,8}$/.test(v)) set.add(v);
      }
    }
    this.allPlates = Array.from(set).sort();
  }

  private initEngateFromRecord(r: FleetRecord): void {
    const tokens = r.veiculo.split(/\s*-\s*|\s+/).filter(Boolean);
    this.engateVehiclePlate = tokens[0] || '';
    // Ajustar tipo inicial de engate conforme registro
    const tp = (r.tipoConjuntoVeiculo || '').toUpperCase();
    this.engateTipo = tp.includes('RODOTREM') ? 'Rodotrem'
                    : tp.includes('BITREM') ? 'Bitrem'
                    : tp.includes('CARRETA') ? 'Carreta'
                    : 'LS';
    const count = this.getEngateSlotCount();
    this.engateSlots = Array(count).fill(null);
    for (let i = 0; i < count; i++) {
      this.engateSlots[i] = tokens[i + 1] || null;
    }
    this.computeAllPlates();
  }

  isPlateAssigned(p: string): boolean { return this.engateSlots.includes(p); }

  assignPlateToSlot(p: string, i: number): void {
    // Se já estiver em outro slot, move
    const currentIdx = this.engateSlots.indexOf(p);
    if (currentIdx >= 0 && currentIdx !== i) {
      this.engateSlots[currentIdx] = null;
    }
    this.engateSlots[i] = p;
  }

  assignToNextSlot(p: string): void {
    if (this.isPlateAssigned(p)) return;
    for (let i = 0; i < this.engateSlots.length; i++) {
      if (!this.engateSlots[i]) { this.engateSlots[i] = p; return; }
    }
  }

  clearSlot(i: number): void { this.engateSlots[i] = null; }
  removePlate(p: string): void {
    const idx = this.engateSlots.indexOf(p);
    if (idx >= 0) this.engateSlots[idx] = null;
  }

  onPlateDragStart(p: string, ev: DragEvent): void {
    ev.dataTransfer?.setData('text/plain', p);
    if (ev.dataTransfer) ev.dataTransfer.effectAllowed = 'move';
  }

  onSlotDragEnter(i: number, ev: DragEvent): void { ev.preventDefault(); this.engateDragOverIndex = i; }
  onSlotDragLeave(i: number): void { if (this.engateDragOverIndex === i) this.engateDragOverIndex = null; }
  onSlotDragOver(i: number, ev: DragEvent): void { ev.preventDefault(); }
  onSlotDrop(i: number, ev: DragEvent): void {
    ev.preventDefault();
    const p = (ev.dataTransfer?.getData('text/plain') || '').trim();
    if (!p) return;
    this.assignPlateToSlot(p, i);
    this.engateDragOverIndex = null;
  }

  onAvailableDragEnter(ev: DragEvent): void { ev.preventDefault(); this.engateDragOverIndex = -1; }
  onAvailableDragLeave(): void { if (this.engateDragOverIndex === -1) this.engateDragOverIndex = null; }
  onAvailableDragOver(ev: DragEvent): void { ev.preventDefault(); }
  onAvailableDrop(ev: DragEvent): void {
    ev.preventDefault();
    const p = (ev.dataTransfer?.getData('text/plain') || '').trim();
    if (!p) return;
    this.removePlate(p);
    this.engateDragOverIndex = null;
  }

  onChangeEngateTipo(type: string): void {
    this.engateTipo = type || '';
    this.computeAllPlates();
  }

  fecharVinculoModal(): void { this.vinculoModalOpen = false; }
  setVinculoTab(tab: 'Motorista' | 'Gestor' | 'Engate' | 'TipoConjunto'): void { this.vinculoTab = tab; }
  salvarVinculo(): void {
    console.log('Salvar vínculo', { record: this.selectedRecord, vinculo: this.vinculo, keepMotorista: this.vinculoKeepMotorista, tab: this.vinculoTab, engate: { vehicle: this.engateVehiclePlate, slots: this.engateSlots } });
    this.vinculoModalOpen = false;
  }
}