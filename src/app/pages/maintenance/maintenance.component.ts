import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type OrderStatus = 'Nova' | 'Execução' | 'Concluída';
type OrderType = 'Todos' | 'Preventiva' | 'Corretiva';
type Priority = 'Todos' | 'Baixa' | 'Média' | 'Alta';

interface ServiceItem {
  seq: number;
  servico: string;
  quantidade: number;
  horasPrev: string;
  horasReal?: string;
  situacao: 'ABERTO' | 'CONCLUÍDO';
}

interface PartItem {
  seq: number;
  produto: string;
  mecanico: string;
  quantidade: number;
}

interface Order {
  id: number;
  codigo: string;
  placa: string;
  descricao?: string;
  frota?: string;
  tipo: Exclude<OrderType, 'Todos'>;
  prioridade: Exclude<Priority, 'Todos'>;
  status: OrderStatus;
  responsavel?: string;
  data?: string; // dd/MM/yyyy
  servicos: ServiceItem[];
  pecas: PartItem[];
  comentarios: { dataHora: string; usuario: string; texto: string }[];
}

@Component({
  selector: 'app-maintenance',
  templateUrl: './maintenance.component.html',
  styleUrls: ['./maintenance.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class MaintenanceComponent {
  // Filtros
  filtroCodigo = '';
  filtroPlaca = '';
  filtroDescricao = '';
  filtroFrota = '';
  filtroTipo: OrderType = 'Todos';
  filtroPrioridade: Priority = 'Todos';

  // Dados mock
  orders: Order[] = [
    {
      id: 11,
      codigo: 'OS011',
      placa: 'MDC1786',
      descricao: 'Pintura e limpeza do cavalo',
      frota: 'Lona',
      tipo: 'Preventiva',
      prioridade: 'Alta',
      status: 'Nova',
      responsavel: 'Rafael Bonaventura',
      data: '28/09/2025',
      servicos: [
        { seq: 1, servico: 'Troca de óleo', quantidade: 1, horasPrev: '3h', horasReal: '', situacao: 'ABERTO' },
        { seq: 2, servico: 'Troca de disco de freio', quantidade: 1, horasPrev: '2h30m', horasReal: '', situacao: 'ABERTO' }
      ],
      pecas: [
        { seq: 1, produto: 'F- Filtros', mecanico: 'Mario Souza', quantidade: 1 },
        { seq: 2, produto: 'MANGUEIRA DO VENTURI 20T', mecanico: 'Mario Souza', quantidade: 1 }
      ],
      comentarios: [
        { dataHora: '28/09/25 14:05', usuario: 'Rafael Bonaventura', texto: 'OS aberta e aguardando execução.' }
      ]
    },
    {
      id: 12,
      codigo: 'OS012',
      placa: 'MIY4B01',
      descricao: 'Revisão geral caixa de câmbio',
      frota: 'Mecotronix',
      tipo: 'Corretiva',
      prioridade: 'Média',
      status: 'Execução',
      responsavel: 'Marcio Matias',
      data: '29/09/2025',
      servicos: [
        { seq: 1, servico: 'Ajuste de embreagem', quantidade: 1, horasPrev: '2h', horasReal: '1h30m', situacao: 'CONCLUÍDO' },
        { seq: 2, servico: 'Troca de fluído', quantidade: 1, horasPrev: '1h', horasReal: '', situacao: 'ABERTO' }
      ],
      pecas: [
        { seq: 1, produto: 'Óleo caixa', mecanico: 'Marcio Matias', quantidade: 1 }
      ],
      comentarios: [
        { dataHora: '29/09/25 08:40', usuario: 'Marcio Matias', texto: 'Iniciado, em execução.' }
      ]
    },
    {
      id: 13,
      codigo: 'OS013',
      placa: 'LZO1A58',
      descricao: 'Revisão de freios e limpeza',
      frota: 'Teste',
      tipo: 'Preventiva',
      prioridade: 'Baixa',
      status: 'Concluída',
      responsavel: 'Rafael Bonaventura',
      data: '25/09/2025',
      servicos: [
        { seq: 1, servico: 'Troca de pastilhas', quantidade: 2, horasPrev: '3h', horasReal: '2h45m', situacao: 'CONCLUÍDO' }
      ],
      pecas: [
        { seq: 1, produto: 'Pastilhas', mecanico: 'Rafael Bonaventura', quantidade: 2 }
      ],
      comentarios: [
        { dataHora: '25/09/25 18:22', usuario: 'Rafael Bonaventura', texto: 'Finalizada com sucesso.' }
      ]
    }
  ];

  constructor() {
    const tipos: Exclude<OrderType, 'Todos'>[] = ['Preventiva', 'Corretiva'];
    const prioridades: Exclude<Priority, 'Todos'>[] = ['Baixa', 'Média', 'Alta'];
    const responsaveis = ['Rafael Bonaventura', 'Marcio Matias', 'Mario Souza', 'Usuário'];
    const rand = <T>(a: T[]) => a[Math.floor(Math.random() * a.length)];

    const baseId = 1000;
    for (let i = 0; i < 200; i++) {
      const status: 'Nova' | 'Execução' | 'Concluída' = i % 3 === 0 ? 'Nova' : i % 3 === 1 ? 'Execução' : 'Concluída';
      const id = baseId + i;
      const servicos: ServiceItem[] = [
        { seq: 1, servico: 'Inspeção geral', quantidade: 1, horasPrev: '1h30m', horasReal: status === 'Concluída' ? '1h20m' : '', situacao: status === 'Concluída' ? 'CONCLUÍDO' as const : 'ABERTO' as const },
        { seq: 2, servico: 'Troca de fluído', quantidade: 1, horasPrev: '1h', horasReal: status !== 'Nova' ? '45m' : '', situacao: status === 'Execução' ? 'ABERTO' as const : 'CONCLUÍDO' as const }
      ];
      const pecas = status === 'Nova' ? [] : [{ seq: 1, produto: 'Óleo 15W40', mecanico: 'Mario Souza', quantidade: 1 }];
      const comentarios = [{ dataHora: '10/10/25 10:00', usuario: 'Sistema', texto: 'Registro gerado automaticamente.' }];

      const order: Order = {
        id,
        codigo: `OS${id}`,
        placa: `TRK${String(i + 1).padStart(4, '0')}`,
        descricao: status === 'Nova' ? 'Aguardando avaliação' : 'Serviço em curso',
        frota: i % 2 ? 'Lona' : 'Teste',
        tipo: rand(tipos),
        prioridade: rand(prioridades),
        status,
        responsavel: rand(responsaveis),
        data: `${String((i % 28) + 1).padStart(2, '0')}/${String(((i % 12) + 1)).padStart(2, '0')}/2025`,
        servicos,
        pecas,
        comentarios
      };

      this.orders.push(order);
    }
  }

  // Computados
  get novas(): Order[] { return this.aplicarFiltros(this.orders.filter(o => o.status === 'Nova')); }
  get execucao(): Order[] { return this.aplicarFiltros(this.orders.filter(o => o.status === 'Execução')); }
  get concluidas(): Order[] { return this.aplicarFiltros(this.orders.filter(o => o.status === 'Concluída')); }

  private aplicarFiltros(list: Order[]): Order[] {
    return list.filter(o =>
      (!this.filtroCodigo || o.codigo.toLowerCase().includes(this.filtroCodigo.toLowerCase())) &&
      (!this.filtroPlaca || o.placa.toLowerCase().includes(this.filtroPlaca.toLowerCase())) &&
      (!this.filtroDescricao || (o.descricao || '').toLowerCase().includes(this.filtroDescricao.toLowerCase())) &&
      (!this.filtroFrota || (o.frota || '').toLowerCase().includes(this.filtroFrota.toLowerCase())) &&
      (this.filtroTipo === 'Todos' || o.tipo === this.filtroTipo) &&
      (this.filtroPrioridade === 'Todos' || o.prioridade === this.filtroPrioridade)
    );
  }

  // Ações de OS
  iniciar(os: Order): void { os.status = 'Execução'; }
  concluir(os: Order): void { os.status = 'Concluída'; }

  // Modal de detalhes
  detailOpen = false;
  selecionada?: Order;
  abrirDetalhes(os: Order): void { this.selecionada = os; this.detailOpen = true; }
  fecharDetalhes(): void { this.detailOpen = false; this.selecionada = undefined; }

  // Comentários
  novoComentario = '';
  adicionarComentario(): void {
    if (!this.selecionada || !this.novoComentario.trim()) return;
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = String(now.getFullYear());
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    this.selecionada.comentarios.unshift({ dataHora: `${dd}/${mm}/${yyyy} ${hh}:${min}`, usuario: 'Usuário', texto: this.novoComentario.trim() });
    this.novoComentario = '';
  }

  // Visual helpers
  getPriorityClass(p: Priority): string {
    switch (p) {
      case 'Baixa': return 'baixa';
      case 'Média': return 'media';
      case 'Alta': return 'alta';
      default: return '';
    }
  }

  // Modais: Horas, novo Serviço e nova Peça
  horasModalOpen = false;
  novoServicoModalOpen = false;
  novaPecaModalOpen = false;

  horasForm: { seq?: number; horasReal: string; observacao?: string } = { horasReal: '' };
  novoServicoForm: { servico: string; quantidade: number; horasPrev: string } = { servico: '', quantidade: 1, horasPrev: '1h' };
  novaPecaForm: { produto: string; mecanico: string; quantidade: number } = { produto: '', mecanico: '', quantidade: 1 };

  openHoras() { if (!this.selecionada) { return; } this.horasForm = { seq: this.selecionada.servicos[0]?.seq ?? 1, horasReal: '' }; this.horasModalOpen = true; }
  saveHoras() {
    if (!this.selecionada || !this.horasForm.seq) { return; }
    const it = this.selecionada.servicos.find(s => s.seq === this.horasForm.seq);
    if (it) {
      it.horasReal = this.horasForm.horasReal || '';
      it.situacao = it.horasReal ? 'CONCLUÍDO' : 'ABERTO';
    }
    this.horasModalOpen = false;
  }

  openNovoServico() { if (!this.selecionada) { return; } this.novoServicoForm = { servico: '', quantidade: 1, horasPrev: '1h' }; this.novoServicoModalOpen = true; }
  saveNovoServico() {
    if (!this.selecionada || !this.novoServicoForm.servico) { return; }
    const nextSeq = (this.selecionada.servicos.at(-1)?.seq ?? 0) + 1;
    this.selecionada.servicos.push({ seq: nextSeq, servico: this.novoServicoForm.servico, quantidade: this.novoServicoForm.quantidade, horasPrev: this.novoServicoForm.horasPrev, horasReal: '', situacao: 'ABERTO' });
    this.novoServicoModalOpen = false;
  }

  openNovaPeca() { if (!this.selecionada) { return; } this.novaPecaForm = { produto: '', mecanico: '', quantidade: 1 }; this.novaPecaModalOpen = true; }
  saveNovaPeca() {
    if (!this.selecionada || !this.novaPecaForm.produto) { return; }
    const nextSeq = (this.selecionada.pecas.at(-1)?.seq ?? 0) + 1;
    this.selecionada.pecas.push({ seq: nextSeq, produto: this.novaPecaForm.produto, mecanico: this.novaPecaForm.mecanico || 'Usuário', quantidade: this.novaPecaForm.quantidade });
    this.novaPecaModalOpen = false;
  }

  // Drag-and-drop
  dragged?: Order;
  dragOverStatus?: OrderStatus;
  onDragStart(os: Order): void { this.dragged = os; }
  onDragEnd(): void { this.dragged = undefined; this.dragOverStatus = undefined; }
  onDragOver(evt: DragEvent): void { evt.preventDefault(); }
  onDragEnter(status: OrderStatus): void { this.dragOverStatus = status; }
  onDragLeave(status: OrderStatus): void { if (this.dragOverStatus === status) this.dragOverStatus = undefined; }
  onDrop(status: OrderStatus): void {
    if (this.dragged) { this.dragged.status = status; }
    this.dragged = undefined;
    this.dragOverStatus = undefined;
  }

  // Contadores de serviços (evita problemas de tipagem no template)
  getServicosAbertos(os: Order): number { return (os.servicos || []).filter(it => it.situacao === 'ABERTO').length; }
  getServicosConcluidos(os: Order): number { return (os.servicos || []).filter(it => it.situacao === 'CONCLUÍDO').length; }
}