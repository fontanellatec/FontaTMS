import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GridSectionComponent, GridColumn, GridAction } from '../../shared/components/grid-section/grid-section.component';

type ColabStatus = 'Ativo' | 'Inativo' | 'Suspenso';

interface Colaborador {
  id: string;
  nome: string;
  foto?: string;
  cargo: string;
  setor: string;
  status: ColabStatus;
  admissao: string; // yyyy-MM-dd
  nascimento: string;
  whatsapp: string;
  demissao?: string; // yyyy-MM-dd
  badges: string[];
}

interface Aniversariante {
  nome: string;
  dia: string; // dd/MM
  foto?: string;
  hoje?: boolean;
  tipo: 'vida' | 'empresa'; // tipo de aniversário
  dataCompleta?: string; // data completa para cálculos
}

interface Registro {
  id: string;
  tipo: string;
  data: string; // yyyy-MM-dd
  observacao: string;
}

import { FilterSectionComponent, FilterConfig } from '../../shared/components/filter-section/filter-section.component';
import { KpiSectionComponent, KpiConfig } from '../../shared/components/kpi-section/kpi-section.component';

@Component({
  selector: 'app-controle-colaboradores',
  templateUrl: './controle-colaboradores.component.html',
  styleUrls: ['./controle-colaboradores.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, FilterSectionComponent, KpiSectionComponent, GridSectionComponent]
})
export class ControleColaboradoresComponent implements OnInit {
  ngOnInit() {
    // Marcar aniversariantes de hoje
    const hoje = new Date();
    const diaHoje = hoje.getDate();
    const mesHoje = hoje.getMonth() + 1;
    
    this.aniversariantes.forEach(aniversariante => {
      const [dia, mes] = aniversariante.dia.split('/').map(Number);
      aniversariante.hoje = (dia === diaHoje && mes === mesHoje);
    });
  }

  // Filtros
  filtroNome = '';
  filtroCargo = 'Todos';
  filtroSetor = 'Todos';
  filtroTempoCasa: 'Todos' | '< 1 ano' | '1-3 anos' | '> 3 anos' = 'Todos';
  filtroStatus: 'Todos' | 'Ativo' | 'Inativo' | 'Suspenso' = 'Todos';

  // Estado dos filtros e KPIs (colapsado/expandido)
  filtersCollapsed = true;
  kpisCollapsed = false;

  // Estado do grid
  gridCollapsed = false;

  // Configuração das colunas e ações do grid
  gridColumns: GridColumn[] = [
    { key: 'nome', label: 'Nome', sortable: true, width: '180px', sticky: true, stickyLeft: 0 },
    { key: 'cargo', label: 'Cargo', sortable: true, width: '140px', sticky: true, stickyLeft: 180 },
    { key: 'setor', label: 'Setor', sortable: true, width: '120px', sticky: true, stickyLeft: 320 },
    { key: 'status', label: 'Status', type: 'status', sortable: true },
    { key: 'admissao', label: 'Admissão', type: 'date', sortable: true }
  ];
  gridActions: GridAction[] = [
    { action: 'ficha', label: 'Ficha', type: 'primary' },
    { action: 'historico', label: 'Histórico', type: 'secondary' },
    { action: 'lancar', label: 'Lançar', type: 'success' }
  ];

  onGridAction(evt: { action: string; row: any }) {
    const c = evt.row;
    if (!c) return;
    switch (evt.action) {
      case 'ficha': this.abrirFicha(c); break;
      case 'historico': this.verHistorico(c); break;
      case 'lancar': this.lancar(c); break;
      default: console.log('Ação não reconhecida:', evt);
    }
  }

  // Configuração dos filtros para componente padronizado
  filtersConfig: FilterConfig[] = [
    { type: 'text', label: 'Nome', key: 'nome', value: this.filtroNome, placeholder: 'Digite o nome' },
    { type: 'select', label: 'Cargo', key: 'cargo', value: this.filtroCargo, options: [
      { label: 'Todos os cargos', value: 'Todos' },
      { label: 'Analista', value: 'Analista' },
      { label: 'Desenvolvedor', value: 'Desenvolvedor' },
      { label: 'Gerente', value: 'Gerente' },
      { label: 'Coordenador', value: 'Coordenador' }
    ] },
    { type: 'select', label: 'Setor', key: 'setor', value: this.filtroSetor, options: [
      { label: 'Todos os setores', value: 'Todos' },
      { label: 'TI', value: 'TI' },
      { label: 'RH', value: 'RH' },
      { label: 'Financeiro', value: 'Financeiro' },
      { label: 'Comercial', value: 'Comercial' }
    ] },
    { type: 'select', label: 'Tempo de Casa', key: 'tempoCasa', value: this.filtroTempoCasa, options: [
      { label: 'Qualquer tempo', value: 'Todos' },
      { label: '< 1 ano', value: '< 1 ano' },
      { label: '1-3 anos', value: '1-3 anos' },
      { label: '> 3 anos', value: '> 3 anos' }
    ] },
    { type: 'select', label: 'Status', key: 'status', value: this.filtroStatus, options: [
      { label: 'Todos', value: 'Todos' },
      { label: 'Ativo', value: 'Ativo' },
      { label: 'Inativo', value: 'Inativo' },
      { label: 'Suspenso', value: 'Suspenso' }
    ] }
  ];

  onFiltersChange(values: any): void {
    this.filtroNome = values?.nome ?? '';
    this.filtroCargo = values?.cargo ?? 'Todos';
    this.filtroSetor = values?.setor ?? 'Todos';
    this.filtroTempoCasa = values?.tempoCasa ?? 'Todos';
    this.filtroStatus = values?.status ?? 'Todos';
  }

  getColabKpis(): KpiConfig[] {
    return [
      { label: 'Colaboradores Ativos', value: this.ativos, icon: 'users', color: '#059669' },
      { label: 'Admissões (Mês)', value: this.admissoesMes, icon: 'plus', color: '#2563eb' },
      { label: 'Demissões (Mês)', value: this.demissoesMes, icon: 'download', color: '#dc2626' },
      { label: 'Tempo Médio de Empresa', value: this.tempoMedioEmpresa, icon: 'route', format: 'text', color: '#0ea5e9' }
    ];
  }
  // Dados simulados
  colabs: Colaborador[] = [
    { id: 'c1', nome: 'João Silva', cargo: 'Analista', setor: 'Operações', status: 'Ativo', admissao: '2018-02-10', nascimento: '1990-06-30', whatsapp: '(11) 99999-1234', badges: ['Veterano da Jornada'] },
    { id: 'c2', nome: 'Maria Oliveira', cargo: 'Assistente', setor: 'RH', status: 'Inativo', admissao: '2022-05-18', nascimento: '1988-05-30', whatsapp: '(11) 98888-5678', badges: ['Pleno de Rota'], demissao: '2025-06-10' },
    { id: 'c3', nome: 'Carlos Lima', cargo: 'Coordenador', setor: 'Operações', status: 'Ativo', admissao: '2020-03-01', nascimento: '1985-06-15', whatsapp: '(11) 97777-9012', badges: ['Veterano da Jornada'] },
    { id: 'c4', nome: 'Ana Souza', cargo: 'Analista', setor: 'Financeiro', status: 'Ativo', admissao: '2023-08-15', nascimento: '1992-06-22', whatsapp: '(11) 96666-3456', badges: ['Pleno de Rota'] },
    { id: 'c5', nome: 'Bruno Costa', cargo: 'Auxiliar', setor: 'Operações', status: 'Suspenso', admissao: '2021-11-25', nascimento: '1987-06-05', whatsapp: '(11) 95555-7890', badges: ['Veterano da Jornada'] },
    { id: 'c6', nome: 'Fernanda Lima', cargo: 'Analista', setor: 'RH', status: 'Ativo', admissao: '2019-06-06', nascimento: '1988-06-05', whatsapp: '(11) 94444-2345', badges: ['Pleno de Rota'] },
    { id: 'c7', nome: 'Ricardo Alves', cargo: 'Assistente', setor: 'Financeiro', status: 'Ativo', admissao: '2024-12-19', nascimento: '1991-06-07', whatsapp: '(11) 93333-6789', badges: ['Pleno de Rota'] }
  ];

  aniversariantes: Aniversariante[] = [
    { nome: 'Maria Oliveira', dia: '30/05', foto: 'avatars/avatar-user.svg', tipo: 'vida', dataCompleta: '1990-05-30' },
    { nome: 'João Silva', dia: '30/06', foto: 'avatars/avatar-user.svg', hoje: true, tipo: 'vida', dataCompleta: '1985-06-30' },
    { nome: 'Carlos Lima', dia: '15/06', foto: 'avatars/avatar-user.svg', tipo: 'empresa', dataCompleta: '2020-06-15' },
    { nome: 'Ana Souza', dia: '22/06', foto: 'avatars/avatar-user.svg', tipo: 'vida', dataCompleta: '1992-06-22' },
    { nome: 'Bruno Costa', dia: '03/06', foto: 'avatars/avatar-user.svg', tipo: 'empresa', dataCompleta: '2021-06-03' },
    { nome: 'Fernanda Lima', dia: '05/06', foto: 'avatars/avatar-user.svg', tipo: 'vida', dataCompleta: '1988-06-05' },
    { nome: 'Ricardo Alves', dia: '07/06', foto: 'avatars/avatar-user.svg', tipo: 'empresa', dataCompleta: '2024-06-07' }
  ];

  // Opções dinâmicas derivadas dos dados
  get cargos(): string[] { return ['Todos', ...Array.from(new Set(this.colabs.map(c => c.cargo)))]; }
  get setores(): string[] { return ['Todos', ...Array.from(new Set(this.colabs.map(c => c.setor)))]; }

  // Estatísticas
  get ativos(): number { return this.colabs.filter(c => c.status === 'Ativo').length; }
  get aniversariantesDoMes(): number {
    const now = new Date();
    const mesAtual = now.getMonth() + 1; // getMonth() retorna 0-11, precisamos 1-12
    return this.aniversariantes.filter(a => {
      const [dia, mes] = a.dia.split('/').map(Number);
      return mes === mesAtual;
    }).length;
  }
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
  // Estado do modal da ficha do colaborador
  modalFichaOpen = false;
  colaboradorSelecionado: Colaborador | null = null;
  modalHistoricoOpen = false;
  modalLancamentoOpen = false;
  modalParabensOpen = false;
  aniversarianteSelecionado: Aniversariante | null = null;
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

  // Métodos para toggle das seções
  toggleFilters(): void {
    this.filtersCollapsed = !this.filtersCollapsed;
  }

  toggleKpis(): void {
    this.kpisCollapsed = !this.kpisCollapsed;
  }

  // Método para novo colaborador
  novoColaborador(): void {
    console.log('Abrir modal/página para novo colaborador');
    // Implementar navegação ou modal para cadastro de novo colaborador
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

  // Métodos para ficha do colaborador
  abrirFicha(colaborador: Colaborador) {
    this.colaboradorSelecionado = colaborador;
    this.modalFichaOpen = true;
  }

  fecharFicha() {
    this.modalFichaOpen = false;
    this.colaboradorSelecionado = null;
  }

  calcularTempoEmpresa(admissao: string): string {
    const dataAdmissao = new Date(admissao);
    const hoje = new Date();
    const diffTime = Math.abs(hoje.getTime() - dataAdmissao.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const anos = Math.floor(diffDays / 365);
    const meses = Math.floor((diffDays % 365) / 30);
    
    if (anos > 0) {
      return meses > 0 ? `${anos} ano${anos > 1 ? 's' : ''} e ${meses} mês${meses > 1 ? 'es' : ''}` : `${anos} ano${anos > 1 ? 's' : ''}`;
    } else {
      return `${meses} mês${meses > 1 ? 'es' : ''}`;
    }
  }

  formatarData(data: string): string {
    const date = new Date(data);
    return date.toLocaleDateString('pt-BR');
  }

  // Métodos para modal de parabéns
  abrirParabens(aniversariante: Aniversariante) {
    this.aniversarianteSelecionado = aniversariante;
    this.modalParabensOpen = true;
  }

  fecharParabens() {
    this.modalParabensOpen = false;
    this.aniversarianteSelecionado = null;
  }

  gerarMensagemParabens(): string {
    if (!this.aniversarianteSelecionado) return '';
    
    const nome = this.aniversarianteSelecionado.nome;
    
    if (this.aniversarianteSelecionado.tipo === 'empresa') {
      return `Parabéns, ${nome}, por mais um ano de dedicação e conquistas na nossa equipe! 🏅<br>Agradecemos por sua trajetória e comprometimento.<br><br>Um grande abraço do RH!`;
    } else {
      return `Feliz aniversário, ${nome}! 🎉<br>Que seu dia seja repleto de alegrias, conquistas e muito sucesso. Agradecemos por fazer parte da nossa equipe!`;
    }
  }

  copiarMensagem() {
    const mensagem = this.gerarMensagemParabens();
    navigator.clipboard.writeText(mensagem).then(() => {
      alert('Mensagem copiada para a área de transferência!');
    }).catch(() => {
      alert('Erro ao copiar mensagem. Tente novamente.');
    });
  }

  abrirWhatsApp() {
    if (!this.aniversarianteSelecionado) return;
    
    // Buscar o colaborador correspondente para obter o WhatsApp
    const colaborador = this.colabs.find(c => c.nome === this.aniversarianteSelecionado!.nome);
    if (!colaborador || !colaborador.whatsapp) {
      alert('WhatsApp não encontrado para este colaborador.');
      return;
    }
    
    const mensagem = this.gerarMensagemParabens();
    const numeroLimpo = colaborador.whatsapp.replace(/\D/g, '');
    const url = `https://wa.me/55${numeroLimpo}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
  }

  abrirEmail() {
    if (!this.aniversarianteSelecionado) return;
    
    const nome = this.aniversarianteSelecionado.nome;
    const tipo = this.aniversarianteSelecionado.tipo === 'empresa' ? 'Empresa' : 'Vida';
    const assunto = `Parabéns pelo Aniversário de ${tipo} - ${nome}`;
    const mensagem = this.gerarMensagemParabens();
    
    const url = `mailto:?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
  }
}