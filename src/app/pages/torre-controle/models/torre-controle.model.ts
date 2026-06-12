export interface TcVehicle {
  id: number;
  placa: string;
  status: 'Viajando' | 'Vazio' | 'Parado' | 'Disponível' | 'Manutenção';
  cidade: string;
  uf: string;
  lat: number;
  lng: number;
}

export interface TcFrete {
  id: number;
  data: Date;
  valor: number;
  status: 'Concluido' | 'Em Rota' | 'Cancelado';
  onTime: boolean;
  inFull: boolean;
  valorPrevisto: number;
  origemUf: string;
  destinoUf: string;
  distanciaKm: number;
  operacaoFrota: string;
}

export const OPERACOES_FROTA_CATALOG = [
  '4 EIXO (SUCATA)',
  'FONPLAST',
  'LINHA SÃO PAULO',
  'REGIONAL FSG',
  'REGIONAL NORDESTE',
  'RODO 25MT (SUCATA)',
  'RODO CAÇAMBA',
  'VIRA JM',
  'VIRA MG',
  'VIRA PIRA',
  'VIRA RJ (DEDICADO)',
  'VIRA RJ (LINHA)',
  'VIRA RS',
  'VIRA SA',
  'VIRA SP',
  'VIRA SP - GNV'
];
