import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type ShipmentStatus = 'Em rota' | 'Atrasado' | 'Pendente' | 'Concluído';

interface ShipmentRow {
  id: string;
  status: ShipmentStatus;
  eta: string; // HH:mm
  motorista: string;
  veiculo: string;
  origem: string;
  destino: string;
}

@Component({
  selector: 'app-shipments',
  templateUrl: './shipments.component.html',
  styleUrls: ['./shipments.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class ShipmentsComponent implements OnInit {
  private shipmentsKey = 'shipmentsData';
  // Filtros
  statuses: ShipmentStatus[] = ['Em rota', 'Atrasado', 'Pendente', 'Concluído'];
  selectedStatus: ShipmentStatus | 'Todos' = 'Todos';
  searchTerm = '';
  fromDate = '';
  toDate = '';

  // Dados (carrega de storage; se vazio, usa exemplos)
  shipments: ShipmentRow[] = [
    { id: 'EMB-0001', status: 'Em rota', eta: '12:30', motorista: 'João Santos', veiculo: 'ABC1D23', origem: 'São Paulo', destino: 'Rio de Janeiro' },
    { id: 'EMB-0002', status: 'Em rota', eta: '14:10', motorista: 'Maria Lima', veiculo: 'EFG4H56', origem: 'Campinas', destino: 'Sorocaba' },
    { id: 'EMB-0003', status: 'Atrasado', eta: '16:00', motorista: 'Carlos Silva', veiculo: 'IJK7L89', origem: 'BH', destino: 'São Paulo' },
    { id: 'EMB-0004', status: 'Pendente', eta: '—', motorista: 'Ana Costa', veiculo: 'MNO1P23', origem: 'Santos', destino: 'Curitiba' },
    { id: 'EMB-0005', status: 'Concluído', eta: '10:05', motorista: 'Pedro Alves', veiculo: 'QRS4T56', origem: 'Rio', destino: 'Niterói' }
  ];

  ngOnInit(): void {
    const stored = this.getShipmentsFromStorage();
    if (stored.length) this.shipments = stored;
  }

  private getShipmentsFromStorage(): ShipmentRow[] {
    try {
      const raw = localStorage.getItem(this.shipmentsKey);
      return raw ? JSON.parse(raw) as ShipmentRow[] : [];
    } catch { return []; }
  }
  private saveShipmentsToStorage(): void {
    localStorage.setItem(this.shipmentsKey, JSON.stringify(this.shipments));
  }
  private nextShipmentId(): string {
    const prefix = 'EMB-';
    let max = 0;
    for (const r of this.shipments) {
      if (r.id?.startsWith(prefix)) {
        const num = parseInt(r.id.slice(prefix.length), 10);
        if (!isNaN(num)) max = Math.max(max, num);
      }
    }
    const next = String(max + 1).padStart(4, '0');
    return `${prefix}${next}`;
  }

  get filteredShipments(): ShipmentRow[] {
    let rows = [...this.shipments];
    if (this.selectedStatus !== 'Todos') rows = rows.filter(r => r.status === this.selectedStatus);
    if (this.searchTerm) {
      const q = this.searchTerm.toLowerCase();
      rows = rows.filter(r => (
        r.id.toLowerCase().includes(q) ||
        r.motorista.toLowerCase().includes(q) ||
        r.veiculo.toLowerCase().includes(q) ||
        r.origem.toLowerCase().includes(q) ||
        r.destino.toLowerCase().includes(q)
      ));
    }
    // Filtro simples por data (mock): se informado, filtra por prefixo do ID só para demo
    if (this.fromDate || this.toDate) {
      rows = rows.filter(r => r.id);
    }
    return rows;
  }

  getStatusClass(st: ShipmentStatus): string {
    switch (st) {
      case 'Em rota': return 'status em-rota';
      case 'Atrasado': return 'status atrasado';
      case 'Pendente': return 'status pendente';
      case 'Concluído': return 'status concluido';
    }
  }

  // Modal Novo Embarque
  newModalOpen = false;
  newShipment: Partial<ShipmentRow> = { status: 'Pendente' };

  openNewShipmentModal(): void { this.newModalOpen = true; this.newShipment = { status: 'Pendente' }; }
  closeNewShipmentModal(): void { this.newModalOpen = false; }

  saveNewShipment(): void {
    const id = this.nextShipmentId();
    const row: ShipmentRow = {
      id,
      status: (this.newShipment.status ?? 'Pendente') as ShipmentStatus,
      eta: this.newShipment.eta ?? '—',
      motorista: this.newShipment.motorista ?? '—',
      veiculo: this.newShipment.veiculo ?? '—',
      origem: this.newShipment.origem ?? '—',
      destino: this.newShipment.destino ?? '—'
    };
    this.shipments.unshift(row);
    this.saveShipmentsToStorage();
    this.closeNewShipmentModal();
  }

  exportCSV(): void {
    const rows: string[] = ['ID;Status;ETA;Motorista;Veículo;Origem;Destino'];
    for (const r of this.filteredShipments) {
      rows.push(`${r.id};${r.status};${r.eta};${r.motorista};${r.veiculo};${r.origem};${r.destino}`);
    }
    const csv = rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `embarques.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  printList(): void { window.print(); }
}