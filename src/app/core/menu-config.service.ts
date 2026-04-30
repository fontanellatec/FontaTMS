import { Injectable } from '@angular/core';

export type MenuKey =
  | 'dashboard'
  | 'drivers'
  | 'gestao-motoristas'
  | 'jornada'
  | 'vehicles'
  | 'controle-frota'
  | 'precificacao-abastecimento'
  | 'acerto-viagem'
  | 'rastreamento'
  | 'programacao'
  | 'manutencao'
  | 'producao-oficina'
  | 'intencao-viagem'
  | 'controle-intencao-viagem'
  | 'shipments'
  | 'frete-terceiro'
  | 'controle-colaboradores'
  | 'contratos'
  | 'financeiro'
  | 'timeline-logistica'
  | 'torre-controle';

export interface MenuItem {
  key: MenuKey;
  label: string;
  path: string;
}

const STORAGE_KEY = 'menuEnabledKeys';
const STORAGE_VERSION_KEY = 'menuEnabledKeysVersion';
const CURRENT_MENU_VERSION = 2;
const LEGACY_KEYS_MAP: Record<string, MenuKey> = {
  // migração de chaves antigas para novas
  'embarque': 'intencao-viagem',
  'controle-embarques': 'controle-intencao-viagem'
};

@Injectable({ providedIn: 'root' })
export class MenuConfigService {
  private readonly defaultEnabled: MenuKey[] = [
    'torre-controle',
    'gestao-motoristas',
    'controle-frota',
    'rastreamento',
    'programacao',
    'controle-intencao-viagem',
    'timeline-logistica'
  ];
  private readonly allItems: MenuItem[] = [
    { key: 'dashboard', label: 'Dashboard', path: '/dashboard' },
    { key: 'drivers', label: 'Motoristas', path: '/drivers' },
    { key: 'gestao-motoristas', label: 'Gestão de Motoristas', path: '/gestao-motoristas' },
    { key: 'jornada', label: 'Jornada', path: '/jornada' },
    { key: 'vehicles', label: 'Veículos', path: '/vehicles' },
    { key: 'controle-frota', label: 'Controle de Frota', path: '/controle-frota' },
    { key: 'precificacao-abastecimento', label: 'Abastecimento', path: '/precificacao-abastecimento' },
    { key: 'acerto-viagem', label: 'Acerto de Viagem', path: '/acerto-viagem' },
    { key: 'rastreamento', label: 'Rastreamento', path: '/rastreamento' },
    { key: 'torre-controle', label: 'Torre de Controle', path: '/torre-controle' },
    { key: 'programacao', label: 'Programação', path: '/programacao' },
    { key: 'manutencao', label: 'Manutenção', path: '/manutencao' },
    { key: 'producao-oficina', label: 'Produção Oficina', path: '/producao-oficina' },
    { key: 'intencao-viagem', label: 'Intenção de Viagem', path: '/intencao-viagem' },
    { key: 'controle-intencao-viagem', label: 'Controle de Pré-Carga', path: '/controle-intencao-viagem' },
    { key: 'shipments', label: 'Intenção de Viagem', path: '/shipments' },
    { key: 'frete-terceiro', label: 'Frete Terceiro', path: '/frete-terceiro' },
    { key: 'controle-colaboradores', label: 'Controle de Colaboradores', path: '/controle-colaboradores' },
    { key: 'contratos', label: 'Contratos', path: '/contratos' },
    { key: 'financeiro', label: 'Financeiro', path: '/financeiro' },
    { key: 'timeline-logistica', label: 'Timeline Logística', path: '/timeline-logistica' },
  ];

  getAllMenuItems(): MenuItem[] {
    return this.allItems;
  }

  private getStoredKeys(): MenuKey[] | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as MenuKey[]) : null;
    } catch {
      return null;
    }
  }

  private migrateStoredKeys(keys: MenuKey[] | null): MenuKey[] | null {
    if (!keys) return null;
    let changed = false;
    const set = new Set<string>(keys as unknown as string[]);
    for (const legacy in LEGACY_KEYS_MAP) {
      if (set.has(legacy)) {
        set.delete(legacy);
        set.add(LEGACY_KEYS_MAP[legacy]);
        changed = true;
      }
    }
    const storedVersion = Number(localStorage.getItem(STORAGE_VERSION_KEY) ?? '1');
    if (storedVersion < CURRENT_MENU_VERSION && !set.has('timeline-logistica')) {
      set.add('timeline-logistica');
      changed = true;
    }
    const next = Array.from(set) as MenuKey[];
    localStorage.setItem(STORAGE_VERSION_KEY, String(CURRENT_MENU_VERSION));
    if (changed) this.storeKeys(next);
    return next;
  }

  private storeKeys(keys: MenuKey[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
    localStorage.setItem(STORAGE_VERSION_KEY, String(CURRENT_MENU_VERSION));
  }

  getEnabledMap(): Record<MenuKey, boolean> {
    const stored = this.migrateStoredKeys(this.getStoredKeys());
    if (!stored) {
      const set = new Set<MenuKey>(this.defaultEnabled);
      return this.allItems.reduce((acc, item) => {
        acc[item.key] = set.has(item.key);
        return acc;
      }, {} as Record<MenuKey, boolean>);
    }

    // Quando houver configuração: somente chaves presentes em 'stored' ficam visíveis
    const set = new Set<MenuKey>(stored);
    return this.allItems.reduce((acc, item) => {
      acc[item.key] = set.has(item.key);
      return acc;
    }, {} as Record<MenuKey, boolean>);
  }

  isEnabled(key: MenuKey): boolean {
    return this.getEnabledMap()[key] ?? true;
  }

  setEnabled(key: MenuKey, enabled: boolean): void {
    const current = this.getStoredKeys() ?? (this.allItems.map(i => i.key) as MenuKey[]);
    const next = new Set<MenuKey>(current);
    if (enabled) {
      next.add(key);
    } else {
      next.delete(key);
    }
    this.storeKeys(Array.from(next));
  }

  setAll(enabled: boolean): void {
    if (enabled) {
      this.storeKeys(this.allItems.map(i => i.key) as MenuKey[]);
    } else {
      this.storeKeys([]);
    }
  }
}
