import { FilterConfig, KpiConfig } from '@shared/components';

export const FILTER_CONFIGS: FilterConfig[] = [
  {
    type: 'autocomplete',
    label: 'Origem',
    key: 'origem',
    placeholder: 'Pesquise a cidade de origem',
    searchType: 'cidade',
    value: ''
  },
  {
    type: 'autocomplete',
    label: 'Destino',
    key: 'destino',
    placeholder: 'Pesquise a cidade de destino',
    searchType: 'cidade',
    value: ''
  },
  {
    type: 'select',
    label: 'Status',
    key: 'status',
    placeholder: 'Todos',
    value: '',
    options: [
      { value: 'pendente', label: 'Pendente' },
      { value: 'vinculado', label: 'Vinculado' },
      { value: 'em_rota', label: 'Em rota' },
      { value: 'concluido', label: 'Concluído' }
    ]
  },
  {
    type: 'select',
    label: 'Tipo Veículo',
    key: 'tipoVeiculo',
    placeholder: 'Todos',
    value: '',
    options: [
      { value: 'Leve', label: 'Leve' },
      { value: 'VUC', label: 'VUC' },
      { value: 'Toco', label: 'Toco' },
      { value: 'Carreta', label: 'Carreta' }
    ]
  }
];

export function getKpiConfigs(
  countIntencoes: number,
  countVinculados: number,
  countEmRota: number,
  countConcluidos: number
): KpiConfig[] {
  return [
    { label: 'Pré-Cargas', value: countIntencoes, icon: 'plus', format: 'number', color: '#3b82f6' },
    { label: 'Vinculados', value: countVinculados, icon: 'truck', format: 'number', color: '#6366f1' },
    { label: 'Em rota', value: countEmRota, icon: 'route', format: 'number', color: '#10b981' },
    { label: 'Concluídos', value: countConcluidos, icon: 'check-circle', format: 'number', color: '#059669' }
  ];
}

