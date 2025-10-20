/**
 * Configuração para o componente JustificationField
 */
export interface JustificationConfig {
  /** Texto do rótulo do campo */
  label?: string;
  
  /** Texto de placeholder */
  placeholder?: string;
  
  /** Número máximo de caracteres permitidos */
  maxLength?: number;
  
  /** Altura mínima do textarea */
  minHeight?: string;
  
  /** Se o campo é obrigatório (mostra asterisco) */
  required?: boolean;
  
  /** Número de linhas iniciais do textarea */
  rows?: number;
  
  /** Texto de ajuda exibido abaixo do rótulo */
  helpText?: string;
  
  /** Tamanho do componente */
  size?: 'sm' | 'md' | 'lg';
  
  /** Se o campo está desabilitado */
  disabled?: boolean;
}

/**
 * Eventos emitidos pelo componente JustificationField
 */
export interface JustificationEvents {
  /** Emitido quando o valor muda */
  valueChange: string;
  
  /** Emitido quando o campo recebe foco */
  focus: void;
  
  /** Emitido quando o campo perde foco */
  blur: void;
  
  /** Emitido quando o usuário está digitando */
  input: string;
}

/**
 * Configurações pré-definidas para casos de uso comuns
 */
export const JustificationPresets = {
  /** Para bloqueio/desbloqueio de usuários */
  userBlock: {
    label: 'Justificativa',
    placeholder: 'Descreva detalhadamente o motivo desta ação. Esta informação ficará registrada no histórico...',
    maxLength: 500,
    required: true,
    helpText: 'Esta justificativa será registrada no histórico e não poderá ser alterada posteriormente.'
  } as JustificationConfig,
  
  /** Para aprovação/rejeição de documentos */
  documentApproval: {
    label: 'Observações',
    placeholder: 'Digite suas observações sobre este documento...',
    maxLength: 300,
    required: false,
    helpText: 'Observações opcionais sobre a análise do documento.'
  } as JustificationConfig,
  
  /** Para cancelamento de operações */
  cancellation: {
    label: 'Motivo do Cancelamento',
    placeholder: 'Explique o motivo do cancelamento desta operação...',
    maxLength: 400,
    required: true,
    helpText: 'O motivo do cancelamento será registrado no sistema.'
  } as JustificationConfig,
  
  /** Para feedback geral */
  feedback: {
    label: 'Comentários',
    placeholder: 'Deixe seus comentários...',
    maxLength: 1000,
    required: false,
    rows: 6,
    minHeight: '150px'
  } as JustificationConfig,
  
  /** Para relatórios de problemas */
  problemReport: {
    label: 'Descrição do Problema',
    placeholder: 'Descreva detalhadamente o problema encontrado, incluindo passos para reproduzi-lo...',
    maxLength: 800,
    required: true,
    rows: 5,
    helpText: 'Quanto mais detalhes você fornecer, mais rápido poderemos resolver o problema.'
  } as JustificationConfig
} as const;

/**
 * Validações comuns para campos de justificativa
 */
export class JustificationValidators {
  /**
   * Valida se o texto tem o comprimento mínimo
   */
  static minLength(min: number) {
    return (value: string): string | null => {
      if (!value || value.trim().length < min) {
        return `O texto deve ter pelo menos ${min} caracteres.`;
      }
      return null;
    };
  }
  
  /**
   * Valida se o texto não contém apenas espaços
   */
  static notOnlySpaces(value: string): string | null {
    if (value && value.trim().length === 0) {
      return 'O campo não pode conter apenas espaços em branco.';
    }
    return null;
  }
  
  /**
   * Valida se o texto contém palavras proibidas
   */
  static forbiddenWords(words: string[]) {
    return (value: string): string | null => {
      if (!value) return null;
      
      const lowerValue = value.toLowerCase();
      const foundWord = words.find(word => lowerValue.includes(word.toLowerCase()));
      
      if (foundWord) {
        return `O texto não pode conter a palavra "${foundWord}".`;
      }
      return null;
    };
  }
  
  /**
   * Valida se o texto tem um formato profissional
   */
  static professionalFormat(value: string): string | null {
    if (!value) return null;
    
    // Verifica se tem pelo menos uma letra maiúscula
    if (!/[A-Z]/.test(value)) {
      return 'O texto deve começar com letra maiúscula.';
    }
    
    // Verifica se não é apenas maiúsculas
    if (value === value.toUpperCase() && value.length > 10) {
      return 'Evite escrever todo o texto em maiúsculas.';
    }
    
    return null;
  }
}