import { Component, OnInit, TemplateRef, ViewChild, AfterViewInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JustificationFieldComponent } from '../../core/justification-field.component';
import { JustificationConfig, JustificationPresets } from '../../core/justification-field.types';
import { FilterSectionComponent, FilterConfig } from '../../shared/components/filter-section/filter-section.component';
import { KpiSectionComponent, KpiConfig } from '../../shared/components/kpi-section/kpi-section.component';
import { GridSectionComponent, GridColumn, GridAction } from '../../shared/components/grid-section/grid-section.component';
import { TabModalComponent } from '../../shared/components/tab-modal/tab-modal.component';
// Removido sanitizer, mockup viewer não será mais utilizado

type DriverStatus = 'Ativo' | 'Inativo';

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
  // Campos adicionais para ficha detalhada
  apelido?: string;
  tipo?: string; // tipo de motorista
  nascimento?: string; // yyyy-mm-dd
  rg?: string;
  empregador?: string;
  admissao?: string; // yyyy-mm-dd
  cnhUf?: string;
  rntrc?: string;
  rntrcTipo?: string;
  formaPagamento?: string;
  banco?: string;
  agencia?: string;
  conta?: string;
  comissao?: number;
  pamcard?: string;
  repom?: string;
  celular?: string;
  comercial?: string;
  residencial?: string;
  endereco?: string;
  bairro?: string;
  cidadeUf?: string; // Ex: São Paulo/SP
  cep?: string;
  tipoResidencia?: string;
  resideDesde?: string;
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
  imports: [CommonModule, FormsModule, RouterModule, JustificationFieldComponent, FilterSectionComponent, KpiSectionComponent, GridSectionComponent, TabModalComponent]
})
export class GestaoMotoristasComponent implements AfterViewInit {
  Math = Math;
  // Placeholder state; will be replaced per mockup
  search = '';

  // Router é injetado no construtor principal abaixo

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
  driverStatuses: DriverStatus[] = ['Ativo', 'Inativo'];

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
  filtersCollapsed = true;
  
  // Estado dos KPIs (colapsado/expandido)
  kpisCollapsed = false;

  // Propriedades dos filtros
  filtroNome = '';
  filtroStatus = '';
  filtroCategoriaCnh = '';
  filtroSituacaoCnh = '';
  veiculoFilter = '';

  // Configuração dos filtros para componente padronizado
  filtersConfig: FilterConfig[] = [
    { type: 'text', label: 'Nome do Motorista', key: 'nome', value: this.filtroNome, placeholder: 'Digite o nome do motorista' },
    { type: 'select', label: 'Status', key: 'status', value: this.filtroStatus, options: [
      { label: 'Todos', value: '' },
      { label: 'Ativo', value: 'ativo' },
      { label: 'Inativo', value: 'inativo' }
    ] },
    { type: 'select', label: 'Categoria CNH', key: 'categoriaCnh', value: this.filtroCategoriaCnh, options: [
      { label: 'Todas', value: '' },
      { label: 'A', value: 'A' },
      { label: 'B', value: 'B' },
      { label: 'C', value: 'C' },
      { label: 'D', value: 'D' },
      { label: 'E', value: 'E' }
    ] },
    { type: 'select', label: 'Situação CNH', key: 'situacaoCnh', value: this.filtroSituacaoCnh, options: [
      { label: 'Todas', value: '' },
      { label: 'Válida', value: 'valida' },
      { label: 'Vencida', value: 'vencida' },
      { label: 'Vencendo (30 dias)', value: 'vencendo' }
    ] },
    { type: 'select', label: 'Veículo Atribuído', key: 'veiculo', value: this.veiculoFilter, options: [
      { label: 'Todos', value: '' },
      { label: 'Com veículo', value: 'com_veiculo' },
      { label: 'Sem veículo', value: 'sem_veiculo' }
    ] }
  ];

  onFiltersChange(values: any): void {
    this.filtroNome = values?.nome ?? '';
    this.filtroStatus = values?.status ?? '';
    this.filtroCategoriaCnh = values?.categoriaCnh ?? '';
    this.filtroSituacaoCnh = values?.situacaoCnh ?? '';
    this.veiculoFilter = values?.veiculo ?? '';
  }

  getMotoristasKpis(): KpiConfig[] {
    const alertIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4"/><path d="M12 17h0"/><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>`;
    const current = this.filteredDrivers;
    const total = current.length;
    const ativos = current.filter(d => d.status === 'Ativo').length;
    const inativos = current.filter(d => d.status === 'Inativo').length;
    const vencidas = current.filter(d => this.isCnhVencida(d.cnhValidade)).length;
    return [
      { label: 'Total de Motoristas', value: total, icon: 'users', color: '#2563eb' },
      { label: 'Motoristas Ativos', value: ativos, icon: 'check-circle', color: '#059669' },
      { label: 'Motoristas Inativos', value: inativos, icon: 'stop-circle', color: '#6b7280' },
      { label: 'CNH Vencidas', value: vencidas, icon: alertIcon, color: '#dc2626' }
    ];
  }
  // Propriedades dos KPIs
  motoristasAtivos = 0;
  motoristasInativos = 0;
  cnhVencidas = 0;

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
    helpText: 'Esta ação será registrada no histórico do motorista e não poderá ser desfeita.',
    showCounter: false
  };

  // Form Equipes
  newTeamName = '';
  newTeamDesc = '';

  private readonly LS_DRIVERS = 'gm_drivers_v2';
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

  constructor(private router: Router) {
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
      this.drivers = d ? (JSON.parse(d) as Driver[]) : this.defaultDrivers();
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
      // Atualiza lista de coordenadores a partir dos gestores dos motoristas
      this.coordenadores = Array.from(new Set((this.drivers || []).map(d => d.gestor).filter(Boolean)));
      // Enriquecimento: garante mocks para campos novos quando carregados do localStorage
      if (d) {
        this.drivers = this.drivers.map((drv, idx) => this.enrichDriverMock(drv, idx));
        this.persistDrivers();
      }
    } catch {
      this.drivers = this.defaultDrivers();
      this.teams = this.defaultTeams();
      // Fallback coordenadores a partir do mock default
      this.coordenadores = Array.from(new Set((this.drivers || []).map(d => d.gestor).filter(Boolean)));
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
  // Enriquecedor de mocks para motoristas com dados ausentes (migração de versões)
  private enrichDriverMock(drv: Driver, idx: number): Driver {
    const pick = (arr: string[], i: number) => arr[i % arr.length];
    const bancos = ['Itaú', 'Bradesco', 'Caixa', 'Banco do Brasil'];
    const cidades = ['São Paulo/SP', 'Campinas/SP', 'Rio de Janeiro/RJ', 'Curitiba/PR', 'Belo Horizonte/MG'];
    const tiposResid = ['Própria', 'Alugada', 'Parentes'];
    const tiposMot = ['Próprio', 'Agregado', 'Terceiro'];
    const rntrcTipos = ['TAC', 'ETC', 'CTC'];
    const formasPag = ['Conta Corrente', 'PIX', 'Cheque'];
    const ufs = ['SP', 'RJ', 'MG', 'PR'];

    const nomeParts = (drv.nome || '').split(' ');
    const simpleApelido = nomeParts.length ? `${nomeParts[0]}${nomeParts[1] ? ' ' + nomeParts[1][0] + '.' : ''}` : 'Motorista';

    return {
      ...drv,
      apelido: drv.apelido ?? simpleApelido,
      tipo: drv.tipo ?? pick(tiposMot, idx),
      nascimento: drv.nascimento ?? '1988-06-12',
      rg: drv.rg ?? `${10000000 + idx}.${(idx % 9) + 1}23.456-7`,
      empregador: drv.empregador ?? 'Transportadora Phoenix',
      admissao: drv.admissao ?? '2019-03-01',
      cnhUf: drv.cnhUf ?? pick(ufs, idx),
      rntrc: drv.rntrc ?? `${10000000 + idx}`,
      rntrcTipo: drv.rntrcTipo ?? pick(rntrcTipos, idx),
      formaPagamento: drv.formaPagamento ?? pick(formasPag, idx),
      banco: drv.banco ?? pick(bancos, idx),
      agencia: drv.agencia ?? `${1000 + (idx % 9000)}`,
      conta: drv.conta ?? `${10000 + (idx % 90000)}-${idx % 9}`,
      comissao: drv.comissao ?? (idx % 6) + 5,
      pamcard: drv.pamcard ?? (idx % 2 === 0 ? 'Ativo' : '—'),
      repom: drv.repom ?? (idx % 2 === 1 ? 'Ativo' : '—'),
      celular: drv.celular ?? '(11) 99999-1111',
      comercial: drv.comercial ?? '(11) 4000-1234',
      residencial: drv.residencial ?? '(11) 3000-9876',
      endereco: drv.endereco ?? 'Rua das Acácias, 123',
      bairro: drv.bairro ?? 'Centro',
      cidadeUf: drv.cidadeUf ?? pick(cidades, idx),
      cep: drv.cep ?? '01000-000',
      tipoResidencia: drv.tipoResidencia ?? pick(tiposResid, idx),
      resideDesde: drv.resideDesde ?? `${2016 + (idx % 7)}`
    };
  }
  private defaultDrivers(): Driver[] {
    const today = new Date();
    const nextYear = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate())
      .toISOString().slice(0, 10);
    const tnames = ['Equipe A', 'Equipe B', 'Equipe C'];
    const cats = this.categorias && this.categorias.length ? this.categorias : this.defaultCategories();
    const sits = this.situacoes && this.situacoes.length ? this.situacoes : this.defaultSituacoes();
    const bancos = ['Itaú', 'Bradesco', 'Caixa', 'Banco do Brasil'];
    const cidades = ['São Paulo/SP', 'Campinas/SP', 'Rio de Janeiro/RJ', 'Curitiba/PR', 'Belo Horizonte/MG'];
    const tiposResid = ['Própria', 'Alugada', 'Parentes'];
    const tiposMot = ['Próprio', 'Agregado', 'Terceiro'];
    const rntrcTipos = ['TAC', 'ETC', 'CTC'];
    const formasPag = ['Conta Corrente', 'PIX', 'Cheque'];
    const ufs = ['SP', 'RJ', 'MG', 'PR'];
    const base: Driver[] = [
      {
        id: this.uid('drv'), codigo: '12345678901', nome: 'João da Silva', cpf: '123.456.789-01',
        cnh: '000000001', cnhValidade: nextYear, equipe: tnames[0],
        categoria: cats[0] || 'CATEGORIA I - MOT DEDICADO', situacao: sits[0] || 'Trabalhando', gestor: 'Mario Souza',
        status: 'Ativo', bloqueado: false, feriasProgramadas: false, novo: false, telefone: '(11) 99999-1111',
        apelido: 'J. Silva', tipo: 'Próprio', nascimento: '1988-06-12', rg: '12.345.678-9', empregador: 'Transportadora Phoenix', admissao: '2019-03-01',
        cnhUf: 'SP', rntrc: '12345678', rntrcTipo: 'TAC',
        formaPagamento: 'Conta Corrente', banco: 'Itaú', agencia: '1234', conta: '12345-6', comissao: 8,
        pamcard: 'Ativo', repom: '—',
        celular: '(11) 99999-1111', comercial: '(11) 4000-1234', residencial: '(11) 3000-9876',
        endereco: 'Rua das Acácias, 123', bairro: 'Centro', cidadeUf: 'São Paulo/SP', cep: '01000-000', tipoResidencia: 'Própria', resideDesde: '2018'
      },
      {
        id: this.uid('drv'), codigo: '98765432001', nome: 'Marcos Souza', cpf: '987.654.321-01',
        cnh: '000000002', cnhValidade: nextYear, equipe: tnames[1],
        categoria: cats[1] || 'CATEGORIA II - MOT CARRETA 6 E 7 EIXOS', situacao: sits[2] || 'Afastado', gestor: 'Marcos Lima',
        status: 'Ativo', bloqueado: false, feriasProgramadas: true, novo: false,
        apelido: 'Marcão', tipo: 'Agregado', nascimento: '1990-04-22', rg: '98.765.432-1', empregador: 'Cooperativa Rodoviária', admissao: '2020-07-15',
        cnhUf: 'RJ', rntrc: '87654321', rntrcTipo: 'ETC',
        formaPagamento: 'PIX', banco: 'Bradesco', agencia: '5678', conta: '98765-4', comissao: 10,
        pamcard: '—', repom: 'Ativo',
        celular: '(21) 98888-2222', comercial: '(21) 3500-2222', residencial: '(21) 2700-2222',
        endereco: 'Av. Atlântica, 200', bairro: 'Copacabana', cidadeUf: 'Rio de Janeiro/RJ', cep: '22021-000', tipoResidencia: 'Alugada', resideDesde: '2021'
      },
      {
        id: this.uid('drv'), codigo: '11122233344', nome: 'Carlos Pereira', cpf: '111.222.333-44',
        cnh: '000000003', cnhValidade: nextYear, equipe: tnames[2],
        categoria: cats[2] || 'CATEGORIA III - MOT RODOCAVAMBA', situacao: sits[1] || 'Aguardando Programação', gestor: 'Paulo Ferreira',
        status: 'Ativo', bloqueado: true, feriasProgramadas: false, novo: true,
        apelido: 'Carlinhos', tipo: 'Terceiro', nascimento: '1985-09-30', rg: '11.122.233-3', empregador: 'Logística Alfa', admissao: '2018-11-05',
        cnhUf: 'MG', rntrc: '44556677', rntrcTipo: 'CTC',
        formaPagamento: 'Conta Corrente', banco: 'Caixa', agencia: '3344', conta: '11223-3', comissao: 7,
        pamcard: 'Ativo', repom: '—',
        celular: '(31) 97777-3333', comercial: '(31) 3400-3333', residencial: '(31) 2800-3333',
        endereco: 'Rua Minas, 77', bairro: 'Funcionários', cidadeUf: 'Belo Horizonte/MG', cep: '30130-000', tipoResidencia: 'Parentes', resideDesde: '2017'
      },
    ];

    const firstNames = ['Ana', 'Bruno', 'Camila', 'Diego', 'Eduarda', 'Felipe', 'Gabriela', 'Henrique', 'Isabela', 'João', 'Karina', 'Lucas', 'Mariana', 'Nicolas', 'Otávio', 'Patrícia', 'Rafael', 'Sofia', 'Thiago', 'Vitória'];
    const lastNames = ['Almeida', 'Barbosa', 'Cardoso', 'Dias', 'Esteves', 'Ferreira', 'Gomes', 'Hernandes', 'Ibrahim', 'Jesus', 'Klein', 'Lima', 'Mendes', 'Nascimento', 'Oliveira', 'Pereira', 'Queiroz', 'Ribeiro', 'Silva', 'Teixeira'];

    const extra: Driver[] = [];
    const totalExtra = 197; // somando com os 3 base, teremos 200
    for (let i = 0; i < totalExtra; i++) {
      const fn = firstNames[i % firstNames.length];
      const ln = lastNames[i % lastNames.length];
      const nome = `${fn} ${ln}`;
      const codigo = String(10000000000 + i + 4);
      const cpfNum = 10000000000 + i;
      const cpf = `${String(cpfNum).slice(0,3)}.${String(cpfNum).slice(3,6)}.${String(cpfNum).slice(6,9)}-${String(cpfNum).slice(9,11)}`;
      const cnh = String(100000000 + i).padStart(9, '0');
      let cnhValidade = nextYear;
      const mod = i % 10;
      if (mod === 0) {
        const past = new Date(today.getFullYear(), today.getMonth() - 2, today.getDate()).toISOString().slice(0, 10);
        cnhValidade = past;
      } else if (mod === 1 || mod === 2) {
        const soon = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate()).toISOString().slice(0, 10);
        cnhValidade = soon;
      }
      const equipe = tnames[i % tnames.length];
      const categoria = cats[i % cats.length];
      const situacao = sits[i % sits.length];
      const gestor = `${lastNames[(i + 3) % lastNames.length]} Manager`;
      const status: DriverStatus = (['Ativo', 'Inativo'] as DriverStatus[])[i % 2];
      const bloqueado = i % 4 === 0;
      const feriasProgramadas = i % 6 === 0;
      const novo = i % 5 === 0;
      const telefone = `(11) 90000-${String(1000 + i).padStart(4, '0')}`;
      const celular = telefone;
      const comercial = `(11) 4000-${String(2000 + i).padStart(4, '0')}`;
      const residencial = `(11) 3000-${String(3000 + i).padStart(4, '0')}`;
      const email = `motorista${i + 4}@exemplo.com`;
      const apelido = `${fn.substring(0,1)}. ${ln}`;
      const tipo = tiposMot[i % tiposMot.length];
      const nascimento = new Date(today.getFullYear() - (25 + (i % 20)), (i % 12), (i % 28) + 1).toISOString().slice(0, 10);
      const rg = `${String(10000000 + i)}-${i % 9}`;
      const empregador = ['Transportadora Phoenix', 'Logística Alfa', 'Cooperativa Rodoviária'][i % 3];
      const admissao = new Date(today.getFullYear() - (1 + (i % 6)), (i % 12), ((i % 28) + 1)).toISOString().slice(0, 10);
      const cnhUf = ufs[i % ufs.length];
      const rntrc = String(40000000 + i);
      const rntrcTipo = rntrcTipos[i % rntrcTipos.length];
      const formaPagamento = formasPag[i % formasPag.length];
      const banco = bancos[i % bancos.length];
      const agencia = String(1000 + (i % 9000));
      const conta = `${String(10000 + (i % 90000))}-${i % 9}`;
      const comissao = 5 + (i % 8);
      const pamcard = i % 2 === 0 ? 'Ativo' : '—';
      const repom = i % 3 === 0 ? 'Ativo' : '—';
      const endereco = `Rua ${ln}, ${100 + (i % 200)}`;
      const bairro = ['Centro', 'Jardins', 'Vila Nova', 'Boa Vista'][i % 4];
      const cidadeUf = cidades[i % cidades.length];
      const cep = `0${(1000 + (i % 8000)).toString().padStart(4,'0')}-000`;
      const tipoResidencia = tiposResid[i % tiposResid.length];
      const resideDesde = String(2015 + (i % 10));
      extra.push({
        id: this.uid('drv'), codigo, nome, cpf, cnh, cnhValidade, equipe,
        categoria, situacao, gestor, status, bloqueado, feriasProgramadas, novo, telefone, email,
        apelido, tipo, nascimento, rg, empregador, admissao,
        cnhUf, rntrc, rntrcTipo, formaPagamento, banco, agencia, conta, comissao,
        pamcard, repom, celular, comercial, residencial,
        endereco, bairro, cidadeUf, cep, tipoResidencia, resideDesde
      });
    }

    return [...base, ...extra];
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

  daysUntil(dateStr: string | undefined | null): number | null {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    const today = new Date();
    d.setHours(0,0,0,0); today.setHours(0,0,0,0);
    const diff = d.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  isExpiringWithin(dateStr: string | undefined | null, days: number): boolean {
    const d = this.daysUntil(dateStr);
    if (d === null) return false;
    return d > 0 && d <= days;
  }

  getLastRiskDate(driverId: string | undefined | null): string | null {
    if (!driverId) return null;
    const list = this.riskByDriver[driverId] || [];
    if (!list.length) return null;
    const last = [...list].sort((a, b) => {
      const ta = new Date(a.createdAt).getTime();
      const tb = new Date(b.createdAt).getTime();
      return tb - ta;
    })[0];
    return last?.createdAt || null;
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
    // Define um solicitante padrão para a aba de férias
    this.feriasForm.solicitante = d.gestor || this.coordenadores[0] || '';
  }
  closeDriverActions(): void {
    this.driverActionsOpen = false;
    this.activeDriver = null;
  }

  setActionsTab(id: string): void {
    // Ajusta a aba ativa vindos do componente de modal
    // (valida e define um fallback)
    const allowed = ['risco','registro','exame','anexo','ferias','diaria','desconto'];
    this.actionsTab = (allowed.includes(id) ? id : 'risco') as any;
  }
  saveCurrentAction(): void {
    switch (this.actionsTab) {
      case 'risco':
        this.saveRiskAnalysis();
        break;
      case 'registro':
        this.saveRegistro();
        break;
      case 'exame':
        this.saveExame();
        break;
      case 'anexo':
        this.saveAnexo();
        break;
      case 'ferias':
        this.saveFerias();
        break;
      default:
        break;
    }
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
    // Limpar também os novos filtros
    this.filtroNome = '';
    this.filtroStatus = '';
    this.filtroCategoriaCnh = '';
    this.filtroSituacaoCnh = '';
    this.veiculoFilter = '';
    this.page = 1;
  }

  filtrar(): void {
    // Implementar lógica de filtro aqui
    console.log('Aplicando filtros...');
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
  registroByDriver: Record<string, Array<{ situacao: string; inicio: string; fim: string; createdAt: string }>> = {};
  exameByDriver: Record<string, Array<{ data: string; exame: string; resultado: string; validade?: string; observacao?: string; substancias?: string[]; createdAt: string }>> = {};
  anexoByDriver: Record<string, Array<{ comentario: string; createdAt: string }>> = {};
  feriasByDriver: Record<string, Array<{ inicio: string; fim: string; solicitante?: string; observacao: string; createdAt: string }>> = {};
  diariaByDriver: Record<string, Array<{ data: string; diariaInicio: string; diariaFim: string; vencimento: string; valor: number; tipoPagamento: string; observacao: string; createdAt: string }>> = {};
  descontoByDriver: Record<string, Array<{ data: string; valor: number; motivo: string; observacao: string; createdAt: string }>> = {};

  registroForm = { situacao: this.situacoes?.[0] || '', inicio: '', fim: '' };
  exameForm = { data: '', exame: 'Toxicológico', resultado: 'Aguardando Resultado', observacao: '', validade: '', substanciasMap: { anfetamina: false, cocaina: false, opiaceos: false, maconha: false, mazindol: false } };
  anexoForm = { comentario: '' };
  feriasForm = { inicio: '', fim: '', solicitante: '', observacao: '' };
  diariaForm = { data: '', diariaInicio: '', diariaFim: '', vencimento: '', valor: 0, tipoPagamento: 'Pamcard', observacao: '' };
  descontoForm = { data: '', valor: 0, motivo: '', observacao: '' };
  tipoPagamentoOptions = ['Pamcard', 'Pix/Depósito'];

  // Configuração do campo de comentários restritos (visual igual ao de Bloqueio)
  anexoRestritoConfig: JustificationConfig = {
    ...JustificationPresets.userBlock,
    label: 'Comentários Restritos',
    required: false,
    showCounter: false,
    helpText: 'Use para registrar comentários internos e anexos confidenciais.'
  };

  // Configuração do campo de observações (visual igual ao de Bloqueio)
  feriasJustConfig: JustificationConfig = {
    ...JustificationPresets.userBlock,
    label: 'Observações',
    required: false,
    showCounter: false,
    helpText: 'Observações sobre a intenção de férias.'
  };

  // Lista de coordenadores (solicitantes) coletada dos gestores cadastrados
  coordenadores: string[] = [];

  saveRegistro(): void {
    if (!this.activeDriver) return;
    const entry = { ...this.registroForm, createdAt: new Date().toISOString() };
    const id = this.activeDriver.id;
    if (!this.registroByDriver[id]) this.registroByDriver[id] = [];
    this.registroByDriver[id].push(entry);
    this.persistRegistro();
    this.registroForm = { situacao: this.situacoes?.[0] || '', inicio: '', fim: '' };
  }
  saveExame(): void {
    if (!this.activeDriver) return;
    const { substanciasMap, ...rest } = this.exameForm as any;
    const substancias = Object.entries(substanciasMap)
      .filter(([_, v]) => !!v)
      .map(([k]) => {
        switch (k) {
          case 'anfetamina': return 'Anfetamina';
          case 'cocaina': return 'Cocaína';
          case 'opiaceos': return 'Opiáceos';
          case 'maconha': return 'Maconha';
          case 'mazindol': return 'Mazindol';
          default: return k;
        }
      });
    const entry = { ...rest, substancias, createdAt: new Date().toISOString() };
    const id = this.activeDriver.id;
    if (!this.exameByDriver[id]) this.exameByDriver[id] = [];
    this.exameByDriver[id].push(entry);
    this.persistExame();
    this.exameForm = { data: '', exame: 'Toxicológico', resultado: 'Aguardando Resultado', observacao: '', validade: '', substanciasMap: { anfetamina: false, cocaina: false, opiaceos: false, maconha: false, mazindol: false } };
  }
  saveAnexo(): void {
    if (!this.activeDriver) return;
    const entry = { ...this.anexoForm, createdAt: new Date().toISOString() };
    const id = this.activeDriver.id;
    if (!this.anexoByDriver[id]) this.anexoByDriver[id] = [];
    this.anexoByDriver[id].push(entry);
    this.persistAnexo();
    this.anexoForm = { comentario: '' };
  }
  saveFerias(): void {
    if (!this.activeDriver) return;
    const entry = { ...this.feriasForm, createdAt: new Date().toISOString() };
    const id = this.activeDriver.id;
    if (!this.feriasByDriver[id]) this.feriasByDriver[id] = [];
    this.feriasByDriver[id].push(entry);
    this.persistFerias();
    this.feriasForm = { inicio: '', fim: '', solicitante: this.activeDriver?.gestor || this.coordenadores[0] || '', observacao: '' };
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

  // Funções para a tabela de motoristas
  sort(key: 'codigo' | 'nome' | 'cpf' | 'cnh' | 'cnhValidade' | 'equipe' | 'status' | 'categoria' | 'situacao' | 'gestor'): void {
    if (this.sortKey === key) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = key;
      this.sortDir = 'asc';
    }
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
  }

  editDriver(driver: Driver): void {
    this.router.navigate(['/gestao-motoristas/novo'], { state: { driverToEdit: driver } });
  }
  gridCollapsed = false;
  gridColumns: GridColumn[] = [];

  @ViewChild('nomeTpl') nomeTpl!: TemplateRef<any>;
  @ViewChild('statusTpl') statusTpl!: TemplateRef<any>;
  @ViewChild('bloqueioTpl') bloqueioTpl!: TemplateRef<any>;
  @ViewChild('categoriaTpl') categoriaTpl!: TemplateRef<any>;
  gridActions: GridAction[] = [
    {
      action: 'actions',
      label: 'Lançamentos',
      icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="14" rx="2"/><path d="M7 7h10"/><path d="M7 11h10"/></svg>'
    },
    {
      action: 'edit',
      label: 'Editar',
      icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>'
    }
  ];

  onGridAction(evt: { action: string; row: any }): void {
    const d = evt.row as any;
    switch (evt.action) {
      case 'actions':
        this.openDriverActions(d);
        break;
      case 'edit':
        this.editDriver(d);
        break;
    }
  }

  onGridSort(e: { key: string; dir: 'asc' | 'desc' }): void {
    this.sortKey = e.key as any;
    this.sortDir = e.dir;
  }

  // Ficha do Motorista (visualização)
  profileOpen = false;
  profileDriver: Driver | null = null;
  openProfile(d: Driver): void { this.profileDriver = d; this.profileOpen = true; }
  closeProfile(): void { this.profileOpen = false; this.profileDriver = null; }

  getShortCategory(cat: string): string {
    if (!cat) return '';
    const left = cat.split('-')[0].trim();
    return left || cat;
  }

  ngAfterViewInit(): void {
    // Configuração das colunas do grid com templates de Status e Bloqueio
    this.gridColumns = [
      { key: 'nome', label: 'Nome', sortable: true, align: 'left', width: 'calc((100% - 140px)/7)', template: this.nomeTpl },
      { key: 'cpf', label: 'CPF', sortable: true, align: 'center', width: 'calc((100% - 140px)/7)' },
      { key: 'categoria', label: 'Categoria', sortable: true, align: 'left', width: 'calc((100% - 140px)/7)', template: this.categoriaTpl },
      { key: 'situacao', label: 'Situação', sortable: true, align: 'left', width: 'calc((100% - 140px)/7)' },
      { key: 'gestor', label: 'Gestor', sortable: true, align: 'left', width: 'calc((100% - 140px)/7)' },
      { key: 'status', label: 'Status', sortable: true, align: 'center', width: 'calc((100% - 140px)/7)', template: this.statusTpl },
      { key: 'bloqueado', label: 'Bloqueio', sortable: true, align: 'center', width: 'calc((100% - 140px)/7)', template: this.bloqueioTpl }
    ];
  }
}