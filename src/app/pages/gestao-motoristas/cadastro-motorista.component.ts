import { Component, TemplateRef, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TabConfig } from '../../shared/components/tab-modal/tab-modal.component';
import { JustificationFieldComponent } from '../../core/justification-field.component';
import { JustificationConfig, JustificationPresets } from '../../core/justification-field.types';

@Component({
  selector: 'app-cadastro-motorista',
  templateUrl: './cadastro-motorista.component.html',
  styleUrls: ['./cadastro-motorista.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, JustificationFieldComponent]
})
export class CadastroMotoristaComponent implements OnInit {
  // Dados Principais
  codigo = '';
  tipoMotorista: 'FROTA' | 'TERCEIRO' = 'FROTA';
  nome = '';
  apelido = '';
  cpf = '';
  saving = false;
  dataAdmissao = '';
  rg = '';
  rgOrgao = '';
  rgEmissao = '';
  nascimento = '';
  sexo: 'MASCULINO' | 'FEMININO' | '' = '';
  nacionalidade = '';
  naturalidade = '';
  empregador = '';
  observacoes = '';
  observacoesConfig: JustificationConfig = {
    ...JustificationPresets.documentApproval,
    label: 'Observações',
    placeholder: 'Digite observações relevantes...'
  };

  // Habilitação
  cnh = '';
  cnhValidade = '';
  cnhCategoria = '';
  cnhEmissaoUf = '';
  cnhDataEmissao = '';
  cnhDataVencimento = '';
  cnhPrimeiraHabilitacao = '';
  equiparadoTac: 'SIM' | 'NÃO' | '' = '';
  rntrc = '';
  tipoRntrc = '';
  dataGerenciamentoRisco = '';

  // Contato
  telefone = '';
  telefoneComercial = '';
  contatoComercial = '';
  telefoneResidencial = '';
  contatoResidencial = '';
  celular = '';
  email = '';

  // Financeiro
  banco = '';
  agencia = '';
  conta = '';
  formaPagamentoFrete: 'CARTÃO' | 'CONTA' | 'DEPÓSITO' | 'OUTROS' | '' = '';
  cartaoPamcard = '';
  pamcardVencimento = '';
  tipoConta: 'Corrente' | 'Poupança' | '' = '';
  numeroFinanceiro = '';
  pisPasep = '';
  percentualComissao = '';
  codigoExportacao = '';
  pixTipo: 'CPF' | 'CNPJ' | 'E-mail' | 'Telefone' | 'Aleatória' | '' = '';
  pixChave = '';

  // Endereço
  pais = '';
  cep = '';
  estado = '';
  cidade = '';
  bairro = '';
  logradouro = '';
  numero = '';
  complemento = '';
  referencia = '';
  tipoResidencia = '';
  resideDesde = '';

  // Complementares
  status: 'Ativo' | 'Inativo' = 'Ativo';
  bloqueado = false;
  feriasProgramadas = false;

  // Dados Complementares
  paiNome = '';
  maeNome = '';
  grupoSanguineo = '';
  planoSaude = '';
  codigoApisulMob = '';
  indicacao = '';

  // Abas
  @ViewChild('tplDadosPrincipais', { static: true }) tplDadosPrincipais!: TemplateRef<any>;
  @ViewChild('tplHabilitacao', { static: true }) tplHabilitacao!: TemplateRef<any>;
  @ViewChild('tplFinanceiro', { static: true }) tplFinanceiro!: TemplateRef<any>;
  @ViewChild('tplContato', { static: true }) tplContato!: TemplateRef<any>;
  @ViewChild('tplEndereco', { static: true }) tplEndereco!: TemplateRef<any>;
  @ViewChild('tplComplementares', { static: true }) tplComplementares!: TemplateRef<any>;
  tabs: TabConfig[] = [];
  activeTabId = 'DadosPrincipais';

  private readonly LS_DRIVERS = 'gm_drivers_v2';
  private readonly LS_CATEGORIES = 'gm_categories_v1';
  private readonly LS_SITUACOES = 'gm_situacoes_v1';
  // Estado de edição
  isEdit = false;
  editingDriverId: string | null = null;

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Popular estrutura de abas na inicialização
    this.tabs = [
      { id: 'DadosPrincipais', label: 'Dados Principais', template: this.tplDadosPrincipais },
      { id: 'Habilitação', label: 'Habilitação', template: this.tplHabilitacao },
      { id: 'Financeiro', label: 'Financeiro', template: this.tplFinanceiro },
      { id: 'Contato', label: 'Contato', template: this.tplContato },
      { id: 'Endereço', label: 'Endereço', template: this.tplEndereco },
      { id: 'Dados Complementares', label: 'Dados Complementares', template: this.tplComplementares }
    ];

    const raw = localStorage.getItem(this.LS_DRIVERS);
    const drivers: any[] = raw ? JSON.parse(raw) : [];
    // Se vier estado de navegação para edição, pré-preenche o formulário
    const nav = this.router.getCurrentNavigation();
    const driverToEdit = nav?.extras?.state?.['driverToEdit'] as any | undefined;
    if (driverToEdit) {
      this.isEdit = true;
      this.editingDriverId = driverToEdit.id;
      this.patchFromDriver(driverToEdit);
    } else {
      // Caso contrário, sugerir próximo código
      this.codigo = this.nextCodigo(drivers);
    }
  }

  get currentTab(): TabConfig | undefined {
    const id = this.activeTabId || this.tabs[0]?.id;
    return this.tabs.find(t => t.id === id);
  }

  setActiveTab(id: string): void {
    this.activeTabId = id;
  }

  private uid(prefix: string): string {
    return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
  }

  private nextCodigo(existing: any[]): string {
    const base = 10000000000; // 11 dígitos
    const inc = (existing?.length || 0) + 1;
    return String(base + inc);
  }

  private patchFromDriver(d: any): void {
    this.codigo = d.codigo || '';
    this.tipoMotorista = d.tipoMotorista || this.tipoMotorista;
    this.nome = d.nome || '';
    this.apelido = d.apelido || '';
    this.cpf = d.cpf || '';
    this.dataAdmissao = d.dataAdmissao || '';
    this.rg = d.rg || '';
    this.rgOrgao = d.rgOrgao || '';
    this.rgEmissao = d.rgEmissao || '';
    this.nascimento = d.nascimento || '';
    this.sexo = d.sexo || '';
    this.nacionalidade = d.nacionalidade || '';
    this.naturalidade = d.naturalidade || '';
    this.empregador = d.empregador || '';
    this.observacoes = d.observacoes || '';
    this.cnh = d.cnh || '';
    this.cnhValidade = d.cnhValidade || '';
    this.cnhCategoria = d.cnhCategoria || '';
    this.cnhEmissaoUf = d.cnhEmissaoUf || '';
    this.cnhDataEmissao = d.cnhDataEmissao || '';
    this.cnhDataVencimento = d.cnhDataVencimento || '';
    this.cnhPrimeiraHabilitacao = d.cnhPrimeiraHabilitacao || '';
    this.equiparadoTac = d.equiparadoTac || '';
    this.rntrc = d.rntrc || '';
    this.tipoRntrc = d.tipoRntrc || '';
    this.dataGerenciamentoRisco = d.dataGerenciamentoRisco || '';
    // Contatos
    this.telefoneComercial = d.telefoneComercial || '';
    this.contatoComercial = d.contatoComercial || '';
    this.telefoneResidencial = d.telefoneResidencial || '';
    this.contatoResidencial = d.contatoResidencial || '';
    this.celular = d.celular || d.telefone || '';
    this.email = d.email || '';
    // Financeiro
    this.banco = d.banco || '';
    this.agencia = d.agencia || '';
    this.conta = d.conta || '';
    this.formaPagamentoFrete = d.formaPagamentoFrete || '';
    this.cartaoPamcard = d.cartaoPamcard || '';
    this.pamcardVencimento = d.pamcardVencimento || '';
    this.tipoConta = d.tipoConta || '';
    this.numeroFinanceiro = d.numeroFinanceiro || '';
    this.pisPasep = d.pisPasep || '';
    this.percentualComissao = d.percentualComissao || '';
    this.codigoExportacao = d.codigoExportacao || '';
    this.pixTipo = d.pixTipo || '';
    this.pixChave = d.pixChave || '';
    // Endereço
    const end = d.endereco || {};
    this.pais = end.pais || '';
    this.cep = end.cep || '';
    this.estado = end.estado || '';
    this.cidade = end.cidade || '';
    this.bairro = end.bairro || '';
    this.logradouro = end.logradouro || '';
    this.numero = end.numero || '';
    this.complemento = end.complemento || '';
    this.referencia = end.referencia || '';
    this.tipoResidencia = end.tipoResidencia || '';
    this.resideDesde = end.resideDesde || '';
    // Complementares
    this.status = d.status || this.status;
    this.bloqueado = !!d.bloqueado;
    this.feriasProgramadas = !!d.feriasProgramadas;
    this.paiNome = d.paiNome || '';
    this.maeNome = d.maeNome || '';
    this.grupoSanguineo = d.grupoSanguineo || '';
    this.planoSaude = d.planoSaude || '';
    this.codigoApisulMob = d.codigoApisulMob || '';
    this.indicacao = d.indicacao || '';
  }

  async save(): Promise<void> {
    const nome = this.nome.trim();
    const cpf = this.cpf.trim();
    if (!nome || !cpf) return;
    this.saving = true;
    try {
      const raw = localStorage.getItem(this.LS_DRIVERS);
      const drivers: any[] = raw ? JSON.parse(raw) : [];

      const catsRaw = localStorage.getItem(this.LS_CATEGORIES);
      const sitsRaw = localStorage.getItem(this.LS_SITUACOES);
      const categoriaPadrao = Array.isArray(catsRaw ? JSON.parse(catsRaw) : []) && (JSON.parse(catsRaw!) as string[])[0] || 'CATEGORIA I - MOT DEDICADO';
      const situacaoPadrao = Array.isArray(sitsRaw ? JSON.parse(sitsRaw) : []) && (JSON.parse(sitsRaw!) as string[])[0] || 'Trabalhando';

      const driverData = {
        id: this.isEdit && this.editingDriverId ? this.editingDriverId : this.uid('drv'),
        codigo: (this.codigo?.trim() || this.nextCodigo(drivers)),
        tipoMotorista: this.tipoMotorista,
        nome,
        apelido: this.apelido,
        cpf,
        dataAdmissao: this.dataAdmissao,
        rg: this.rg,
        rgOrgao: this.rgOrgao,
        rgEmissao: this.rgEmissao,
        nascimento: this.nascimento,
        sexo: this.sexo,
        nacionalidade: this.nacionalidade,
        naturalidade: this.naturalidade,
        empregador: this.empregador,
        observacoes: this.observacoes,
        cnh: this.cnh,
        cnhValidade: this.cnhValidade,
        cnhCategoria: this.cnhCategoria,
        cnhEmissaoUf: this.cnhEmissaoUf,
        cnhDataEmissao: this.cnhDataEmissao,
        cnhDataVencimento: this.cnhDataVencimento,
        cnhPrimeiraHabilitacao: this.cnhPrimeiraHabilitacao,
        equiparadoTac: this.equiparadoTac,
        rntrc: this.rntrc,
        tipoRntrc: this.tipoRntrc,
        dataGerenciamentoRisco: this.dataGerenciamentoRisco,
        equipe: 'Equipe A',
        categoria: categoriaPadrao,
        situacao: situacaoPadrao,
        gestor: '',
        status: this.status,
        bloqueado: this.bloqueado,
        feriasProgramadas: this.feriasProgramadas,
        novo: true,
        // Contato
        telefoneComercial: this.telefoneComercial,
        contatoComercial: this.contatoComercial,
        telefoneResidencial: this.telefoneResidencial,
        contatoResidencial: this.contatoResidencial,
        celular: this.celular,
        email: this.email,
        // Compatibilidade com listas antigas
        telefone: this.celular || this.telefone,
        // Financeiro
        banco: this.banco,
        agencia: this.agencia,
        conta: this.conta,
        formaPagamentoFrete: this.formaPagamentoFrete,
        cartaoPamcard: this.cartaoPamcard,
        pamcardVencimento: this.pamcardVencimento,
        tipoConta: this.tipoConta,
        numeroFinanceiro: this.numeroFinanceiro,
        pisPasep: this.pisPasep,
        percentualComissao: this.percentualComissao,
        codigoExportacao: this.codigoExportacao,
        pixTipo: this.pixTipo,
        pixChave: this.pixChave,
        // Endereço
        endereco: {
          pais: this.pais,
          cep: this.cep,
          estado: this.estado,
          cidade: this.cidade,
          bairro: this.bairro,
          logradouro: this.logradouro,
          numero: this.numero,
          complemento: this.complemento,
          referencia: this.referencia,
          tipoResidencia: this.tipoResidencia,
          resideDesde: this.resideDesde
        },
        // Dados Complementares
        paiNome: this.paiNome,
        maeNome: this.maeNome,
        grupoSanguineo: this.grupoSanguineo,
        planoSaude: this.planoSaude,
        codigoApisulMob: this.codigoApisulMob,
        indicacao: this.indicacao,
      };

      if (this.isEdit && this.editingDriverId) {
        const idx = drivers.findIndex(d => d.id === this.editingDriverId);
        if (idx >= 0) {
          drivers[idx] = { ...drivers[idx], ...driverData, novo: false };
        } else {
          drivers.push({ ...driverData, novo: false });
        }
      } else {
        drivers.push({ ...driverData, novo: true });
      }
      localStorage.setItem(this.LS_DRIVERS, JSON.stringify(drivers));
      await this.router.navigate(['/gestao-motoristas']);
    } finally {
      this.saving = false;
    }
  }

  cancelar(): void {
    this.router.navigate(['/gestao-motoristas']);
  }
}