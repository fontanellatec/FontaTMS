import { 
  Component, 
  Input, 
  Output, 
  EventEmitter, 
  OnChanges, 
  SimpleChanges, 
  TemplateRef, 
  ViewChild, 
  AfterViewInit, 
  ChangeDetectorRef, 
  inject 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  TabModalComponent, 
  TabConfig, 
  ButtonComponent, 
  JustificationFieldComponent 
} from '@shared/components';
import { JustificationConfig, JustificationPresets } from '@core/types/justification-field.types';
import { 
  PlanoViagemGroup, 
  PlanoViagemRow, 
  OutraReceitaRow, 
  ManifestoGroup 
} from '../../models/programacao.model';
import { ProgramacaoService } from '../../services/programacao.service';
import { ESTADOS_UF, CIDADES_POR_UF } from '@core/constants/localidades';
import { ConhecimentosTabComponent } from './tabs/conhecimentos-tab/conhecimentos-tab.component';
import { PlanoViagemTabComponent } from './tabs/plano-viagem-tab/plano-viagem-tab.component';
import { OutrasReceitasTabComponent } from './tabs/outras-receitas-tab/outras-receitas-tab.component';
import { ManifestosTabComponent } from './tabs/manifestos-tab/manifestos-tab.component';

@Component({
  selector: 'app-entregas-modal',
  templateUrl: './entregas-modal.component.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TabModalComponent,
    ButtonComponent,
    JustificationFieldComponent,
    ConhecimentosTabComponent,
    PlanoViagemTabComponent,
    OutrasReceitasTabComponent,
    ManifestosTabComponent
  ]
})
export class EntregasModalComponent implements OnChanges, AfterViewInit {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly programacaoService = inject(ProgramacaoService);

  @Input() open = false;
  @Output() openChange = new EventEmitter<boolean>();
  @Input() frota = '';

  entregasActiveTabId = 'conhecimentos';
  entregasTabs: TabConfig[] = [];

  entregasPVGroups: PlanoViagemGroup[] = [];
  planoViagemRows: PlanoViagemRow[] = [];
  outrasReceitasRows: OutraReceitaRow[] = [];
  manifestosGroups: ManifestoGroup[] = [];

  encerrarModalOpen = false;
  cancelarModalOpen = false;
  encerrarActiveTabId = 'form';
  cancelarActiveTabId = 'form';
  encerrarTabs: TabConfig[] = [];
  cancelarTabs: TabConfig[] = [];
  encerrarCtx: { i: number; j: number; data: string; estado: string; cidade: string } | null = null;
  cancelarCtx: { i: number; j: number; justificativa: string } | null = null;

  cancelarJustificationConfig: JustificationConfig = {
    ...JustificationPresets.cancellation,
    helpText: 'O motivo será registrado no log de auditoria do manifesto.'
  };

  estadosUF = ESTADOS_UF;
  cidadesPorUF = CIDADES_POR_UF;

  @ViewChild('conhecimentosTpl') conhecimentosTpl!: TemplateRef<any>;
  @ViewChild('planoViagemTpl') planoViagemTpl!: TemplateRef<any>;
  @ViewChild('outrasReceitasTpl') outrasReceitasTpl!: TemplateRef<any>;
  @ViewChild('manifestosTpl') manifestosTpl!: TemplateRef<any>;
  @ViewChild('encerrarManifestoTpl') encerrarManifestoTpl!: TemplateRef<any>;
  @ViewChild('cancelarManifestoTpl') cancelarManifestoTpl!: TemplateRef<any>;

  ngOnChanges(changes: SimpleChanges): void {
    console.log('EntregasModal - ngOnChanges:', changes);
    const frotaChanged = changes['frota'] && changes['frota'].currentValue !== changes['frota'].previousValue;
    const openChanged = changes['open'] && changes['open'].currentValue !== changes['open'].previousValue;

    if (openChanged && this.open) {
      this.entregasActiveTabId = 'conhecimentos';
    }

    if ((frotaChanged || openChanged) && this.open && this.frota) {
      this.carregarDetalhes();
    }
  }

  ngAfterViewInit(): void {
    console.log('EntregasModal - ngAfterViewInit. Templates:', {
      conhecimentos: this.conhecimentosTpl,
      planoViagem: this.planoViagemTpl,
      outrasReceitas: this.outrasReceitasTpl,
      manifestos: this.manifestosTpl
    });
    this.entregasTabs = [
      { id: 'conhecimentos', label: 'Conhecimentos', template: this.conhecimentosTpl },
      { id: 'plano-viagem', label: 'Plano Viagem', template: this.planoViagemTpl },
      { id: 'outras-receitas', label: 'Outras Receitas', template: this.outrasReceitasTpl },
      { id: 'manifestos', label: 'Manifestos', template: this.manifestosTpl }
    ];
    this.encerrarTabs = [{ id: 'form', label: 'Encerrar', template: this.encerrarManifestoTpl }];
    this.cancelarTabs = [{ id: 'form', label: 'Cancelar', template: this.cancelarManifestoTpl }];
    this.cdr.detectChanges();
  }

  carregarDetalhes(): void {
    console.log('EntregasModal - Iniciando busca de detalhes para frota:', this.frota);
    this.programacaoService.getDetalhesFrota(this.frota).subscribe({
      next: (detalhes) => {
        console.log('EntregasModal - Detalhes carregados com sucesso:', detalhes);
        this.entregasPVGroups = detalhes.entregasPVGroups || [];
        this.planoViagemRows = detalhes.planoViagemRows || [];
        this.outrasReceitasRows = detalhes.outrasReceitasRows || [];
        this.manifestosGroups = detalhes.manifestosGroups || [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('EntregasModal - Erro ao carregar detalhes:', err);
      }
    });
  }

  fecharEntregas(): void {
    this.open = false;
    this.openChange.emit(false);
    this.entregasPVGroups = [];
    this.planoViagemRows = [];
    this.outrasReceitasRows = [];
    this.manifestosGroups = [];
  }

  onOpenChange(val: boolean): void {
    this.open = val;
    this.openChange.emit(val);
    if (!val) {
      this.fecharEntregas();
    }
  }

  confirmarEntregas(): void {
    console.log('Confirmar entregas para frota', this.frota);
    this.fecharEntregas();
  }


  get encerrarCidades(): string[] {
    const uf = this.encerrarCtx?.estado || 'SP';
    return this.cidadesPorUF[uf] || [];
  }

  private parseUF(place: string | undefined): string | null {
    if (!place) return null;
    const m = place.match(/[-–]\s*([A-Z]{2})$/);
    return m ? m[1] : null;
  }

  abrirEncerrarManifesto(i: number, j: number): void {
    const m = this.manifestosGroups[i]?.manifestos[j];
    const today = new Date().toISOString().slice(0, 10);
    const ufFromDestino = this.parseUF(m?.destino || '');
    const estado = ufFromDestino || 'SP';
    const cidadeDefault = (this.cidadesPorUF[estado] || [''])[0] || '';
    this.encerrarCtx = { i, j, data: today, estado, cidade: cidadeDefault };
    this.encerrarModalOpen = true;
  }

  onChangeEstadoEncerrar(): void {
    if (!this.encerrarCtx) return;
    const opts = this.cidadesPorUF[this.encerrarCtx.estado] || [];
    this.encerrarCtx.cidade = opts[0] || '';
  }

  fecharEncerrarManifesto(): void {
    this.encerrarModalOpen = false;
    this.encerrarCtx = null;
  }

  confirmarEncerrarManifesto(): void {
    const ctx = this.encerrarCtx; 
    if (!ctx) return;
    const m = this.manifestosGroups[ctx.i]?.manifestos[ctx.j];
    if (!m) return;

    this.programacaoService.encerrarManifesto(m.numero, ctx.data, ctx.estado, ctx.cidade).subscribe({
      next: () => {
        m.status = 'Encerrado';
        m.cidadeEncerramento = ctx.cidade;
        m.encerramentoUF = ctx.estado;
        m.encerramentoData = ctx.data;
        console.log('Manifesto encerrado com sucesso');
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erro ao encerrar manifesto', err)
    });
    this.fecharEncerrarManifesto();
  }

  get encerrarGroup() {
    const i = this.encerrarCtx?.i;
    return (i === undefined || i === null) ? null : (this.manifestosGroups[i] || null);
  }

  get encerrarManifestoSel() {
    const ctx = this.encerrarCtx; 
    if (!ctx) return null;
    const g = this.manifestosGroups[ctx.i];
    return g ? (g.manifestos[ctx.j] || null) : null;
  }

  abrirCancelarManifesto(i: number, j: number): void {
    this.cancelarCtx = { i, j, justificativa: '' };
    this.cancelarModalOpen = true;
  }

  fecharCancelarManifesto(): void {
    this.cancelarModalOpen = false;
    this.cancelarCtx = null;
  }

  confirmarCancelarManifesto(): void {
    const ctx = this.cancelarCtx; 
    if (!ctx) return;
    const m = this.manifestosGroups[ctx.i]?.manifestos[ctx.j];
    if (!m) return;

    this.programacaoService.cancelarManifesto(m.numero, ctx.justificativa || '').subscribe({
      next: () => {
        m.status = 'Cancelado';
        m.justificativaCancelamento = ctx.justificativa || '';
        console.log('Manifesto cancelado com sucesso');
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erro ao cancelar manifesto', err)
    });
    this.cancelarModalOpen = false;
    this.cancelarCtx = null;
  }

  imprimirManifesto(i: number, j: number): void {
    const m = this.manifestosGroups[i]?.manifestos[j];
    if (!m) return;
    console.log('Imprimir manifesto', m.numero, 'PV', this.manifestosGroups[i].pvNumero);
  }
}
