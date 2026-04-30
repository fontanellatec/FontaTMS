import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface EnderecoParcial {
  uf: string;
  cidade: string;
}

interface EnderecoCompleto extends EnderecoParcial {
  rua?: string;
  numero?: string;
  bairro?: string;
  complemento?: string;
}

interface IntencaoViagem {
  origem: EnderecoCompleto;
  destino: EnderecoCompleto;
  pesoKg: number;
  tipoCarga?: string;
  dataColeta?: string; // yyyy-MM-dd
  dataEntrega?: string; // yyyy-MM-dd
  observacoes?: string;
}

@Component({
  selector: 'app-intencao-viagem',
  templateUrl: './intencao-viagem.component.html',
  styleUrls: ['./intencao-viagem.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class IntencaoViagemComponent {
  // Form model
  form: IntencaoViagem = {
    origem: { uf: '', cidade: '' },
    destino: { uf: '', cidade: '' },
    pesoKg: 0,
    tipoCarga: '',
    dataColeta: '',
    dataEntrega: '',
    observacoes: ''
  };

  // UI state
  origemEnderecoCompleto = false;
  destinoEnderecoCompleto = false;
  enviadoComSucesso = false;
  erroMsg = '';

  ufs = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];
  tiposCarga = ['Geral', 'Frigorificada', 'Perigosa', 'Granel', 'Container'];

  private storageKey = 'intencoesViagem';

  onSubmit(): void {
    this.enviadoComSucesso = false;
    this.erroMsg = '';
    if (!this.form.origem.uf || !this.form.origem.cidade) {
      this.erroMsg = 'Origem: informe UF e cidade.';
      return;
    }
    if (!this.form.destino.uf || !this.form.destino.cidade) {
      this.erroMsg = 'Destino: informe UF e cidade.';
      return;
    }
    if (!this.form.pesoKg || this.form.pesoKg <= 0) {
      this.erroMsg = 'Peso (kg): informe um valor maior que 0.';
      return;
    }

    // Persistência simples em localStorage
    const atual = this.getStorage();
    atual.push({ ...this.form });
    localStorage.setItem(this.storageKey, JSON.stringify(atual));
    this.enviadoComSucesso = true;
    // Reset básico mantendo UF/cidade para agilizar múltiplos cadastros
    this.form = {
      origem: { uf: this.form.origem.uf, cidade: this.form.origem.cidade },
      destino: { uf: this.form.destino.uf, cidade: this.form.destino.cidade },
      pesoKg: 0,
      tipoCarga: '',
      dataColeta: '',
      dataEntrega: '',
      observacoes: ''
    };
  }

  getStorage(): IntencaoViagem[] {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw) as IntencaoViagem[] : [];
    } catch {
      return [];
    }
  }
}