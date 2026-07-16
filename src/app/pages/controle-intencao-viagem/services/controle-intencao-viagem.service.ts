import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { CITY_TO_UF } from '@core/constants/geo.constants';
import { EnderecoCompleto, IntencaoViagem, Veiculo, Vinculo } from '../models/controle-intencao-viagem.model';

@Injectable({ providedIn: 'root' })
export class ViagemService {
  private readonly intencoesKey = 'intencoesViagem';
  private readonly vinculosKey = 'controleVinculos';
  private readonly viagensKey = 'viagensData';

  getIntencoes(): Observable<IntencaoViagem[]> {
    try {
      const raw = localStorage.getItem(this.intencoesKey);
      let parsed: IntencaoViagem[] = raw ? JSON.parse(raw) as IntencaoViagem[] : [];
      const originalLength = parsed.length;

      if (!parsed.length) {
        const defaultList = this.sampleIntencoes();
        this.ensureCoverageForVehicleDestinations(defaultList);
        this.ensureIntencoesHaveCodigo(defaultList);
        localStorage.setItem(this.intencoesKey, JSON.stringify(defaultList));
        return of(defaultList);
      }

      const usuarios = ['João Silva', 'Maria Souza', 'Carlos Lima', 'Ana Paula', 'Rafael Costa', 'Juliana Alves'];
      const destinosPermitidos = this.getDestinosPermitidosVeiculos();
      const cidadesPermitidas = Array.from(destinosPermitidos.keys());
      const today = new Date();
      let changed = false;

      for (let i = 0; i < parsed.length; i++) {
        const item = parsed[i];
        if (!item) continue;

        const origemCidadeAtual = item.origem?.cidade || '';
        if (!destinosPermitidos.has(origemCidadeAtual) && cidadesPermitidas.length > 0) {
          const cidadeSubstituta = cidadesPermitidas[i % cidadesPermitidas.length];
          const ufSubstituta = destinosPermitidos.get(cidadeSubstituta) || 'SP';
          item.origem = { cidade: cidadeSubstituta, uf: ufSubstituta };
          changed = true;
        }

        const offset = i % 7;
        if (!item.dataColeta || !item.dataEntrega) {
          const coleta = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);
          const entrega = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset + 2);
          item.dataColeta = item.dataColeta || coleta.toLocaleDateString('pt-BR');
          item.dataEntrega = item.dataEntrega || entrega.toLocaleDateString('pt-BR');
          changed = true;
        }
        if (item.valorPreCarga == null) {
          const base = item.pesoKg && item.pesoKg > 0 ? item.pesoKg * 3 : 20000;
          item.valorPreCarga = Math.round(base / 100) * 100;
          changed = true;
        }
        if (!item.usuarioLancador) {
          item.usuarioLancador = usuarios[i % usuarios.length];
          changed = true;
        }
      }

      this.ensureCoverageForVehicleDestinations(parsed);
      this.ensureIntencoesHaveCodigo(parsed);
      if (parsed.length !== originalLength) changed = true;

      if (changed) {
        localStorage.setItem(this.intencoesKey, JSON.stringify(parsed));
      }
      return of(parsed);
    } catch {
      return of([]);
    }
  }

  saveIntencoes(intencoes: IntencaoViagem[]): Observable<void> {
    try {
      this.ensureIntencoesHaveCodigo(intencoes);
      localStorage.setItem(this.intencoesKey, JSON.stringify(intencoes));
    } catch {}
    return of(undefined);
  }

  getVeiculos(): Observable<Veiculo[]> {
    return of(this.defaultVeiculos());
  }

  getVinculos(): Observable<Vinculo[]> {
    try {
      const raw = localStorage.getItem(this.vinculosKey);
      return of(raw ? JSON.parse(raw) as Vinculo[] : []);
    } catch {
      return of([]);
    }
  }

  saveVinculos(vinculos: Vinculo[]): Observable<void> {
    try {
      localStorage.setItem(this.vinculosKey, JSON.stringify(vinculos));
    } catch {}
    return of(undefined);
  }

  removerViagem(viagemId: string): Observable<void> {
    try {
      const raw = localStorage.getItem(this.viagensKey);
      if (raw) {
        const rows = JSON.parse(raw);
        const filtradas = rows.filter((r: any) => r && r.id !== viagemId);
        localStorage.setItem(this.viagensKey, JSON.stringify(filtradas));
      }
    } catch {}
    return of(undefined);
  }

  removerViagens(viagemIds: string[]): Observable<void> {
    try {
      const raw = localStorage.getItem(this.viagensKey);
      if (raw) {
        const rows = JSON.parse(raw);
        const filtradas = rows.filter((r: any) => r && !viagemIds.includes(r.id));
        localStorage.setItem(this.viagensKey, JSON.stringify(filtradas));
      }
    } catch {}
    return of(undefined);
  }

  confirmarVinculos(vincsToConfirm: Vinculo[]): Observable<void> {
    try {
      const raw = localStorage.getItem(this.viagensKey);
      const rows = raw ? JSON.parse(raw) : [];
      const prefix = 'VIA-';
      let max = 0;
      for (const r of rows) {
        if (r && typeof r.id === 'string' && r.id.startsWith(prefix)) {
          const num = parseInt(r.id.slice(prefix.length), 10);
          if (!isNaN(num)) max = Math.max(max, num);
        }
      }

      for (const v of vincsToConfirm) {
        v.confirmado = true;
        if (!v.viagemId) {
          max++;
          const next = String(max).padStart(4, '0');
          const id = `${prefix}${next}`;
          v.viagemId = id;
          const origem = `${v.intencao.origem.cidade}${v.intencao.origem.uf ? ' - ' + v.intencao.origem.uf : ''}`;
          const destino = `${v.intencao.destino.cidade}${v.intencao.destino.uf ? ' - ' + v.intencao.destino.uf : ''}`;
          const row = { id, status: 'Pendente', eta: '—', motorista: (v.motorista && v.motorista.trim()) ? v.motorista.trim() : '—', veiculo: v.veiculo.placa || '—', origem, destino };
          rows.unshift(row);
        }
      }

      localStorage.setItem(this.viagensKey, JSON.stringify(rows));
      const rawVinculos = localStorage.getItem(this.vinculosKey);
      if (rawVinculos) {
        const allVinculos = JSON.parse(rawVinculos) as Vinculo[];
        for (const v of allVinculos) {
          const match = vincsToConfirm.find(x => x.intencao.codigo === v.intencao.codigo && x.veiculo.placa === v.veiculo.placa);
          if (match) {
            v.confirmado = true;
            v.viagemId = match.viagemId;
          }
        }
        localStorage.setItem(this.vinculosKey, JSON.stringify(allVinculos));
      }
    } catch {}
    return of(undefined);
  }

  addIntencoesExemplo(currentIntencoes: IntencaoViagem[], currentVinculos: Vinculo[]): Observable<IntencaoViagem[]> {
    const tipos: string[] = ['Geral', 'Frigorificada', 'Granel', 'Perigosa', 'Container'];
    const usuarios = ['João Silva', 'Maria Souza', 'Carlos Lima', 'Ana Paula', 'Rafael Costa', 'Juliana Alves'];

    const baseVeiculos = this.defaultVeiculos();
    const destinosMap = new Map<string, string>();
    for (const v of baseVeiculos) {
      if (v.destinoCidade && v.destinoUf) destinosMap.set(v.destinoCidade, v.destinoUf);
    }
    const cidades = Array.from(destinosMap.keys());

    const intencaoEquals = (a: IntencaoViagem, b: IntencaoViagem): boolean => {
      if (!a || !b) return false;
      if (a.codigo && b.codigo) return a.codigo === b.codigo;
      return a.origem.uf === b.origem.uf && a.origem.cidade === b.origem.cidade &&
             a.destino.uf === b.destino.uf && a.destino.cidade === b.destino.cidade &&
             a.pesoKg === b.pesoKg && (a.tipoCarga || '') === (b.tipoCarga || '');
    };

    const existsOrLinked = (i: IntencaoViagem): boolean => {
      const existsInList = currentIntencoes.some(x => intencaoEquals(x, i));
      const existsLinked = currentVinculos.some(v => intencaoEquals(v.intencao, i));
      return existsInList || existsLinked;
    };

    const list = [...currentIntencoes];
    let added = 0;
    let tentativas = 0;

    while (added < 8 && tentativas < 40) {
      tentativas++;
      const origemCidade = cidades[Math.floor(Math.random() * cidades.length)];
      let destinoCidade = cidades[Math.floor(Math.random() * cidades.length)];
      if (destinoCidade === origemCidade) {
        destinoCidade = cidades[(cidades.indexOf(origemCidade) + 1) % cidades.length];
      }
      const origemUf = destinosMap.get(origemCidade) || 'SP';
      const destinoUf = destinosMap.get(destinoCidade) || origemUf;
      const tipo = tipos[Math.floor(Math.random() * tipos.length)];
      const pesoRaw = 5000 + Math.floor(Math.random() * (18000 - 5000));
      const pesoKg = Math.round(pesoRaw / 100) * 100;
      const hoje = new Date();
      const deltaColeta = Math.floor(Math.random() * 5);
      const deltaEntrega = deltaColeta + 1 + Math.floor(Math.random() * 4);
      const coleta = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + deltaColeta);
      const entrega = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + deltaEntrega);
      const dataColeta = coleta.toLocaleDateString('pt-BR');
      const dataEntrega = entrega.toLocaleDateString('pt-BR');
      const valorPreCarga = 15000 + Math.round(Math.random() * 35000);
      const usuarioLancador = usuarios[Math.floor(Math.random() * usuarios.length)];

      const novo: IntencaoViagem = {
        origem: { uf: origemUf, cidade: origemCidade },
        destino: { uf: destinoUf, cidade: destinoCidade },
        pesoKg,
        tipoCarga: tipo,
        dataColeta,
        dataEntrega,
        valorPreCarga,
        usuarioLancador
      };

      if (!existsOrLinked(novo)) {
        list.push(novo);
        added++;
      }
    }

    this.ensureIntencoesHaveCodigo(list);
    try {
      localStorage.setItem(this.intencoesKey, JSON.stringify(list));
    } catch {}
    return of(list);
  }

  private ensureIntencoesHaveCodigo(list: IntencaoViagem[]): void {
    let changed = false;
    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      if (item && !item.codigo) {
        item.codigo = `CRG-${String(i + 1).padStart(4, '0')}`;
        changed = true;
      }
    }
    if (changed) {
      try {
        localStorage.setItem(this.intencoesKey, JSON.stringify(list));
      } catch {}
    }
  }

  private getDestinosPermitidosVeiculos(): Map<string, string> {
    const destinos = new Map<string, string>();
    for (const v of this.defaultVeiculos()) {
      if (v.destinoCidade && v.destinoUf) destinos.set(v.destinoCidade, v.destinoUf);
    }
    return destinos;
  }

  private ensureCoverageForVehicleDestinations(intencoes: IntencaoViagem[]): void {
    const destinosPermitidos = this.getDestinosPermitidosVeiculos();
    const cidadesPermitidas = new Set(Array.from(destinosPermitidos.keys()));
    for (let i = 0; i < intencoes.length; i++) {
      const item = intencoes[i];
      if (!item) continue;
      const cidadeAtual = item.origem?.cidade || '';
      if (!cidadesPermitidas.has(cidadeAtual)) {
        const cidadeSubstituta = Array.from(destinosPermitidos.keys())[i % destinosPermitidos.size];
        const ufSubstituta = destinosPermitidos.get(cidadeSubstituta) || 'SP';
        item.origem = { cidade: cidadeSubstituta, uf: ufSubstituta };
      }
    }
    const existentes = new Set(intencoes.map(i => `${i?.origem?.cidade || ''}|${i?.origem?.uf || ''}`));
    const usuarios = ['João Silva', 'Maria Souza', 'Carlos Lima', 'Ana Paula', 'Rafael Costa', 'Juliana Alves'];
    let idx = 0;
    for (const [cidade, uf] of destinosPermitidos.entries()) {
      const chave = `${cidade}|${uf}`;
      if (existentes.has(chave)) continue;
      const destinosAlternativos = Array.from(destinosPermitidos.entries()).filter(([c]) => c !== cidade);
      const destinoAlt = destinosAlternativos[idx % destinosAlternativos.length] || [cidade, uf];
      intencoes.push({
        origem: { cidade, uf },
        destino: { cidade: destinoAlt[0], uf: destinoAlt[1] },
        pesoKg: 6000 + ((idx % 6) * 1200),
        tipoCarga: ['Geral', 'Frigorificada', 'Granel', 'Perigosa', 'Container'][idx % 5],
        dataColeta: `2${4 + (idx % 5)}/04/2026`,
        dataEntrega: `2${5 + (idx % 5)}/04/2026`,
        valorPreCarga: 18000 + (idx * 2200),
        usuarioLancador: usuarios[idx % usuarios.length]
      });
      existentes.add(chave);
      idx++;
    }
  }

  private defaultVeiculos(): Veiculo[] {
    return [
      {
        placa: 'ABC1D23',
        localizacao: 'São Paulo',
        tipo: 'Toco',
        frotaNumero: '1075',
        tipoConjunto: 'Toco',
        ultimaDescarga: '24/04/2026',
        destinoCidade: 'Curitiba',
        destinoUf: 'PR',
        coordenador: 'Bruno Ferreira'
      },
      {
        placa: 'DEF4G56',
        localizacao: 'Rio de Janeiro',
        tipo: 'Carreta',
        frotaNumero: '2089',
        tipoConjunto: 'Carreta LS',
        ultimaDescarga: '25/04/2026',
        destinoCidade: 'São Paulo',
        destinoUf: 'SP',
        coordenador: 'Mariana Prado'
      },
      {
        placa: 'JKL7M89',
        localizacao: 'Curitiba',
        tipo: 'VUC',
        frotaNumero: '3124',
        tipoConjunto: 'VUC',
        ultimaDescarga: '26/04/2026',
        destinoCidade: 'Joinville',
        destinoUf: 'SC',
        coordenador: 'Rafael Costa'
      },
      {
        placa: 'PQR1S23',
        localizacao: 'Porto Alegre',
        tipo: 'Leve',
        frotaNumero: '1542',
        tipoConjunto: 'HR',
        ultimaDescarga: '27/04/2026',
        destinoCidade: 'Caxias do Sul',
        destinoUf: 'RS',
        coordenador: 'Ana Paula'
      },
      {
        placa: 'TUV2W34',
        localizacao: 'Belo Horizonte',
        tipo: 'Carreta',
        frotaNumero: '2210',
        tipoConjunto: 'Carreta LS',
        ultimaDescarga: '28/04/2026',
        destinoCidade: 'São Paulo',
        destinoUf: 'SP',
        coordenador: 'João Silva'
      },
      {
        placa: 'XYZ5A67',
        localizacao: 'Salvador',
        tipo: 'Toco',
        frotaNumero: '1987',
        tipoConjunto: 'Toco',
        ultimaDescarga: '29/04/2026',
        destinoCidade: 'Feira de Santana',
        destinoUf: 'BA',
        coordenador: 'Carlos Lima'
      },
      {
        placa: 'BCD8E90',
        localizacao: 'Brasília',
        tipo: 'VUC',
        frotaNumero: '2451',
        tipoConjunto: 'VUC',
        ultimaDescarga: '30/04/2026',
        destinoCidade: 'Anápolis',
        destinoUf: 'GO',
        coordenador: 'Juliana Alves'
      },
      {
        placa: 'FGH3I45',
        localizacao: 'Recife',
        tipo: 'Leve',
        frotaNumero: '1760',
        tipoConjunto: 'Leve',
        ultimaDescarga: '01/05/2026',
        destinoCidade: 'João Pessoa',
        destinoUf: 'PB',
        coordenador: 'Gustavo Araujo'
      },
      {
        placa: 'JKM6N78',
        localizacao: 'Goiânia',
        tipo: 'Carreta',
        frotaNumero: '2333',
        tipoConjunto: 'Carreta LS',
        ultimaDescarga: '02/05/2026',
        destinoCidade: 'Uberlândia',
        destinoUf: 'MG',
        coordenador: 'Patrícia Mendes'
      },
      {
        placa: 'OPQ9R12',
        localizacao: 'Manaus',
        tipo: 'Toco',
        frotaNumero: '1902',
        tipoConjunto: 'Toco',
        ultimaDescarga: '03/05/2026',
        destinoCidade: 'Itacoatiara',
        destinoUf: 'AM',
        coordenador: 'Renata Lopes'
      },
      {
        placa: 'STU3V56',
        localizacao: 'Florianópolis',
        tipo: 'Leve',
        frotaNumero: '1675',
        tipoConjunto: 'Leve',
        ultimaDescarga: '04/05/2026',
        destinoCidade: 'Blumenau',
        destinoUf: 'SC',
        coordenador: 'Eduardo Vieira'
      },
      {
        placa: 'WXY7Z89',
        localizacao: 'Fortaleza',
        tipo: 'VUC',
        frotaNumero: '2144',
        tipoConjunto: 'VUC',
        ultimaDescarga: '05/05/2026',
        destinoCidade: 'Sobral',
        destinoUf: 'CE',
        coordenador: 'Camila Santos'
      }
    ];
  }

  private sampleIntencoes(): IntencaoViagem[] {
    return [
      {
        origem: { uf: 'PR', cidade: 'Curitiba' },
        destino: { uf: 'SP', cidade: 'São Paulo' },
        pesoKg: 12000,
        tipoCarga: 'Geral',
        dataColeta: '10/04/2026',
        dataEntrega: '12/04/2026',
        valorPreCarga: 32000,
        usuarioLancador: 'João Silva'
      },
      {
        origem: { uf: 'SP', cidade: 'São Paulo' },
        destino: { uf: 'PR', cidade: 'Curitiba' },
        pesoKg: 8000,
        tipoCarga: 'Frigorificada',
        dataColeta: '11/04/2026',
        dataEntrega: '13/04/2026',
        valorPreCarga: 18500,
        usuarioLancador: 'Maria Souza'
      },
      {
        origem: { uf: 'SC', cidade: 'Joinville' },
        destino: { uf: 'SC', cidade: 'Florianópolis' },
        pesoKg: 16000,
        tipoCarga: 'Granel',
        dataColeta: '09/04/2026',
        dataEntrega: '14/04/2026',
        valorPreCarga: 41000,
        usuarioLancador: 'Carlos Lima'
      },
      {
        origem: { uf: 'RS', cidade: 'Caxias do Sul' },
        destino: { uf: 'RS', cidade: 'Porto Alegre' },
        pesoKg: 7000,
        tipoCarga: 'Geral',
        dataColeta: '08/04/2026',
        dataEntrega: '09/04/2026',
        valorPreCarga: 15500,
        usuarioLancador: 'Ana Paula'
      },
      {
        origem: { uf: 'SP', cidade: 'São Paulo' },
        destino: { uf: 'MG', cidade: 'Belo Horizonte' },
        pesoKg: 5000,
        tipoCarga: 'Perigosa',
        dataColeta: '12/04/2026',
        dataEntrega: '13/04/2026',
        valorPreCarga: 27800,
        usuarioLancador: 'Rafael Costa'
      },
      {
        origem: { uf: 'BA', cidade: 'Feira de Santana' },
        destino: { uf: 'BA', cidade: 'Salvador' },
        pesoKg: 9000,
        tipoCarga: 'Container',
        dataColeta: '13/04/2026',
        dataEntrega: '16/04/2026',
        valorPreCarga: 36500,
        usuarioLancador: 'Juliana Alves'
      },
      {
        origem: { uf: 'GO', cidade: 'Anápolis' },
        destino: { uf: 'DF', cidade: 'Brasília' },
        pesoKg: 11000,
        tipoCarga: 'Geral',
        dataColeta: '07/04/2026',
        dataEntrega: '11/04/2026',
        valorPreCarga: 43800,
        usuarioLancador: 'Fernando Rocha'
      },
      {
        origem: { uf: 'PB', cidade: 'João Pessoa' },
        destino: { uf: 'PE', cidade: 'Recife' },
        pesoKg: 6000,
        tipoCarga: 'Granel',
        dataColeta: '10/04/2026',
        dataEntrega: '11/04/2026',
        valorPreCarga: 16200,
        usuarioLancador: 'Patrícia Mendes'
      },
      {
        origem: { uf: 'MG', cidade: 'Uberlândia' },
        destino: { uf: 'SP', cidade: 'São Paulo' },
        pesoKg: 14000,
        tipoCarga: 'Frigorificada',
        dataColeta: '09/04/2026',
        dataEntrega: '12/04/2026',
        valorPreCarga: 39200,
        usuarioLancador: 'Rodrigo Nunes'
      },
      {
        origem: { uf: 'AM', cidade: 'Itacoatiara' },
        destino: { uf: 'AM', cidade: 'Manaus' },
        pesoKg: 10000,
        tipoCarga: 'Geral',
        dataColeta: '11/04/2026',
        dataEntrega: '14/04/2026',
        valorPreCarga: 27400,
        usuarioLancador: 'Mariana Prado'
      },
      {
        origem: { uf: 'SC', cidade: 'Blumenau' },
        destino: { uf: 'SC', cidade: 'Florianópolis' },
        pesoKg: 8500,
        tipoCarga: 'Granel',
        dataColeta: '08/04/2026',
        dataEntrega: '12/04/2026',
        valorPreCarga: 23100,
        usuarioLancador: 'Gustavo Araujo'
      },
      {
        origem: { uf: 'CE', cidade: 'Sobral' },
        destino: { uf: 'CE', cidade: 'Fortaleza' },
        pesoKg: 7200,
        tipoCarga: 'Perigosa',
        dataColeta: '13/04/2026',
        dataEntrega: '15/04/2026',
        valorPreCarga: 30900,
        usuarioLancador: 'Letícia Moraes'
      },
      {
        origem: { uf: 'AL', cidade: 'Maceió' },
        destino: { uf: 'SE', cidade: 'Aracaju' },
        pesoKg: 9500,
        tipoCarga: 'Container',
        dataColeta: '10/04/2026',
        dataEntrega: '11/04/2026',
        valorPreCarga: 28800,
        usuarioLancador: 'Bruno Ferreira'
      },
      {
        origem: { uf: 'PI', cidade: 'Teresina' },
        destino: { uf: 'MA', cidade: 'São Luís' },
        pesoKg: 6800,
        tipoCarga: 'Geral',
        dataColeta: '09/04/2026',
        dataEntrega: '11/04/2026',
        valorPreCarga: 19400,
        usuarioLancador: 'Renata Lopes'
      },
      {
        origem: { uf: 'TO', cidade: 'Palmas' },
        destino: { uf: 'GO', cidade: 'Goiânia' },
        pesoKg: 12300,
        tipoCarga: 'Granel',
        dataColeta: '07/04/2026',
        dataEntrega: '10/04/2026',
        valorPreCarga: 33600,
        usuarioLancador: 'Eduardo Vieira'
      },
      {
        origem: { uf: 'RS', cidade: 'Porto Alegre' },
        destino: { uf: 'SP', cidade: 'Campinas' },
        pesoKg: 13200,
        tipoCarga: 'Frigorificada',
        dataColeta: '12/04/2026',
        dataEntrega: '15/04/2026',
        valorPreCarga: 41800,
        usuarioLancador: 'Camila Santos'
      }
    ];
  }

  isVeiculoProximoDaOrigem(veiculo: Veiculo, intencao: IntencaoViagem): boolean {
    if (!veiculo || !intencao || !intencao.origem) return false;
    const origemUF = (intencao.origem.uf || '').toUpperCase();
    const origemCidade = (intencao.origem.cidade || '').toLowerCase();
    const destCidade = (veiculo.destinoCidade || '').toLowerCase();
    const destUf = (veiculo.destinoUf || CITY_TO_UF[veiculo.destinoCidade || ''] || '').toUpperCase();

    if (origemUF && destUf && origemUF === destUf) return true;
    if (origemCidade && destCidade && origemCidade === destCidade) return true;
    return false;
  }

  isIntencaoProximaDoDestinoVeiculo(intencao: IntencaoViagem, veiculo: Veiculo): boolean {
    if (!veiculo || !intencao || !intencao.origem) return false;
    const origemUF = (intencao.origem.uf || '').toUpperCase();
    const origemCidade = (intencao.origem.cidade || '').toLowerCase();
    const destCidade = (veiculo.destinoCidade || '').toLowerCase();
    const destUf = (veiculo.destinoUf || CITY_TO_UF[veiculo.destinoCidade || ''] || '').toUpperCase();

    if (origemUF && destUf && origemUF === destUf) return true;
    if (origemCidade && destCidade && origemCidade === destCidade) return true;
    return false;
  }

  getVehicleCapacityKg(v: Veiculo): number {
    const tipo = (v.tipo || '').toLowerCase();
    const capacityMap: Record<string, number> = {
      carreta: 30000,
      toco: 16000,
      vuc: 8000,
      leve: 5000
    };
    return capacityMap[tipo] || 10000;
  }
}
