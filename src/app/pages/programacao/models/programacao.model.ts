export interface ProgramacaoRow {
  dParados: number;
  tempoFora: string; // integer days as string
  frota: string;
  localizacao: { cidade: string; uf: string };
  motorista: string;
  situacaoVeiculo: string;
  origem: string;
  inicioViagem: string;
  destino: string;
  pEntrega: string;
  pViagem: string;
  totalReceitas: number;
  totalDiario: number;
  observacao: string;
  receitasPVOR: number;
  situacaoMotorista: string;
  tipoConjuntoVeiculo: string;
  tipoOperacaoFrota: string;
  ultManutencao: string;
  falta: number;
  folga: number;
  jornada: string;
  entregas: number;
  qtdReceita?: number;
}

export interface ConhecimentoItem {
  numero: string;
  armazemPrev: string;
  formaFinal: boolean;
  armazenagem: boolean;
  dataEntrega: string;
  armazem: string;
  observacao: string;
}

export interface PlanoViagemGroup {
  pvNumero: string;
  emissao: string;
  conhecimentos: ConhecimentoItem[];
}

export interface PlanoViagemRow {
  pvNumero: string;
  emissao: string;
  origem: string;
  destino: string;
  valor: string;
  dataEntrega?: string;
  horaEntrega?: string;
}

export interface OutraReceitaRow {
  recNumero: string;
  emissao: string;
  origem: string;
  destino: string;
  valor: string;
  dataEntrega?: string;
  horaEntrega?: string;
}

export interface ManifestoItem {
  numero: string;
  emissao: string;
  origem: string;
  destino: string;
  status: string;
  cidadeEncerramento?: string;
  justificativaCancelamento?: string;
  chaveAcesso?: string;
  encerramentoUF?: string;
  encerramentoData?: string;
}

export interface ManifestoGroup {
  pvNumero: string;
  emissao: string;
  manifestos: ManifestoItem[];
}

export interface DetalhesFrotaResponse {
  entregasPVGroups: PlanoViagemGroup[];
  planoViagemRows: PlanoViagemRow[];
  outrasReceitasRows: OutraReceitaRow[];
  manifestosGroups: ManifestoGroup[];
}
