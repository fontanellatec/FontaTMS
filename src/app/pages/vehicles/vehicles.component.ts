import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type VehicleStatus = 'Ativo' | 'Manutenção' | 'Parado';

interface VehicleRow {
  placa: string;
  modelo: string;
  status: VehicleStatus;
  proxManutencao: string; // dd/MM
}

@Component({
  selector: 'app-vehicles',
  templateUrl: './vehicles.component.html',
  styleUrls: ['./vehicles.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class VehiclesComponent {
  Math = Math;
  statuses: VehicleStatus[] = ['Ativo', 'Manutenção', 'Parado'];
  selectedStatus: VehicleStatus | 'Todos' = 'Todos';
  searchTerm = '';

  rows: VehicleRow[] = [
    { placa: 'ABC1D23', modelo: 'Volvo FH', status: 'Ativo', proxManutencao: '12/11' },
    { placa: 'EFG4H56', modelo: 'Scania R450', status: 'Manutenção', proxManutencao: '05/11' },
    { placa: 'IJK7L89', modelo: 'Mercedes Actros', status: 'Ativo', proxManutencao: '28/12' },
    { placa: 'MNO1P23', modelo: 'VW Constellation', status: 'Parado', proxManutencao: '—' },
  ];

  constructor() {
    // Expandir frota com muitos veículos mock
    const modelos = ['Volvo FH', 'Scania R450', 'Mercedes Actros', 'DAF XF', 'Iveco Hi-Way', 'MAN TGX', 'VW Constellation', 'Renault T', 'International LT', 'Kenworth T680'];
    const rand = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
    const pad = (n: number) => String(n).padStart(2, '0');
    for (let i = 1; i <= 100; i++) {
      const placa = `TRK${String(i).padStart(4, '0')}`; // formato simples e legível
      const status: VehicleStatus = rand(this.statuses);
      const dd = pad(((i * 3) % 28) + 1);
      const mm = pad(((i * 5) % 12) + 1);
      const prox = status === 'Manutenção' ? `${dd}/${mm}` : '—';
      this.rows.push({ placa, modelo: rand(modelos), status, proxManutencao: prox });
    }
  }

  get filtered(): VehicleRow[] {
    let rs = [...this.rows];
    if (this.selectedStatus !== 'Todos') rs = rs.filter(r => r.status === this.selectedStatus);
    if (this.searchTerm) {
      const q = this.searchTerm.toLowerCase();
      rs = rs.filter(r => r.placa.toLowerCase().includes(q) || r.modelo.toLowerCase().includes(q));
    }
    return rs;
  }

  // Paginação
  page = 1;
  pageSize = 10;
  pageSizeOptions = [10, 50, 100, 200];

  get paged(): VehicleRow[] {
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
  goToPage(p: number): void { const n = Math.max(1, Math.min(this.pageCount, p)); this.page = n; }
  setPageSize(sz: number): void { this.pageSize = sz; this.page = 1; }

  onFiltersChanged(): void { this.page = 1; }

  getStatusClass(st: VehicleStatus): string {
    switch (st) {
      case 'Ativo': return 'status ativo';
      case 'Manutenção': return 'status manutencao';
      case 'Parado': return 'status parado';
    }
  }

  // Modal de detalhes
  detailOpen = false;
  selected?: VehicleRow;
  openDetail(r: VehicleRow): void { this.selected = r; this.detailOpen = true; }
  closeDetail(): void { this.detailOpen = false; this.selected = undefined; }

  // Modal de agendamento de manutenção
  scheduleOpen = false;
  scheduleFor?: VehicleRow;
  agendamentos: { placa: string; date: string; type: 'Preventiva' | 'Corretiva'; descricao: string }[] = [
    { placa: 'EFG4H56', date: '05/11', type: 'Preventiva', descricao: 'Troca de óleo e filtros' },
    { placa: 'ABC1D23', date: '12/11', type: 'Preventiva', descricao: 'Revisão de freios' },
    { placa: 'IJK7L89', date: '28/12', type: 'Preventiva', descricao: 'Revisão geral de fim de ano' }
  ];
  historicoAgendamentos: { placa: string; date: string; type: 'Preventiva' | 'Corretiva'; status: 'Concluído' | 'Cancelado' }[] = [
    { placa: 'ABC1D23', date: '18/09', type: 'Preventiva', status: 'Concluído' },
    { placa: 'MNO1P23', date: '03/10', type: 'Corretiva', status: 'Cancelado' }
  ];
  scheduleForm: { date: string; type: 'Preventiva' | 'Corretiva'; descricao: string; fornecedor: string; tempo?: string } = {
    date: '',
    type: 'Preventiva',
    descricao: '',
    fornecedor: ''
  };

  openSchedule(r: VehicleRow): void {
    this.scheduleFor = r;
    this.scheduleOpen = true;
    this.scheduleForm = { date: '', type: 'Preventiva', descricao: '', fornecedor: '' };
  }

  closeSchedule(): void { this.scheduleOpen = false; this.scheduleFor = undefined; }

  saveSchedule(): void {
    if (!this.scheduleFor || !this.scheduleForm.date) { this.closeSchedule(); return; }
    const ddmm = this.formatDM(this.scheduleForm.date);
    this.scheduleFor.proxManutencao = ddmm;
    this.scheduleFor.status = 'Manutenção';
    this.agendamentos.unshift({
      placa: this.scheduleFor.placa,
      date: ddmm,
      type: this.scheduleForm.type,
      descricao: this.scheduleForm.descricao
    });
    this.closeSchedule();
  }

  concluirAgendamento(index: number): void {
    const ag = this.agendamentos[index];
    if (!ag) return;
    const row = this.rows.find(r => r.placa === ag.placa);
    if (row) {
      row.status = 'Ativo';
      row.proxManutencao = '—';
    }
    this.historicoAgendamentos.unshift({ placa: ag.placa, date: ag.date, type: ag.type, status: 'Concluído' });
    this.agendamentos.splice(index, 1);
  }

  cancelarAgendamento(index: number): void {
    const ag = this.agendamentos[index];
    if (!ag) return;
    const row = this.rows.find(r => r.placa === ag.placa);
    if (row) {
      // Se estava marcado como manutenção por conta do agendamento, volta para ativo
      if (row.status === 'Manutenção') row.status = 'Ativo';
      row.proxManutencao = '—';
    }
    this.historicoAgendamentos.unshift({ placa: ag.placa, date: ag.date, type: ag.type, status: 'Cancelado' });
    this.agendamentos.splice(index, 1);
  }

  private formatDM(dateStr: string): string {
    const [y, m, d] = dateStr.split('-');
    if (!d || !m) return dateStr;
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}`;
  }

}