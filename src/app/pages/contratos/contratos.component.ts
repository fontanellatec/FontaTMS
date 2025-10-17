import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContractsService } from '../../core/contracts.service';
import { firstValueFrom } from 'rxjs';

type ContractStatus = 'Ativo' | 'Suspenso' | 'Vencido' | 'Cancelado';

interface ContractRow {
  numero: string;
  cliente: string;
  inicio: string; // dd/MM/yyyy
  fim: string;    // dd/MM/yyyy
  valorMensal: number;
  status: ContractStatus;
  renovacaoAuto: boolean;
  slaHoras?: number;
  penalidade?: string;
  observacao?: string;
}

@Component({
  selector: 'app-contratos',
  templateUrl: './contratos.component.html',
  styleUrls: ['./contratos.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class ContratosComponent {
  // Filtros
  filtroStatus: ContractStatus | 'Todos' = 'Todos';
  filtroCliente = '';
  filtroNumero = '';
  vigenciaDe = ''; // yyyy-MM-dd
  vigenciaAte = '';
  filtroRenovacao: 'Todos' | 'Sim' | 'Não' = 'Todos';

  // Dados
  rows: ContractRow[] = [
    {
      numero: 'CTR-2025-001',
      cliente: 'ACME Logística',
      inicio: '01/01/2025',
      fim: '31/12/2025',
      valorMensal: 12500,
      status: 'Ativo',
      renovacaoAuto: true,
      slaHoras: 24,
      penalidade: 'Multa 10% por atraso',
      observacao: 'Entrega semanal SP-RJ'
    },
    {
      numero: 'CTR-2024-087',
      cliente: 'TransBrasil S/A',
      inicio: '10/03/2024',
      fim: '09/03/2025',
      valorMensal: 9800,
      status: 'Vencido',
      renovacaoAuto: false,
      slaHoras: 12,
      penalidade: 'Suspensão após 3 reincidências',
      observacao: 'Aguardando renegociação'
    },
    {
      numero: 'CTR-2025-110',
      cliente: 'LogiTrack Ltda.',
      inicio: '01/05/2025',
      fim: '15/11/2025',
      valorMensal: 15200,
      status: 'Ativo',
      renovacaoAuto: true,
      slaHoras: 18,
      penalidade: 'Desconto 5% por falha de SLA',
      observacao: 'Rota Sul. Renovação automática habilitada.'
    }
  ];

  constructor(private contracts: ContractsService) {
    this.loadFromStorage();
    // Tenta carregar do backend e mescla com dados locais
    this.fetchFromService();
  }

  // Persistência simples
  private storageKey = 'erp-contratos';
  private loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        const data = JSON.parse(raw);
        if (Array.isArray(data)) {
          this.rows = data;
        }
      }
    } catch {}
  }
  private saveToStorage(): void {
    try { localStorage.setItem(this.storageKey, JSON.stringify(this.rows)); } catch {}
  }

  private async fetchFromService(): Promise<void> {
    try {
      const data = await firstValueFrom(this.contracts.list());
      if (Array.isArray(data) && data.length) {
        // Faz um mapeamento leve para o formato interno
        const mapRow = (x: any): ContractRow => ({
          numero: String(x.numero ?? x.id ?? ''),
          cliente: String(x.cliente ?? x.razaoSocial ?? ''),
          inicio: String(x.inicio ?? x.vigenciaInicio ?? ''),
          fim: String(x.fim ?? x.vigenciaFim ?? ''),
          valorMensal: Number(x.valorMensal ?? x.valor ?? 0),
          status: (String(x.status ?? 'Ativo') as ContractStatus),
          renovacaoAuto: Boolean(x.renovacaoAuto ?? x.renovacaoAutomatica ?? false),
          slaHoras: x.slaHoras != null ? Number(x.slaHoras) : undefined,
          penalidade: x.penalidade ?? x.multas ?? undefined,
          observacao: x.observacao ?? x.obs ?? ''
        });
        const fetched = data.map(mapRow);
        // Substitui os dados locais
        this.rows = fetched;
        this.saveToStorage();
        this.page = 1;
      }
    } catch {
      // Silencia erros e mantém dados locais
    }
  }

  // Filtro e paginação
  get filtered(): ContractRow[] {
    let rs = [...this.rows];
    if (this.filtroStatus !== 'Todos') rs = rs.filter(r => r.status === this.filtroStatus);
    if (this.filtroCliente) {
      const q = this.filtroCliente.toLowerCase();
      rs = rs.filter(r => r.cliente.toLowerCase().includes(q));
    }
    if (this.filtroNumero) {
      const q = this.filtroNumero.toLowerCase();
      rs = rs.filter(r => r.numero.toLowerCase().includes(q));
    }
    if (this.filtroRenovacao !== 'Todos') {
      const want = this.filtroRenovacao === 'Sim';
      rs = rs.filter(r => r.renovacaoAuto === want);
    }
    // Filtro por vigência (início/fim dentro do intervalo)
    const toISO = (br: string) => {
      const [dd, mm, yyyy] = br.split('/');
      return `${yyyy}-${mm}-${dd}`;
    };
    const de = this.vigenciaDe || '';
    const ate = this.vigenciaAte || '';
    if (de) rs = rs.filter(r => toISO(r.inicio) >= de);
    if (ate) rs = rs.filter(r => toISO(r.fim) <= ate);
    return rs;
  }

  page = 1;
  pageSize = 10;
  pageSizeOptions = [10, 25, 50, 100];
  onFiltersChanged(): void { this.page = 1; }
  get paged(): ContractRow[] {
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
  setPageSize(sz: number): void { this.pageSize = sz; this.page = 1; }

  // Ações
  formatCurrency(n: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
  }
  getStatusClass(st: ContractStatus): string {
    switch (st) {
      case 'Ativo': return 'status ativo';
      case 'Suspenso': return 'status suspenso';
      case 'Vencido': return 'status vencido';
      case 'Cancelado': return 'status cancelado';
    }
  }

  // Indicadores de vigência
  private parseBrDate(br: string): Date | null {
    const m = br?.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return null;
    const dd = Number(m[1]);
    const mm = Number(m[2]) - 1;
    const yyyy = Number(m[3]);
    const d = new Date(yyyy, mm, dd);
    return isNaN(d.getTime()) ? null : d;
  }
  daysToEnd(r: ContractRow): number {
    const end = this.parseBrDate(r.fim);
    if (!end) return NaN;
    const now = new Date();
    const diffMs = end.getTime() - now.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }
  isNearExpiry(r: ContractRow): boolean {
    const days = this.daysToEnd(r);
    return Number.isFinite(days) && days >= 0 && days <= 30;
  }

  // Exportação e impressão
  exportCSV(): void {
    const headers = ['Numero','Cliente','Inicio','Fim','ValorMensal','Status','RenovacaoAuto','SLAHoras','Penalidade','Observacao'];
    const lines = this.filtered.map(r => [
      r.numero,
      r.cliente,
      r.inicio,
      r.fim,
      String(r.valorMensal).replace('.', ','),
      r.status,
      r.renovacaoAuto ? 'Sim' : 'Não',
      r.slaHoras != null ? String(r.slaHoras) : '',
      r.penalidade ?? '',
      (r.observacao ?? '').replace(/\n/g, ' ')
    ]);
    const csv = [headers.join(';'), ...lines.map(l => l.map(v => `"${(v ?? '').toString().replace(/"/g, '""')}"`).join(';'))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contratos_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  printTable(): void {
    window.print();
  }

  renovar(r: ContractRow): void {
    if (r.status === 'Vencido' || r.status === 'Suspenso') {
      r.status = 'Ativo';
      r.observacao = (r.observacao ? r.observacao + ' · ' : '') + 'Renovado';
      this.saveToStorage();
    }
  }
  cancelar(r: ContractRow): void {
    r.status = 'Cancelado';
    r.observacao = (r.observacao ? r.observacao + ' · ' : '') + 'Cancelado';
    this.saveToStorage();
  }

  // Modal Novo Contrato
  newOpen = false;
  newForm: Partial<ContractRow> = { status: 'Ativo', renovacaoAuto: true };
  openNew(): void { this.newForm = { status: 'Ativo', renovacaoAuto: true }; this.newOpen = true; }
  closeNew(): void { this.newOpen = false; }
  saveNew(): void {
    if (!this.newForm.numero || !this.newForm.cliente || !this.newForm.inicio || !this.newForm.fim) return;
    const valor = Number(this.newForm.valorMensal || 0);
    const row: ContractRow = {
      numero: this.newForm.numero!,
      cliente: this.newForm.cliente!,
      inicio: this.newForm.inicio!,
      fim: this.newForm.fim!,
      valorMensal: isNaN(valor) ? 0 : valor,
      status: (this.newForm.status || 'Ativo') as ContractStatus,
      renovacaoAuto: !!this.newForm.renovacaoAuto,
      observacao: this.newForm.observacao || ''
    };
    this.rows.unshift(row);
    this.saveToStorage();
    this.closeNew();
    this.page = 1;
  }
}