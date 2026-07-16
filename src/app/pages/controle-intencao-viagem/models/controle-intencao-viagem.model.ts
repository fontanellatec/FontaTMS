export interface EnderecoCompleto {
  uf: string;
  cidade: string;
  rua?: string;
  numero?: string;
  bairro?: string;
  complemento?: string;
}

export interface IntencaoViagem {
  codigo?: string;
  origem: EnderecoCompleto;
  destino: EnderecoCompleto;
  pesoKg: number;
  tipoCarga?: string;
  dataColeta?: string;
  dataEntrega?: string;
  observacoes?: string;
  valorPreCarga?: number;
  usuarioLancador?: string;
}

export interface Veiculo {
  placa: string;
  localizacao: string;
  tipo?: string;
  situacao?: string;
  frotaNumero?: string;
  tipoConjunto?: string;
  ultimaDescarga?: string;
  destinoCidade?: string;
  destinoUf?: string;
  coordenador?: string;
}

export interface Vinculo {
  intencao: IntencaoViagem;
  veiculo: Veiculo;
  status: 'pendente' | 'vinculado' | 'em_rota' | 'concluido';
  confirmado?: boolean;
  viagemId?: string;
  motorista?: string;
}
