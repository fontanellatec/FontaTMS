import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface FreteTerceiroRegistro {
  contratanteNome: string;
  contratanteCnpj: string;
  contratoNumero?: string;
  cteNumero?: string;
  origemUf: string;
  origemCidade: string;
  destinoUf: string;
  destinoCidade: string;
  tipoCarga?: string;
  pesoKg: number;
  dataColeta?: string; // yyyy-MM-dd
  dataEntrega?: string; // yyyy-MM-dd
  valorFrete: number;
  pedagios?: number;
  taxas?: number;
  adiantamentos?: number;
  veiculoPlaca?: string;
  motorista?: string;
  observacoes?: string;
  status?: 'Rascunho' | 'Efetivado' | 'Cancelado';
  dataPostagem?: string;
  dataRecebimento?: string;
  descontos?: { motivo: string; valor: number; data: string }[];
  ocorrencias?: { data: string; tipo?: string; descricao: string }[];
  anexos?: { nome: string; conteudo: string; tamanho: number }[];
}

@Component({
  selector: 'app-frete-terceiro',
  templateUrl: './frete-terceiro.component.html',
  styleUrls: ['./frete-terceiro.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class FreteTerceiroComponent implements OnInit {
  private storageKey = 'fretesTerceiros';

  ufs = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];
  tiposCarga = ['Geral', 'Frigorificada', 'Perigosa', 'Granel', 'Container'];

  registros: FreteTerceiroRegistro[] = [];
  novoAberto = false;

  filtroStatus: 'Todos' | 'Rascunho' | 'Efetivado' | 'Cancelado' = 'Todos';
  filtroBusca = '';
  filtroPostagemDe = '';
  filtroPostagemAte = '';
  expandedIndex: number | null = null;
  novoDesconto: { motivo: string; valor: number; data: string }[] = [];
  novaOcorrencia: { tipo?: string; data: string; descricao: string }[] = [];
  editDatas: { dataPostagem?: string; dataEntrega?: string; dataRecebimento?: string }[] = [];
  // Buffers e flags de edição/validação
  editDatasEdit: { dataPostagem?: string; dataEntrega?: string; dataRecebimento?: string } = {};
  cnpjInvalido: boolean = false;
  placaInvalida: boolean = false;
  datasInvalidas: boolean = false;

  // Estado do modal de edição
  editModalIndex: number | null = null;
  editModalTab: 'datas' | 'descontos' | 'anexos' | 'ocorrencias' = 'datas';
  modalRegistro: FreteTerceiroRegistro | null = null;

  form: Partial<FreteTerceiroRegistro> = {
    contratanteNome: '',
    contratanteCnpj: '',
    contratoNumero: '',
    cteNumero: '',
    origemUf: '',
    origemCidade: '',
    destinoUf: '',
    destinoCidade: '',
    tipoCarga: '',
    pesoKg: undefined,
    dataColeta: '',
    dataEntrega: '',
    valorFrete: undefined,
    pedagios: 0,
    taxas: 0,
    adiantamentos: 0,
    veiculoPlaca: '',
    motorista: '',
    observacoes: ''
  };

  // Foco em campos ao abrir modal de edição
  private focusCampoEdicao(tab: 'datas' | 'descontos' | 'anexos' | 'ocorrencias', campo?: 'postagem' | 'entrega' | 'recebimento') {
    setTimeout(() => {
      let id = '';
      if (tab === 'descontos') id = 'edit-desconto-motivo';
      else if (tab === 'anexos') id = 'edit-anexo-input';
      else if (tab === 'ocorrencias') id = 'edit-ocorrencia-descricao';
      else if (tab === 'datas') {
        if (campo === 'postagem') id = 'edit-data-postagem';
        else if (campo === 'entrega') id = 'edit-data-entrega';
        else id = 'edit-data-recebimento';
      }
      const el = document.getElementById(id) as (HTMLInputElement | HTMLTextAreaElement | null);
      el?.focus();
    }, 0);
  }

  ngOnInit(): void {
    this.registros = this.getRegistros();
  }

  salvar(): void {
    // Máscaras/validações prévias
    this.validarCnpj();
    this.validarPlaca();
    this.validarDatasFormulario();

    const erros: string[] = [];
    if (!this.form.contratanteNome) erros.push('Informe o nome da transportadora contratante.');
    if (!this.form.contratanteCnpj) erros.push('Informe o CNPJ da contratante.');
    if (this.cnpjInvalido) erros.push('CNPJ inválido.');
    if (!this.form.origemUf || !this.form.origemCidade) erros.push('Origem: informe UF e Cidade.');
    if (!this.form.destinoUf || !this.form.destinoCidade) erros.push('Destino: informe UF e Cidade.');
    if (!this.form.pesoKg || (this.form.pesoKg ?? 0) <= 0) erros.push('Peso (kg): informe um valor maior que 0.');
    if (!this.form.valorFrete || (this.form.valorFrete ?? 0) <= 0) erros.push('Valor do frete: informe um valor maior que 0.');
    if (this.datasInvalidas) erros.push('Datas inválidas: Coleta deve ser anterior ou igual à Entrega.');

    if (erros.length) {
      alert('Corrija os seguintes campos:\n- ' + erros.join('\n- '));
      return;
    }

    const novo: FreteTerceiroRegistro = {
      contratanteNome: this.form.contratanteNome!,
      contratanteCnpj: this.form.contratanteCnpj!,
      contratoNumero: this.form.contratoNumero || '',
      cteNumero: this.form.cteNumero || '',
      origemUf: this.form.origemUf!,
      origemCidade: this.form.origemCidade!,
      destinoUf: this.form.destinoUf!,
      destinoCidade: this.form.destinoCidade!,
      tipoCarga: this.form.tipoCarga || '',
      pesoKg: this.form.pesoKg!,
      dataColeta: this.form.dataColeta || '',
      dataEntrega: this.form.dataEntrega || '',
      valorFrete: this.form.valorFrete!,
      pedagios: this.form.pedagios || 0,
      taxas: this.form.taxas || 0,
      adiantamentos: this.form.adiantamentos || 0,
      veiculoPlaca: this.form.veiculoPlaca || '',
      motorista: this.form.motorista || '',
      observacoes: this.form.observacoes || '',
      status: 'Rascunho',
      dataPostagem: '',
      dataRecebimento: '',
      descontos: [],
      anexos: [],
      ocorrencias: []
    };

    const atual = this.getRegistros();
    atual.unshift(novo);
    localStorage.setItem(this.storageKey, JSON.stringify(atual));
    this.registros = atual;
    alert('Frete de terceiro registrado com sucesso.');
    this.novoAberto = false;
    this.limpar(false);
  }

  limpar(confirmar = true): void {
    if (confirmar && !confirm('Deseja limpar o formulário?')) return;
    this.form = {
      contratanteNome: '',
      contratanteCnpj: '',
      contratoNumero: '',
      cteNumero: '',
      origemUf: '',
      origemCidade: '',
      destinoUf: '',
      destinoCidade: '',
      tipoCarga: '',
      pesoKg: undefined,
      dataColeta: '',
      dataEntrega: '',
      valorFrete: undefined,
      pedagios: 0,
      taxas: 0,
      adiantamentos: 0,
      veiculoPlaca: '',
      motorista: '',
      observacoes: ''
    };
  }

  excluirRecord(r: FreteTerceiroRegistro): void {
    if (!confirm('Confirma a exclusão deste registro?')) return;
    const atual = this.getRegistros();
    const idx = atual.indexOf(r);
    if (idx >= 0) {
      atual.splice(idx, 1);
      localStorage.setItem(this.storageKey, JSON.stringify(atual));
      this.registros = atual;
    }
  }

  getRegistros(): FreteTerceiroRegistro[] {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw) as FreteTerceiroRegistro[] : [];
    } catch { return []; }
  }

  formatCurrencyBRL(n?: number): string {
    if (n === undefined || n === null) return '—';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
  }

  getFiltrados(): FreteTerceiroRegistro[] {
    const busca = (this.filtroBusca || '').toLowerCase();
    const de = this.filtroPostagemDe ? new Date(this.filtroPostagemDe) : null;
    const ate = this.filtroPostagemAte ? new Date(this.filtroPostagemAte) : null;
    return (this.registros || []).filter(r => {
      if (this.filtroStatus !== 'Todos' && (r.status || 'Rascunho') !== this.filtroStatus) return false;
      if (busca) {
        const texto = [
          r.cteNumero, r.contratanteNome, r.veiculoPlaca,
          r.origemCidade, r.destinoCidade, r.origemUf, r.destinoUf
        ].filter(Boolean).join(' ').toLowerCase();
        if (!texto.includes(busca)) return false;
      }
      if (de || ate) {
        const dp = r.dataPostagem ? new Date(r.dataPostagem) : null;
        if (de && (!dp || dp < de)) return false;
        if (ate && (!dp || dp > ate)) return false;
      }
      return true;
    });
  }

  limparFiltros(): void {
    this.filtroStatus = 'Todos';
    this.filtroBusca = '';
    this.filtroPostagemDe = '';
    this.filtroPostagemAte = '';
  }

  abrirEdicao(i: number): void {
    this.expandedIndex = this.expandedIndex === i ? null : i;
    if (this.expandedIndex !== null) {
      const r = this.getFiltrados()[i];
      this.editDatas[i] = { dataPostagem: r.dataPostagem || '', dataEntrega: r.dataEntrega || '', dataRecebimento: r.dataRecebimento || '' };
      if (!this.novoDesconto[i]) this.novoDesconto[i] = { motivo: '', valor: 0, data: this.todayStr() };
      if (!this.novaOcorrencia[i]) this.novaOcorrencia[i] = { tipo: '', data: this.todayStr(), descricao: '' };
    }
  }

  abrirEdicaoModal(r: FreteTerceiroRegistro, i: number, tab: 'datas' | 'descontos' | 'anexos' | 'ocorrencias' = 'datas'): void {
    this.editModalIndex = i;
    this.editModalTab = tab;
    this.modalRegistro = r;
    this.editDatas[i] = { dataPostagem: r.dataPostagem || '', dataEntrega: r.dataEntrega || '', dataRecebimento: r.dataRecebimento || '' };
    this.editDatasEdit = { dataPostagem: r.dataPostagem || '', dataEntrega: r.dataEntrega || '', dataRecebimento: r.dataRecebimento || '' };
    if (!this.novoDesconto[i]) this.novoDesconto[i] = { motivo: '', valor: 0, data: this.todayStr() };
    if (!this.novaOcorrencia[i]) this.novaOcorrencia[i] = { tipo: '', data: this.todayStr(), descricao: '' };
    this.focusCampoEdicao(tab);
  }

  abrirModalDataEspecifica(r: FreteTerceiroRegistro, i: number, tipo: 'postagem' | 'entrega' | 'recebimento'): void {
    this.abrirEdicaoModal(r, i, 'datas');
    this.focusCampoEdicao('datas', tipo);
  }

  fecharEdicaoModal(): void {
    this.editModalIndex = null;
    this.modalRegistro = null;
  }

  cancelarRecord(r: FreteTerceiroRegistro): void {
    const idx = this.registros.indexOf(r);
    if (idx < 0) return;
    const rr = this.registros[idx];
    rr.status = 'Cancelado';
    this.saveRegistros();
  }

  efetivarRecord(r: FreteTerceiroRegistro): void {
    const idx = this.registros.indexOf(r);
    if (idx < 0) return;
    const rr = this.registros[idx];
    if ((rr.status || 'Rascunho') === 'Cancelado') {
      alert('Não é possível efetivar um frete já cancelado.');
      return;
    }
    rr.status = 'Efetivado';
    if (!rr.dataPostagem) rr.dataPostagem = this.todayStr();
    this.saveRegistros();
  }

  // Máscaras e validações
  onCnpjInput(): void {
    const digits = (this.form.contratanteCnpj || '').replace(/\D/g, '').slice(0, 14);
    let out = '';
    for (let i = 0; i < digits.length; i++) {
      out += digits[i];
      if (i === 1) out += '.';
      if (i === 4) out += '.';
      if (i === 7) out += '/';
      if (i === 11) out += '-';
    }
    this.form.contratanteCnpj = out;
  }

  validarCnpj(): void {
    const digits = (this.form.contratanteCnpj || '').replace(/\D/g, '');
    this.cnpjInvalido = digits.length > 0 && digits.length !== 14;
  }

  onPlacaInput(): void {
    const raw = (this.form.veiculoPlaca || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    this.form.veiculoPlaca = raw.slice(0, 7);
  }

  validarPlaca(): void {
    const v = (this.form.veiculoPlaca || '').toUpperCase();
    const antigo = /^[A-Z]{3}[0-9]{4}$/; // padrão antigo
    const mercosul = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/; // padrão mercosul
    this.placaInvalida = v.length > 0 && !(antigo.test(v) || mercosul.test(v));
  }

  validarDatasFormulario(): void {
    const c = this.form.dataColeta || '';
    const e = this.form.dataEntrega || '';
    this.datasInvalidas = !!(c && e && c > e);
  }

  statusClass(s: string): string {
    const k = (s || 'Rascunho');
    if (k === 'Efetivado') return 'status-badge status-efetivado';
    if (k === 'Cancelado') return 'status-badge status-cancelado';
    return 'status-badge status-rascunho';
  }

  setDataHojeRecord(r: FreteTerceiroRegistro, tipo: 'postagem' | 'entrega' | 'recebimento'): void {
    const idx = this.registros.indexOf(r);
    if (idx < 0) return;
    const rr = this.registros[idx];
    const hoje = this.todayStr();
    if (tipo === 'postagem') rr.dataPostagem = hoje;
    else if (tipo === 'entrega') rr.dataEntrega = hoje;
    else rr.dataRecebimento = hoje;
    this.saveRegistros();
  }

  adicionarOcorrenciaRecord(r: FreteTerceiroRegistro, i: number, descricao: string, tipo?: string, data?: string): void {
    const idx = this.registros.indexOf(r);
    if (idx < 0) return;
    const rr = this.registros[idx];
    const d = (descricao || '').trim();
    if (!d) { alert('Informe a descrição da ocorrência.'); return; }
    if (!rr.ocorrencias) rr.ocorrencias = [];
    rr.ocorrencias.push({ descricao: d, tipo: (tipo || '').trim() || undefined, data: data || this.todayStr() });
    this.saveRegistros();
    this.novaOcorrencia[i] = { tipo: '', data: this.todayStr(), descricao: '' };
  }

  removerOcorrenciaRecord(r: FreteTerceiroRegistro, j: number): void {
    const idx = this.registros.indexOf(r);
    if (idx < 0) return;
    const rr = this.registros[idx];
    if (!rr.ocorrencias) return;
    rr.ocorrencias.splice(j, 1);
    this.saveRegistros();
  }

  popularTabelaDemo(): void {
    const exemplos: FreteTerceiroRegistro[] = [
      {
        contratanteNome: 'TransLog BR', contratanteCnpj: '12.345.678/0001-00', contratoNumero: 'C-001', cteNumero: '35-000123456',
        origemUf: 'SP', origemCidade: 'São Paulo', destinoUf: 'RJ', destinoCidade: 'Rio de Janeiro', tipoCarga: 'Geral', pesoKg: 1500,
        dataColeta: this.todayStr(), dataEntrega: '', valorFrete: 3500, pedagios: 150, taxas: 50, adiantamentos: 500,
        veiculoPlaca: 'ABC1D23', motorista: 'João Silva', observacoes: 'Urgente', status: 'Rascunho',
        dataPostagem: '', dataRecebimento: '', descontos: [], anexos: [], ocorrencias: []
      },
      {
        contratanteNome: 'RápidoSul', contratanteCnpj: '98.765.432/0001-99', contratoNumero: 'C-002', cteNumero: '35-000654321',
        origemUf: 'PR', origemCidade: 'Curitiba', destinoUf: 'SC', destinoCidade: 'Florianópolis', tipoCarga: 'Frigorificada', pesoKg: 2200,
        dataColeta: this.todayStr(), dataEntrega: this.todayStr(), valorFrete: 5400, pedagios: 200, taxas: 100, adiantamentos: 0,
        veiculoPlaca: 'EFG2H45', motorista: 'Maria Souza', observacoes: '', status: 'Efetivado',
        dataPostagem: this.todayStr(), dataRecebimento: '', descontos: [{motivo:'Avaria leve', valor: 150, data: this.todayStr()}], anexos: [], ocorrencias: []
      },
      {
        contratanteNome: 'NorteCargo', contratanteCnpj: '11.222.333/0001-55', contratoNumero: 'C-003', cteNumero: '35-000777888',
        origemUf: 'MG', origemCidade: 'Belo Horizonte', destinoUf: 'BA', destinoCidade: 'Salvador', tipoCarga: 'Perigosa', pesoKg: 800,
        dataColeta: '', dataEntrega: '', valorFrete: 2900, pedagios: 90, taxas: 30, adiantamentos: 0,
        veiculoPlaca: 'IJK3L67', motorista: 'Carlos Lima', observacoes: 'Escolta', status: 'Cancelado',
        dataPostagem: '', dataRecebimento: '', descontos: [], anexos: [], ocorrencias: [{data: this.todayStr(), tipo:'Cancelamento', descricao:'Cliente cancelou'}]
      }
    ];
    const atual = this.getRegistros();
    const merged = [...exemplos, ...atual];
    localStorage.setItem(this.storageKey, JSON.stringify(merged));
    this.registros = merged;
  }

  // efetivarRecord duplicado removido

  adicionarDescontoRecord(r: FreteTerceiroRegistro, i: number, motivo: string, valor: number, data?: string): void {
    if (!valor || valor <= 0) { alert('Informe um valor de desconto válido.'); return; }
    const idx = this.registros.indexOf(r);
    if (idx < 0) return;
    const rr = this.registros[idx];
    if (!rr.descontos) rr.descontos = [];
    rr.descontos.push({ motivo: motivo || 'Ajuste', valor, data: data || this.todayStr() });
    this.saveRegistros();
    this.novoDesconto[i] = { motivo: '', valor: 0, data: this.todayStr() };
  }

  atualizarDatasRecord(r: FreteTerceiroRegistro, i: number, dados: { dataPostagem?: string; dataEntrega?: string; dataRecebimento?: string }): void {
    const idx = this.registros.indexOf(r);
    if (idx < 0) return;
    const rr = this.registros[idx];
    if (dados.dataPostagem !== undefined) rr.dataPostagem = dados.dataPostagem || '';
    if (dados.dataEntrega !== undefined) rr.dataEntrega = dados.dataEntrega || '';
    if (dados.dataRecebimento !== undefined) rr.dataRecebimento = dados.dataRecebimento || '';
    this.saveRegistros();
    this.fecharEdicaoModal();
  }

  anexarArquivoRecord(r: FreteTerceiroRegistro, i: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('Arquivo maior que 2MB não permitido.'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const idx = this.registros.indexOf(r);
      if (idx < 0) return;
      const rr = this.registros[idx];
      if (!rr.anexos) rr.anexos = [];
      rr.anexos.push({ nome: file.name, conteudo: String(reader.result), tamanho: file.size });
      this.saveRegistros();
      input.value = '';
    };
    reader.readAsDataURL(file);
  }

  removerAnexoRecord(r: FreteTerceiroRegistro, j: number): void {
    const idx = this.registros.indexOf(r);
    if (idx < 0) return;
    const rr = this.registros[idx];
    if (!rr.anexos) return;
    rr.anexos.splice(j, 1);
    this.saveRegistros();
  }

  descontoTotal(r: FreteTerceiroRegistro): number {
    return (r.descontos || []).reduce((sum, d) => sum + (d.valor || 0), 0);
  }

  private saveRegistros(): void {
    localStorage.setItem(this.storageKey, JSON.stringify(this.registros));
    this.registros = this.getRegistros();
  }

  private todayStr(): string {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
  }

  abrirNovoFrete(): void {
    this.novoAberto = true;
    this.limpar(false);
  }

  fecharNovoFrete(): void {
    this.novoAberto = false;
  }
}