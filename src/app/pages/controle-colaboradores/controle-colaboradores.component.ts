import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type ColabStatus = 'Ativo' | 'Inativo' | 'Suspenso';

interface Colaborador {
  id: string;
  nome: string;
  foto?: string;
  cargo: string;
  setor: string;
  status: ColabStatus;
  admissao: string; // yyyy-MM-dd
  demissao?: string; // yyyy-MM-dd
  badges: string[];
}

interface Aniversariante {
  nome: string;
  dia: string; // dd/MM
  foto?: string;
  hoje?: boolean;
}

interface Registro {
  id: string;
  tipo: string;
  data: string; // yyyy-MM-dd
  observacao: string;
}

@Component({
  selector: 'app-controle-colaboradores',
  templateUrl: './controle-colaboradores.component.html',
  styleUrls: ['./controle-colaboradores.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class ControleColaboradoresComponent {
  // Filtros
  filtroNome = '';
  filtroCargo = 'Todos';
  filtroSetor = 'Todos';
  filtroTempoCasa: 'Todos' | '< 1 ano' | '1-3 anos' | '> 3 anos' = 'Todos';
  filtroStatus: 'Todos' | 'Ativo' | 'Inativo' | 'Suspenso' = 'Todos';

  // Dados simulados
  colabs: Colaborador[] = [
    { id: 'c1', nome: 'João Silva', cargo: 'Analista', setor: 'Operações', status: 'Ativo', admissao: '2018-02-10', badges: ['Veterano da Jornada'] },
    { id: 'c2', nome: 'Maria Oliveira', cargo: 'Assistente', setor: 'RH', status: 'Inativo', admissao: '2022-05-18', badges: ['Pleno de Rota'], demissao: '2025-06-10' },
    { id: 'c3', nome: 'Carlos Lima', cargo: 'Coordenador', setor: 'Operações', status: 'Ativo', admissao: '2020-03-01', badges: ['Veterano da Jornada'] },
    { id: 'c4', nome: 'Ana Souza', cargo: 'Analista', setor: 'Financeiro', status: 'Ativo', admissao: '2023-08-15', badges: ['Pleno de Rota'] },
    { id: 'c5', nome: 'Bruno Costa', cargo: 'Auxiliar', setor: 'Operações', status: 'Suspenso', admissao: '2021-11-25', badges: ['Veterano da Jornada'] },
    { id: 'c6', nome: 'Fernanda Lima', cargo: 'Analista', setor: 'RH', status: 'Ativo', admissao: '2019-06-06', badges: ['Pleno de Rota'] },
    { id: 'c7', nome: 'Ricardo Alves', cargo: 'Assistente', setor: 'Financeiro', status: 'Ativo', admissao: '2024-12-19', badges: ['Pleno de Rota'] }
  ];

  aniversariantes: Aniversariante[] = [
    { nome: 'Maria Oliveira', dia: '30/05', foto: 'avatars/avatar-user.svg' },
    { nome: 'João Silva', dia: '30/06', foto: 'avatars/avatar-user.svg', hoje: true },
    { nome: 'Carlos Lima', dia: '15/06', foto: 'avatars/avatar-user.svg' },
    { nome: 'Ana Souza', dia: '22/06', foto: 'avatars/avatar-user.svg' },
    { nome: 'Bruno Costa', dia: '03/06', foto: 'avatars/avatar-user.svg' },
    { nome: 'Fernanda Lima', dia: '05/06', foto: 'avatars/avatar-user.svg' },
    { nome: 'Ricardo Alves', dia: '07/06', foto: 'avatars/avatar-user.svg' }
  ];

  // Opções dinâmicas derivadas dos dados
  get cargos(): string[] { return ['Todos', ...Array.from(new Set(this.colabs.map(c => c.cargo)))]; }
  get setores(): string[] { return ['Todos', ...Array.from(new Set(this.colabs.map(c => c.setor)))]; }

  // Estatísticas
  get ativos(): number { return this.colabs.filter(c => c.status === 'Ativo').length; }
  get admissoesMes(): number {
    const now = new Date();
    const m = now.getMonth();
    const y = now.getFullYear();
    return this.colabs.filter(c => {
      const d = new Date(c.admissao);
      return d.getMonth() === m && d.getFullYear() === y;
    }).length;
  }
  get demissoesMes(): number {
    const now = new Date();
    const m = now.getMonth();
    const y = now.getFullYear();
    return this.colabs.filter(c => {
      if (!c.demissao) return false;
      const d = new Date(c.demissao);
      return d.getMonth() === m && d.getFullYear() === y;
    }).length;
  }
  get tempoMedioEmpresa(): string {
    const meses = this.colabs.map(c => this.mesesDesde(c.admissao));
    const avg = meses.length ? Math.round(meses.reduce((a, b) => a + b, 0) / meses.length) : 0;
    return this.formatarDuracao(avg);
  }

  // Filtragem
  get filtered(): Colaborador[] {
    let rs = [...this.colabs];
    const q = this.filtroNome.trim().toLowerCase();
    if (q) rs = rs.filter(c => c.nome.toLowerCase().includes(q));
    if (this.filtroCargo !== 'Todos') rs = rs.filter(c => c.cargo === this.filtroCargo);
    if (this.filtroSetor !== 'Todos') rs = rs.filter(c => c.setor === this.filtroSetor);
    if (this.filtroStatus !== 'Todos') rs = rs.filter(c => c.status === this.filtroStatus);
    if (this.filtroTempoCasa !== 'Todos') {
      rs = rs.filter(c => {
        const meses = this.mesesDesde(c.admissao);
        const cat = this.categoriaTempoCasa(meses);
        return cat === this.filtroTempoCasa;
      });
    }
    return rs;
  }

  // Utilitários de tempo
  mesesDesde(isoDate: string): number {
    const start = new Date(isoDate);
    const now = new Date();
    return (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  }
  formatarDuracao(totalMeses: number): string {
    const anos = Math.floor(totalMeses / 12);
    const meses = totalMeses % 12;
    const pa = anos === 1 ? '1 ano' : `${anos} anos`;
    const pm = meses === 1 ? '1 mês' : `${meses} meses`;
    if (anos <= 0) return pm;
    if (meses <= 0) return pa;
    return `${pa} e ${pm}`;
  }
  categoriaTempoCasa(meses: number): '< 1 ano' | '1-3 anos' | '> 3 anos' {
    if (meses < 12) return '< 1 ano';
    if (meses <= 36) return '1-3 anos';
    return '> 3 anos';
  }
  tempoTotal(c: Colaborador): string { return this.formatarDuracao(this.mesesDesde(c.admissao)); }

  // Histórico e lançamento (somente front)
  historicos: Record<string, Registro[]> = {
    c1: [
      { id: 'r1', tipo: 'Anotação', data: '2025-05-20', observacao: 'Elogio do cliente pelo atendimento.' },
      { id: 'r2', tipo: 'Treinamento', data: '2025-03-10', observacao: 'Concluiu curso de segurança operacional.' }
    ],
    c2: [
      { id: 'r3', tipo: 'Advertência', data: '2024-11-02', observacao: 'Atraso recorrente.' }
    ]
  };
  modalHistoricoOpen = false;
  modalLancamentoOpen = false;
  selectedColab?: Colaborador;
  tiposRegistro = ['Elogio', 'Anotação', 'Treinamento', 'Advertência', 'Férias', 'Afastamento'];
  novoRegistro: Partial<Registro> = { tipo: 'Elogio', observacao: '', data: '' };

  // Ações
  limpar(): void {
    this.filtroNome = '';
    this.filtroCargo = 'Todos';
    this.filtroSetor = 'Todos';
    this.filtroTempoCasa = 'Todos';
    this.filtroStatus = 'Todos';
  }
  filtrar(): void {
    // Lista é reativa via getters; manter para semântica do botão
    console.log('Aplicar filtros', {
      nome: this.filtroNome, cargo: this.filtroCargo, setor: this.filtroSetor, tempoCasa: this.filtroTempoCasa, status: this.filtroStatus
    });
  }
  verHistorico(c: Colaborador): void {
    this.selectedColab = c;
    this.modalHistoricoOpen = true;
  }
  lancar(c: Colaborador): void {
    this.selectedColab = c;
    this.novoRegistro = { tipo: 'Elogio', observacao: '', data: '' };
    this.modalLancamentoOpen = true;
  }

  fecharHistorico(): void { this.modalHistoricoOpen = false; this.selectedColab = undefined; }
  fecharLancamento(): void { this.modalLancamentoOpen = false; this.novoRegistro = { tipo: 'Elogio', observacao: '', data: '' }; }
  salvarLancamento(): void {
    if (!this.selectedColab) return;
    const id = `r${Math.floor(Math.random() * 100000)}`;
    const data = this.parseDMYToISO(this.novoRegistro.data || '') || this.todayISO();
    const reg: Registro = {
      id,
      tipo: this.novoRegistro.tipo || 'Elogio',
      data,
      observacao: (this.novoRegistro.observacao || '').trim()
    };
    if (!reg.observacao) {
      console.warn('Observação obrigatória');
      return;
    }
    const arr = this.historicos[this.selectedColab.id] ||= [];
    arr.unshift(reg);
    this.fecharLancamento();
  }

  // Util: converte dd/mm/aaaa para yyyy-mm-dd (ISO simples)
  private parseDMYToISO(dmy: string): string | null {
    const m = (dmy || '').match(/^\s*(\d{2})\/(\d{2})\/(\d{4})\s*$/);
    if (!m) return null;
    const dd = Number(m[1]);
    const mm = Number(m[2]);
    const yyyy = Number(m[3]);
    if (!yyyy || mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
    return `${yyyy}-${String(mm).padStart(2,'0')}-${String(dd).padStart(2,'0')}`;
  }
  private todayISO(): string {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,'0')}-${String(hoje.getDate()).padStart(2,'0')}`;
  }

  getStatusClass(st: ColabStatus): string {
    switch (st) {
      case 'Ativo': return 'chip ativo';
      case 'Inativo': return 'chip inativo';
      case 'Suspenso': return 'chip suspenso';
    }
  }

  getHistoricoSelecionado(): Registro[] {
    return this.selectedColab ? (this.historicos[this.selectedColab.id] || []) : [];
  }

  // Gera um avatar SVG em data URL com iniciais do nome e cor baseada no hash
  avatarUrl(nome: string): string {
    const initials = this.obterIniciais(nome);
    const color = this.corPorNome(nome);
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
  <rect width="40" height="40" rx="8" fill="${color}" />
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="16" font-weight="700" fill="#fff" font-family="system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial">${initials}</text>
</svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }

  private obterIniciais(nome: string): string {
    const parts = (nome || '').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    const first = parts[0][0] || '';
    const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + last).toUpperCase();
  }

  private corPorNome(nome: string): string {
    const palette = ['#0ea5e9','#f59e0b','#10b981','#ef4444','#8b5cf6','#06b6d4','#4f46e5','#22c55e'];
    let hash = 0;
    for (let i = 0; i < (nome || '').length; i++) {
      hash = (hash << 5) - hash + nome.charCodeAt(i);
      hash |= 0; // força 32-bit
    }
    const idx = Math.abs(hash) % palette.length;
    return palette[idx];
  }
}