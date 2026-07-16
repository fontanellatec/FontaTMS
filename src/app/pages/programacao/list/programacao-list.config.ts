import { FilterConfig, GridColumn, KpiConfig } from '@shared/components';

export const FILTER_CONFIGS: FilterConfig[] = [
  { type: 'date', label: 'Data Início', key: 'dataInicio', placeholder: 'Selecione a data' },
  { type: 'date', label: 'Data Recebida', key: 'dataRecebida', placeholder: 'Selecione a data' },
  {
    type: 'select', label: 'Envio SEFAZ', key: 'envioSefaz', options: [
      { value: 'nao-enviado', label: 'Não enviado' },
      { value: 'enviado', label: 'Enviado' }
    ]
  },
  {
    type: 'select', label: 'Ranking Diário', key: 'rankingDiario', options: [
      { value: 'alto', label: 'Alto' },
      { value: 'medio', label: 'Médio' },
      { value: 'baixo', label: 'Baixo' }
    ]
  },
  { type: 'number', label: 'Frota', key: 'frota', placeholder: 'Digite o número da frota' },
  {
    type: 'autocomplete',
    label: 'Veículo',
    key: 'veiculo',
    placeholder: 'Digite a placa do veículo',
    searchType: 'veiculo'
  },
  {
    type: 'autocomplete',
    label: 'Coordenador',
    key: 'coordenador',
    placeholder: 'Nome do coordenador',
    searchType: 'coordenador'
  },
  {
    type: 'autocomplete',
    label: 'Motorista',
    key: 'motorista',
    placeholder: 'Nome do motorista',
    searchType: 'motorista'
  },
  {
    type: 'autocomplete',
    label: 'Cidade',
    key: 'cidade',
    placeholder: 'Nome da cidade',
    searchType: 'cidade'
  },
  {
    type: 'select', label: 'Situação Veículo', key: 'situacaoVeiculo', options: [
      { value: 'em-rota', label: 'Em Rota' },
      { value: 'parado', label: 'Parado' },
      { value: 'manutencao', label: 'Manutenção' }
    ]
  },
  {
    type: 'select', label: 'Situação Motorista', key: 'situacaoMotorista', options: [
      { value: 'trabalhando', label: 'Trabalhando' },
      { value: 'folga', label: 'Folga' },
      { value: 'ferias', label: 'Férias' }
    ]
  },
  {
    type: 'select', label: 'Tipo Operação Frota', key: 'tipoOperacaoFrota', options: [
      { value: 'transferencia', label: 'Transferência' },
      { value: 'distribuicao', label: 'Distribuição' },
      { value: 'coleta', label: 'Coleta' }
    ]
  },
  { type: 'number', label: 'Tempo Mín. Fora (d)', key: 'tempoMinFora', placeholder: 'Dias mínimos' }
];

export const GRID_COLUMNS: GridColumn[] = [
  { key: 'dParados', label: 'D.Parados', type: 'number', align: 'center', sortable: true, width: '100px', sticky: true, stickyLeft: 0 },
  { key: 'tempoFora', label: 'T.Fora', type: 'number', align: 'center', sortable: true, width: '120px', sticky: true, stickyLeft: 100 },
  { key: 'frota', label: 'Frota', align: 'center', sortable: true, width: '120px', sticky: true, stickyLeft: 220 },
  { key: 'motorista', label: 'Motorista', sortable: true, width: '160px', sticky: true, stickyLeft: 340 },
  { key: 'situacaoVeiculo', label: 'Situação Veículo', type: 'status', sortable: true, width: '160px', sticky: true, stickyLeft: 500 },
  { key: 'origem', label: 'Origem', sortable: true },
  { key: 'inicioViagem', label: 'I.Viagem', type: 'date', sortable: true },
  { key: 'destino', label: 'Destino', sortable: true },
  { key: 'localizacao', label: 'Localização', sortable: true },
  { key: 'pEntrega', label: 'P.Entrega', type: 'date', sortable: true },
  { key: 'pViagem', label: 'P.Viagem', align: 'center', sortable: true },
  { key: 'totalReceitas', label: 'Total Receitas', type: 'currency', align: 'right', sortable: true },
  { key: 'totalDiario', label: 'Total Diário', type: 'currency', align: 'right', sortable: true },
  { key: 'observacao', label: 'Observação' },
  { key: 'entregas', label: 'Entregas', type: 'button', align: 'center', buttonLabel: 'Ver', buttonAction: 'abrir-entregas', buttonType: 'secondary' },
  { key: 'qtdReceita', label: 'QTD Receita', type: 'number', align: 'right', sortable: true },
  { key: 'situacaoMotorista', label: 'Situação Motorista', sortable: true },
  { key: 'tipoConjuntoVeiculo', label: 'Tipo Conjunto Veículo', sortable: true },
  { key: 'tipoOperacaoFrota', label: 'Tipo Operação Frota', sortable: true },
  { key: 'ultManutencao', label: 'Última Manutenção', type: 'date', sortable: true },
  { key: 'falta', label: 'Falta', type: 'number', align: 'center', sortable: true },
  { key: 'folga', label: 'Folga', type: 'number', align: 'center', sortable: true },
  { key: 'jornada', label: 'Jornada', type: 'button', align: 'center', buttonLabel: 'Abrir', buttonAction: 'abrir-jornada', buttonType: 'primary' }
];

export function getKpiConfigs(
  totalMotoristas: number,
  veiculosEmRota: number,
  veiculosParados: number,
  receitaTotal: number
): KpiConfig[] {
  return [
    { label: 'Total de Frotas', value: totalMotoristas, icon: 'users', format: 'number', color: '#3b82f6' },
    { label: 'Veiculos em Rota', value: veiculosEmRota, icon: 'route', format: 'number', color: '#10b981' },
    { label: 'Veiculos Vazios', value: veiculosParados, icon: 'stop-circle', format: 'number', color: '#f59e0b' },
    { label: 'Receita Total', value: receitaTotal, icon: 'currency', format: 'currency', color: '#059669' }
  ];
}
