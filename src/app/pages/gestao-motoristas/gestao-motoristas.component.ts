import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JustificationFieldComponent } from '../../core/justification-field.component';
import { JustificationConfig, JustificationPresets } from '../../core/justification-field.types';
// Removido sanitizer, mockup viewer não será mais utilizado

type DriverStatus = 'Ativo' | 'Inativo' | 'Suspenso';

interface Driver {
  id: string;
  codigo: string;
  nome: string;
  cpf: string;
  cnh: string;
  cnhValidade: string; // yyyy-mm-dd
  equipe: string;
  categoria: string;
  situacao: string; // ex: Trabalhando, Afastado, Aguardando Programação
  gestor: string;
  status: DriverStatus; // Ativo/Inativo/Suspenso
  bloqueado: boolean;
  feriasProgramadas: boolean;
  novo?: boolean;
  telefone?: string;
  email?: string;
}

interface Team {
  id: string;
  nome: string;
  descricao?: string;
}

interface Policies {
  obrigarCnhValida: boolean;
  bloquearSemTreinamento: boolean;
  maxHorasRota: number; // 0 desativa
  intervaloMinDescanso: number; // horas
}

@Component({
  selector: 'app-gestao-motoristas',
  templateUrl: './gestao-motoristas.component.html',
  styleUrls: ['./gestao-motoristas.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, JustificationFieldComponent]
})
export class GestaoMotoristasComponent {
  Math = Math;
  // Placeholder state; will be replaced per mockup
  search = '';

  // Mockup removido

  // Gestão de Motoristas
  tab: any = 'cadastro';
  drivers: Driver[] = [];
  teams: Team[] = [];
  policies: Policies = {
    obrigarCnhValida: true,
    bloquearSemTreinamento: false,
    maxHorasRota: 10,
    intervaloMinDescanso: 8,
  };
  driverStatuses: DriverStatus[] = ['Ativo', 'Inativo', 'Suspenso'];

  // Filtros - Cadastro
  cadStatusFilter: DriverStatus | 'Todos' = 'Todos';
  cadEquipeFilter: string | 'Todas' = 'Todas';
  cadSearch = '';
  private cadSearchDebounce?: any;
  onCadFiltersChanged(): void { this.page = 1; }
  cadCategoriaFilter: string | 'Todas' = 'Todas';
  cadSituacaoFilter: string | 'Todas' = 'Todas';
  cadBloqueioFilter: 'Todos' | 'Sim' | 'Não' = 'Todos';
  cadFeriasFilter: 'Todos' | 'Sim' | 'Não' = 'Todos';

  // Estado dos filtros (colapsado/expandido)
  filtersCollapsed = false;
  
  // Estado dos KPIs (colapsado/expandido)
  kpisCollapsed = false;

  // Propriedade para busca geral
  searchTerm = '';

  // Modal de motorista
  driverModalOpen = false;
  isEditing = false;
  driverForm: Driver | null = null;

  // Modais de confirmação e justificativa
  statusConfirmModalOpen = false;
  blockJustificationModalOpen = false;
  pendingStatusDriver: Driver | null = null;
  pendingBlockDriver: Driver | null = null;
  justificationText = '';
  pendingBlockAction: 'block' | 'unblock' = 'block';
  
  // Configuração do campo de justificativa
  justificationConfig: JustificationConfig = {
    ...JustificationPresets.userBlock,
    helpText: 'Esta ação será registrada no histórico do motorista e não poderá ser desfeita.'
  };

  // Form Equipes
  newTeamName = '';
  newTeamDesc = '';

  private readonly LS_DRIVERS = 'gm_drivers_v1';
  private readonly LS_TEAMS = 'gm_teams_v1';
  private readonly LS_POLICIES = 'gm_policies_v1';
  private readonly LS_RISK = 'gm_driver_risk_v1';
  private readonly LS_CATEGORIES = 'gm_categories_v1';
  private readonly LS_SITUACOES = 'gm_situacoes_v1';
  private readonly LS_REGISTRO = 'gm_driver_registro_v1';
  private readonly LS_EXAME = 'gm_driver_exame_v1';
  private readonly LS_ANEXO = 'gm_driver_anexo_v1';
  private readonly LS_FERIAS = 'gm_driver_ferias_v1';
  private readonly LS_DIARIA = 'gm_driver_diarias_v1';
  private readonly LS_DESCONTO = 'gm_driver_descontos_v1';

  constructor() {
    this.loadAll();
  }

  // Funções de mockup removidas

  // Helpers: Gestão
  // Ordenação e paginação
  sortKey: 'codigo' | 'nome' | 'cpf' | 'cnh' | 'cnhValidade' | 'equipe' | 'status' | 'categoria' | 'situacao' | 'gestor' = 'nome';
  sortDir: 'asc' | 'desc' = 'asc';
  page = 1;
  pageSize = 10;
  pageSizeOptions = [10, 25, 50];

  setSort(key: 'codigo' | 'nome' | 'cpf' | 'cnh' | 'cnhValidade' | 'equipe' | 'status' | 'categoria' | 'situacao' | 'gestor'): void {
    if (this.sortKey === key) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = key;
      this.sortDir = 'asc';
    }
    this.page = 1;
  }

  setPageSize(n: number): void {
    this.pageSize = Number(n) || 10;
    this.page = 1;
  }
  nextPage(): void { if (this.page < this.pageCount) this.page++; }
  prevPage(): void { if (this.page > 1) this.page--; }

  private loadAll(): void {
    try {
      const d = localStorage.getItem(this.LS_DRIVERS);
      const t = localStorage.getItem(this.LS_TEAMS);
      const p = localStorage.getItem(this.LS_POLICIES);
      const r = localStorage.getItem(this.LS_RISK);
      const c = localStorage.getItem(this.LS_CATEGORIES);
      const s = localStorage.getItem(this.LS_SITUACOES);
      const rg = localStorage.getItem(this.LS_REGISTRO);
      const ex = localStorage.getItem(this.LS_EXAME);
      const an = localStorage.getItem(this.LS_ANEXO);
      const fe = localStorage.getItem(this.LS_FERIAS);
      const di = localStorage.getItem(this.LS_DIARIA);
      const de = localStorage.getItem(this.LS_DESCONTO);
      this.drivers = d ? JSON.parse(d) : this.defaultDrivers();
      this.teams = t ? JSON.parse(t) : this.defaultTeams();
      this.policies = p ? JSON.parse(p) : this.policies;
      this.riskByDriver = r ? JSON.parse(r) : {};
      this.categorias = c ? JSON.parse(c) : this.defaultCategories();
      this.situacoes = s ? JSON.parse(s) : this.defaultSituacoes();
      this.registroByDriver = rg ? JSON.parse(rg) : {};
      this.exameByDriver = ex ? JSON.parse(ex) : {};
      this.anexoByDriver = an ? JSON.parse(an) : {};
      this.feriasByDriver = fe ? JSON.parse(fe) : {};
      this.diariaByDriver = di ? JSON.parse(di) : {};
      this.descontoByDriver = de ? JSON.parse(de) : {};
    } catch {
      this.drivers = this.defaultDrivers();
      this.teams = this.defaultTeams();
    }
    // Garante equipes presentes nas opções
    if (this.teams.length === 0) {
      this.teams = this.defaultTeams();
    }
    if (!this.categorias || this.categorias.length === 0) this.categorias = this.defaultCategories();
    if (!this.situacoes || this.situacoes.length === 0) this.situacoes = this.defaultSituacoes();
  }

  private persistDrivers(): void {
    localStorage.setItem(this.LS_DRIVERS, JSON.stringify(this.drivers));
  }
  private persistTeams(): void {
    localStorage.setItem(this.LS_TEAMS, JSON.stringify(this.teams));
  }
  onPoliciesChange(): void {
    localStorage.setItem(this.LS_POLICIES, JSON.stringify(this.policies));
  }
  private persistRisk(): void {
    localStorage.setItem(this.LS_RISK, JSON.stringify(this.riskByDriver));
  }
  private persistCategories(): void {
    localStorage.setItem(this.LS_CATEGORIES, JSON.stringify(this.categorias));
  }
  private persistSituacoes(): void {
    localStorage.setItem(this.LS_SITUACOES, JSON.stringify(this.situacoes));
  }
  private persistRegistro(): void {
    localStorage.setItem(this.LS_REGISTRO, JSON.stringify(this.registroByDriver));
  }
  private persistExame(): void {
    localStorage.setItem(this.LS_EXAME, JSON.stringify(this.exameByDriver));
  }
  private persistAnexo(): void {
    localStorage.setItem(this.LS_ANEXO, JSON.stringify(this.anexoByDriver));
  }
  private persistFerias(): void {
    localStorage.setItem(this.LS_FERIAS, JSON.stringify(this.feriasByDriver));
  }
  private persistDiaria(): void {
    localStorage.setItem(this.LS_DIARIA, JSON.stringify(this.diariaByDriver));
  }
  private persistDesconto(): void {
    localStorage.setItem(this.LS_DESCONTO, JSON.stringify(this.descontoByDriver));
  }

  private defaultTeams(): Team[] {
    return [
      { id: this.uid('team'), nome: 'Equipe A' },
      { id: this.uid('team'), nome: 'Equipe B' },
      { id: this.uid('team'), nome: 'Equipe C' },
    ];
  }

  categorias: string[] = [];
  situacoes: string[] = [];
  private defaultDrivers(): Driver[] {
    const today = new Date();
    const nextYear = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate())
      .toISOString().slice(0, 10);
    const tnames = ['Equipe A', 'Equipe B', 'Equipe C'];
    const cats = this.categorias && this.categorias.length ? this.categorias : this.defaultCategories();
    const sits = this.situacoes && this.situacoes.length ? this.situacoes : this.defaultSituacoes();
    return [
      {
        id: this.uid('drv'), codigo: '12345678901', nome: 'João da Silva', cpf: '123.456.789-01',
        cnh: '000000001', cnhValidade: nextYear, equipe: tnames[0],
        categoria: cats[0] || 'CATEGORIA I - MOT DEDICADO', situacao: sits[0] || 'Trabalhando', gestor: 'Mario Souza',
        status: 'Ativo', bloqueado: false, feriasProgramadas: false, novo: false, telefone: '(11) 99999-1111'
      },
      {
        id: this.uid('drv'), codigo: '98765432001', nome: 'Marcos Souza', cpf: '987.654.321-01',
        cnh: '000000002', cnhValidade: nextYear, equipe: tnames[1],
        categoria: cats[1] || 'CATEGORIA II - MOT CARRETA 6 E 7 EIXOS', situacao: sits[2] || 'Afastado', gestor: 'Marcos Lima',
        status: 'Ativo', bloqueado: false, feriasProgramadas: true, novo: false
      },
      {
        id: this.uid('drv'), codigo: '11122233344', nome: 'Carlos Pereira', cpf: '111.222.333-44',
        cnh: '000000003', cnhValidade: nextYear, equipe: tnames[2],
        categoria: cats[2] || 'CATEGORIA III - MOT RODOCAVAMBA', situacao: sits[1] || 'Aguardando Programação', gestor: 'Paulo Ferreira',
        status: 'Ativo', bloqueado: true, feriasProgramadas: false, novo: true
      },
    ];
  }
  private defaultCategories(): string[] {
    return [
      'CATEGORIA I - MOT DEDICADO',
      'CATEGORIA II - MOT CARRETA 6 E 7 EIXOS',
      'CATEGORIA III - MOT RODOCAVAMBA'
    ];
  }
  private defaultSituacoes(): string[] {
    return [
      'Trabalhando',
      'Aguardando Programação',
      'Afastado'
    ];
  }

  private uid(prefix: string): string {
    return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
  }

  get equipeOptions(): string[] {
    return Array.from(new Set(this.teams.map(t => t.nome)));
  }
  get categoriaOptions(): string[] { return this.categorias; }
  get situacaoOptions(): string[] { return this.situacoes; }

  get filteredDrivers(): Driver[] {
    return this.drivers.filter(d => {
      if (this.cadStatusFilter !== 'Todos' && d.status !== this.cadStatusFilter) return false;
      if (this.cadEquipeFilter !== 'Todas' && d.equipe !== this.cadEquipeFilter) return false;
      if (this.cadCategoriaFilter !== 'Todas' && d.categoria !== this.cadCategoriaFilter) return false;
      if (this.cadSituacaoFilter !== 'Todas' && d.situacao !== this.cadSituacaoFilter) return false;
      if (this.cadBloqueioFilter !== 'Todos') {
        const blocked = d.bloqueado ? 'Sim' : 'Não';
        if (blocked !== this.cadBloqueioFilter) return false;
      }
      if (this.cadFeriasFilter !== 'Todos') {
        const ferias = d.feriasProgramadas ? 'Sim' : 'Não';
        if (ferias !== this.cadFeriasFilter) return false;
      }
      const q = this.cadSearch.trim().toLowerCase();
      if (q) {
        return (
          (d.codigo || '').toLowerCase().includes(q) ||
          d.nome.toLowerCase().includes(q) ||
          d.cpf.toLowerCase().includes(q) ||
          d.cnh.toLowerCase().includes(q) ||
          (d.gestor || '').toLowerCase().includes(q) ||
          (d.telefone || '').toLowerCase().includes(q) ||
          (d.email || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }

  get sortedDrivers(): Driver[] {
    const arr = [...this.filteredDrivers];
    const dir = this.sortDir === 'asc' ? 1 : -1;
    arr.sort((a, b) => {
      const ka: any = (a as any)[this.sortKey] ?? '';
      const kb: any = (b as any)[this.sortKey] ?? '';
      if (this.sortKey === 'cnhValidade') {
        const da = ka ? new Date(ka).getTime() : 0;
        const db = kb ? new Date(kb).getTime() : 0;
        return (da - db) * dir;
      }
      return String(ka).localeCompare(String(kb), 'pt-BR') * dir;
    });
    return arr;
  }

  get pageCount(): number {
    return Math.max(1, Math.ceil(this.filteredDrivers.length / this.pageSize));
  }

  get pagedDrivers(): Driver[] {
    const start = (this.page - 1) * this.pageSize;
    return this.sortedDrivers.slice(start, start + this.pageSize);
  }

  getStatusClass(st: DriverStatus): string {
    switch (st) {
      case 'Ativo': return 'status ativo';
      case 'Inativo': return 'status inativo';
      case 'Suspenso': return 'status suspenso';
    }
  }

  isCnhVencida(dateStr: string | undefined | null): boolean {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    const today = new Date();
    // zerar horas
    d.setHours(0,0,0,0); today.setHours(0,0,0,0);
    return d.getTime() < today.getTime();
  }

  get canSaveDriver(): boolean {
    const f = this.driverForm;
    if (!f) return false;
    // Campos básicos
    const baseOk = !!f.nome && !!(f.cpf);
    if (!this.policies.obrigarCnhValida) return baseOk;
    // Política: obrigar CNH válida
    const hasCnh = !!f.cnh;
    const hasVal = !!f.cnhValidade;
    const vencida = hasVal ? this.isCnhVencida(f.cnhValidade) : true;
    return baseOk && hasCnh && hasVal && !vencida;
  }

  // CRUD Motoristas
  openNewDriver(): void {
    this.isEditing = false;
    this.driverForm = {
      id: this.uid('drv'),
      codigo: String(Math.floor(Math.random() * 90000000000) + 10000000000),
      nome: '',
      cpf: '',
      cnh: '',
      cnhValidade: '',
      equipe: this.equipeOptions[0] || '',
      categoria: this.categoriaOptions[0] || 'CATEGORIA I - MOT DEDICADO',
      situacao: 'Trabalhando',
      gestor: '',
      status: 'Ativo',
      bloqueado: false,
      feriasProgramadas: false,
      telefone: '',
      email: '',
    };
    this.driverModalOpen = true;
  }

  openEditDriver(d: Driver): void {
    this.isEditing = true;
    this.driverForm = { ...d };
    this.driverModalOpen = true;
  }

  closeDriverModal(): void {
    this.driverModalOpen = false;
    this.driverForm = null;
  }

  saveDriver(): void {
    if (!this.driverForm) return;
    if (!this.canSaveDriver) return;
    const f = this.driverForm;
    if (!f.nome.trim() || !f.equipe.trim()) {
      // validação simples
      return;
    }
    const idx = this.drivers.findIndex(x => x.id === f.id);
    if (idx >= 0) {
      this.drivers[idx] = { ...f };
    } else {
      this.drivers.unshift({ ...f });
    }
    this.persistDrivers();
    this.closeDriverModal();
  }

  deleteDriver(d: Driver): void {
    const ok = confirm(`Remover motorista "${d.nome}"?`);
    if (!ok) return;
    this.drivers = this.drivers.filter(x => x.id !== d.id);
    this.persistDrivers();
  }

  // Equipes
  addTeam(): void {
    const nome = (this.newTeamName || '').trim();
    if (!nome) return;
    if (this.teams.some(t => t.nome.toLowerCase() === nome.toLowerCase())) return;
    this.teams.push({ id: this.uid('team'), nome, descricao: this.newTeamDesc.trim() });
    this.newTeamName = '';
    this.newTeamDesc = '';
    this.persistTeams();
  }

  removeTeam(t: Team): void {
    const ok = confirm(`Remover a equipe "${t.nome}"?`);
    if (!ok) return;
    // atualiza motoristas que tinham essa equipe
    this.drivers = this.drivers.map(d => d.equipe === t.nome ? { ...d, equipe: '' } : d);
    this.teams = this.teams.filter(x => x.id !== t.id);
    this.persistTeams();
    this.persistDrivers();
  }

  // Status e Bloqueio
  toggleStatus(d: Driver): void {
    this.pendingStatusDriver = d;
    this.statusConfirmModalOpen = true;
  }

  confirmStatusChange(): void {
    if (!this.pendingStatusDriver) return;
    const newStatus = this.pendingStatusDriver.status === 'Ativo' ? 'Inativo' : 'Ativo';
    this.pendingStatusDriver.status = newStatus;
    this.persistDrivers();
    this.closeStatusConfirmModal();
  }

  closeStatusConfirmModal(): void {
    this.statusConfirmModalOpen = false;
    this.pendingStatusDriver = null;
  }

  toggleBloqueio(d: Driver): void {
    this.pendingBlockDriver = d;
    this.pendingBlockAction = d.bloqueado ? 'unblock' : 'block';
    this.justificationText = '';
    this.blockJustificationModalOpen = true;
  }

  confirmBlockChange(): void {
    if (!this.pendingBlockDriver || !this.justificationText.trim()) return;
    this.pendingBlockDriver.bloqueado = !this.pendingBlockDriver.bloqueado;
    // Aqui você pode salvar a justificativa se necessário
    // Por exemplo: this.saveBlockJustification(this.pendingBlockDriver.id, this.justificationText);
    this.persistDrivers();
    this.closeBlockJustificationModal();
  }

  closeBlockJustificationModal(): void {
    this.blockJustificationModalOpen = false;
    this.pendingBlockDriver = null;
    this.justificationText = '';
  }

  // Contagens (cards)
  get activeCount(): number { return this.drivers.filter(d => d.status === 'Ativo').length; }
  get workingCount(): number { return this.drivers.filter(d => d.situacao === 'Trabalhando').length; }
  get afastadosCount(): number { return this.drivers.filter(d => d.situacao === 'Afastado').length; }
  get newDriversCount(): number { return this.drivers.filter(d => d.novo).length; }

  // Modal Ações do Motorista (Análise de Risco)
  driverActionsOpen = false;
  actionsTab: 'risco' | 'registro' | 'exame' | 'anexo' | 'ferias' | 'diaria' | 'desconto' = 'risco';
  activeDriver: Driver | null = null;
  riskForm: { seguradora: string; dataConsulta: string; dataVencimento: string; pontuacao: number } = {
    seguradora: 'Porto', dataConsulta: '', dataVencimento: '', pontuacao: 0
  };
  seguradoras = ['Porto', 'Mapfre', 'SulAmérica'];
  riskByDriver: Record<string, Array<{ seguradora: string; dataConsulta: string; dataVencimento: string; pontuacao: number; createdAt: string }>> = {};

  openDriverActions(d: Driver): void {
    this.activeDriver = d;
    this.driverActionsOpen = true;
    this.actionsTab = 'risco';
    this.riskForm = { seguradora: 'Porto', dataConsulta: '', dataVencimento: '', pontuacao: 0 };
  }
  closeDriverActions(): void {
    this.driverActionsOpen = false;
    this.activeDriver = null;
  }
  saveRiskAnalysis(): void {
    if (!this.activeDriver) return;
    const entry = { ...this.riskForm, createdAt: new Date().toISOString() };
    const id = this.activeDriver.id;
    if (!this.riskByDriver[id]) this.riskByDriver[id] = [];
    this.riskByDriver[id].push(entry);
    this.persistRisk();
  }

  clearFilters(): void {
    this.cadSearch = '';
    this.cadStatusFilter = 'Todos';
    this.cadEquipeFilter = 'Todas';
    this.cadCategoriaFilter = 'Todas';
    this.cadSituacaoFilter = 'Todas';
    this.cadBloqueioFilter = 'Todos';
    this.cadFeriasFilter = 'Todos';
    this.page = 1;
  }

  toggleFilters(): void {
    this.filtersCollapsed = !this.filtersCollapsed;
  }

  toggleKpis(): void {
    this.kpisCollapsed = !this.kpisCollapsed;
  }

  onCadSearchChanged(value: string): void {
    this.cadSearch = value ?? '';
    if (this.cadSearchDebounce) clearTimeout(this.cadSearchDebounce);
    this.cadSearchDebounce = setTimeout(() => {
      this.onCadFiltersChanged();
    }, 250);
  }

  clearSearch(): void {
    if (!this.cadSearch) return;
    this.cadSearch = '';
    this.onCadFiltersChanged();
  }

  onSearchChanged(): void {
    // Implementação da busca geral se necessário
    // Por enquanto, mantém compatibilidade com o sistema existente
  }

  // Modais de cadastro: Categoria e Situação
  categoryModalOpen = false;
  situacaoModalOpen = false;
  newCategoryName = '';
  newSituacaoName = '';

  // Edição inline de Categoria/Situação
  editingCategory: string | null = null;
  editingCategoryValue = '';
  editingSituacao: string | null = null;
  editingSituacaoValue = '';

  openCategoryModal(): void { this.newCategoryName = ''; this.categoryModalOpen = true; }
  closeCategoryModal(): void { this.categoryModalOpen = false; }
  addCategory(): void {
    const n = this.newCategoryName.trim();
    if (!n) return;
    if (this.categorias.some(c => c.toLowerCase() === n.toLowerCase())) return;
    this.categorias.push(n);
    this.persistCategories();
    this.categoryModalOpen = false;
  }
  removeCategory(name: string): void {
    this.categorias = this.categorias.filter(c => c !== name);
    this.persistCategories();
  }

  startEditCategory(name: string): void {
    this.editingCategory = name;
    this.editingCategoryValue = name;
  }
  cancelEditCategory(): void {
    this.editingCategory = null;
    this.editingCategoryValue = '';
  }
  saveEditCategory(): void {
    const original = this.editingCategory;
    const newName = (this.editingCategoryValue || '').trim();
    if (!original) return;
    if (!newName) { this.cancelEditCategory(); return; }
    // não permitir duplicados (exceto se igual ao original)
    const exists = this.categorias.some(c => c.toLowerCase() === newName.toLowerCase() && c !== original);
    if (exists) return;
    // renomeia na lista de categorias
    this.categorias = this.categorias.map(c => c === original ? newName : c);
    // atualiza motoristas que tinham a categoria antiga
    this.drivers = this.drivers.map(d => d.categoria === original ? { ...d, categoria: newName } : d);
    this.persistCategories();
    this.persistDrivers();
    this.cancelEditCategory();
  }

  openSituacaoModal(): void { this.newSituacaoName = ''; this.situacaoModalOpen = true; }
  closeSituacaoModal(): void { this.situacaoModalOpen = false; }
  addSituacao(): void {
    const n = this.newSituacaoName.trim();
    if (!n) return;
    if (this.situacoes.some(s => s.toLowerCase() === n.toLowerCase())) return;
    this.situacoes.push(n);
    this.persistSituacoes();
    this.situacaoModalOpen = false;
  }
  removeSituacao(name: string): void {
    this.situacoes = this.situacoes.filter(s => s !== name);
    this.persistSituacoes();
  }

  startEditSituacao(name: string): void {
    this.editingSituacao = name;
    this.editingSituacaoValue = name;
  }
  cancelEditSituacao(): void {
    this.editingSituacao = null;
    this.editingSituacaoValue = '';
  }
  saveEditSituacao(): void {
    const original = this.editingSituacao;
    const newName = (this.editingSituacaoValue || '').trim();
    if (!original) return;
    if (!newName) { this.cancelEditSituacao(); return; }
    const exists = this.situacoes.some(s => s.toLowerCase() === newName.toLowerCase() && s !== original);
    if (exists) return;
    this.situacoes = this.situacoes.map(s => s === original ? newName : s);
    this.drivers = this.drivers.map(d => d.situacao === original ? { ...d, situacao: newName } : d);
    this.persistSituacoes();
    this.persistDrivers();
    this.cancelEditSituacao();
  }

  // Abas adicionais da Modal de Ações
  registroByDriver: Record<string, Array<{ observacao: string; createdAt: string }>> = {};
  exameByDriver: Record<string, Array<{ tipo: string; dataConsulta: string; dataVencimento: string; createdAt: string }>> = {};
  anexoByDriver: Record<string, Array<{ descricao: string; url: string; createdAt: string }>> = {};
  feriasByDriver: Record<string, Array<{ inicio: string; fim: string; observacao: string; createdAt: string }>> = {};
  diariaByDriver: Record<string, Array<{ data: string; diariaInicio: string; diariaFim: string; vencimento: string; valor: number; tipoPagamento: string; observacao: string; createdAt: string }>> = {};
  descontoByDriver: Record<string, Array<{ data: string; valor: number; motivo: string; observacao: string; createdAt: string }>> = {};

  registroForm = { observacao: '' };
  exameForm = { tipo: 'Periódico', dataConsulta: '', dataVencimento: '' };
  anexoForm = { descricao: '', url: '' };
  feriasForm = { inicio: '', fim: '', observacao: '' };
  diariaForm = { data: '', diariaInicio: '', diariaFim: '', vencimento: '', valor: 0, tipoPagamento: 'Pamcard', observacao: '' };
  descontoForm = { data: '', valor: 0, motivo: '', observacao: '' };
  tipoPagamentoOptions = ['Pamcard', 'Pix/Depósito'];

  saveRegistro(): void {
    if (!this.activeDriver) return;
    const entry = { ...this.registroForm, createdAt: new Date().toISOString() };
    const id = this.activeDriver.id;
    if (!this.registroByDriver[id]) this.registroByDriver[id] = [];
    this.registroByDriver[id].push(entry);
    this.persistRegistro();
    this.registroForm = { observacao: '' };
  }
  saveExame(): void {
    if (!this.activeDriver) return;
    const entry = { ...this.exameForm, createdAt: new Date().toISOString() };
    const id = this.activeDriver.id;
    if (!this.exameByDriver[id]) this.exameByDriver[id] = [];
    this.exameByDriver[id].push(entry);
    this.persistExame();
    this.exameForm = { tipo: 'Periódico', dataConsulta: '', dataVencimento: '' };
  }
  saveAnexo(): void {
    if (!this.activeDriver) return;
    const entry = { ...this.anexoForm, createdAt: new Date().toISOString() };
    const id = this.activeDriver.id;
    if (!this.anexoByDriver[id]) this.anexoByDriver[id] = [];
    this.anexoByDriver[id].push(entry);
    this.persistAnexo();
    this.anexoForm = { descricao: '', url: '' };
  }
  saveFerias(): void {
    if (!this.activeDriver) return;
    const entry = { ...this.feriasForm, createdAt: new Date().toISOString() };
    const id = this.activeDriver.id;
    if (!this.feriasByDriver[id]) this.feriasByDriver[id] = [];
    this.feriasByDriver[id].push(entry);
    this.persistFerias();
    this.feriasForm = { inicio: '', fim: '', observacao: '' };
  }
  saveDiaria(): void {
    if (!this.activeDriver) return;
    const entry = { ...this.diariaForm, valor: Number(this.diariaForm.valor) || 0, createdAt: new Date().toISOString() };
    const id = this.activeDriver.id;
    if (!this.diariaByDriver[id]) this.diariaByDriver[id] = [];
    this.diariaByDriver[id].push(entry);
    this.persistDiaria();
    this.diariaForm = { data: '', diariaInicio: '', diariaFim: '', vencimento: '', valor: 0, tipoPagamento: 'Pamcard', observacao: '' };
  }
  saveDesconto(): void {
    if (!this.activeDriver) return;
    const entry = { ...this.descontoForm, valor: Number(this.descontoForm.valor) || 0, createdAt: new Date().toISOString() };
    const id = this.activeDriver.id;
    if (!this.descontoByDriver[id]) this.descontoByDriver[id] = [];
    this.descontoByDriver[id].push(entry);
    this.persistDesconto();
    this.descontoForm = { data: '', valor: 0, motivo: '', observacao: '' };
  }
}