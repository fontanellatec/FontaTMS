import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type DriverStatus = 'Disponível' | 'Em rota' | 'Ausente';

interface DriverRow {
  nome: string;
  status: DriverStatus;
  ultimaAtualizacao: string; // HH:mm
  equipe: string;
  viagensMes: number;
}

@Component({
  selector: 'app-drivers',
  templateUrl: './drivers.component.html',
  styleUrls: ['./drivers.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class DriversComponent {
  statuses: DriverStatus[] = ['Disponível', 'Em rota', 'Ausente'];
  selectedStatus: DriverStatus | 'Todos' = 'Todos';
  searchTerm = '';

  rows: DriverRow[] = [
    { nome: 'João Santos', status: 'Disponível', ultimaAtualizacao: '10:05', equipe: 'Equipe A', viagensMes: 14 },
    { nome: 'Maria Lima', status: 'Em rota', ultimaAtualizacao: '09:40', equipe: 'Equipe B', viagensMes: 16 },
    { nome: 'Carlos Silva', status: 'Disponível', ultimaAtualizacao: '08:55', equipe: 'Equipe A', viagensMes: 9 },
    { nome: 'Ana Costa', status: 'Ausente', ultimaAtualizacao: '—', equipe: 'Equipe C', viagensMes: 6 },
    { nome: 'Pedro Alves', status: 'Em rota', ultimaAtualizacao: '07:20', equipe: 'Equipe B', viagensMes: 18 },
  ];

  get filtered(): DriverRow[] {
    let rs = [...this.rows];
    if (this.selectedStatus !== 'Todos') rs = rs.filter(r => r.status === this.selectedStatus);
    if (this.searchTerm) {
      const q = this.searchTerm.toLowerCase();
      rs = rs.filter(r => r.nome.toLowerCase().includes(q) || r.equipe.toLowerCase().includes(q));
    }
    return rs;
  }

  getStatusClass(st: DriverStatus): string {
    switch (st) {
      case 'Disponível': return 'status disponivel';
      case 'Em rota': return 'status em-rota';
      case 'Ausente': return 'status ausente';
    }
  }

  // Modal de detalhes
  detailOpen = false;
  selected?: DriverRow;

  openDetail(r: DriverRow): void { this.selected = r; this.detailOpen = true; }
  closeDetail(): void { this.detailOpen = false; this.selected = undefined; }
}