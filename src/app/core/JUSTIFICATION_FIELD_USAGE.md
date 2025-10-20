# JustificationField Component - Guia de Uso

## Visão Geral

O `JustificationFieldComponent` é um componente reutilizável para campos de justificativa com visual moderno e funcionalidades avançadas como contador de caracteres, validação e diferentes configurações pré-definidas.

## Localização dos Arquivos

```
src/app/core/
├── justification-field.component.ts      # Componente principal
├── justification-field.component.scss    # Estilos do componente
├── justification-field.component.html    # Template HTML
└── justification-field.types.ts          # Interfaces e presets
```

## Como Usar

### 1. Importação Básica

```typescript
import { JustificationFieldComponent } from '../../core/justification-field.component';
import { JustificationConfig, JustificationPresets } from '../../core/justification-field.types';

@Component({
  // ...
  imports: [CommonModule, FormsModule, JustificationFieldComponent]
})
export class SeuComponent {
  justificationText = '';
  
  // Configuração personalizada
  justificationConfig: JustificationConfig = {
    label: 'Justificativa',
    placeholder: 'Digite sua justificativa...',
    required: true,
    maxLength: 500,
    helpText: 'Esta informação será registrada no sistema.'
  };
}
```

### 2. Template HTML

```html
<!-- Uso básico -->
<app-justification-field
  [(ngModel)]="justificationText"
  [config]="justificationConfig">
</app-justification-field>

<!-- Com eventos personalizados -->
<app-justification-field
  [(ngModel)]="justificationText"
  [config]="justificationConfig"
  [errorMessage]="errorMessage"
  (valueChange)="onJustificationChange($event)"
  (focus)="onFocus()"
  (blur)="onBlur()">
</app-justification-field>
```

## Configurações Pré-definidas (Presets)

### Presets Disponíveis

```typescript
// Para bloqueio/desbloqueio de usuários
justificationConfig = JustificationPresets.userBlock;

// Para aprovação de documentos
justificationConfig = JustificationPresets.documentApproval;

// Para cancelamentos
justificationConfig = JustificationPresets.cancellation;

// Para feedback
justificationConfig = JustificationPresets.feedback;

// Para relatórios de problemas
justificationConfig = JustificationPresets.problemReport;
```

### Personalizando um Preset

```typescript
justificationConfig: JustificationConfig = {
  ...JustificationPresets.userBlock,
  helpText: 'Texto de ajuda personalizado',
  maxLength: 300,
  size: 'large'
};
```

## Interface JustificationConfig

```typescript
interface JustificationConfig {
  label: string;                    // Texto do label
  placeholder: string;              // Placeholder do textarea
  maxLength: number;               // Limite de caracteres
  height?: string;                 // Altura personalizada
  required?: boolean;              // Campo obrigatório
  rows?: number;                   // Número de linhas
  helpText?: string;               // Texto de ajuda
  size?: 'small' | 'medium' | 'large';  // Tamanho do campo
  disabled?: boolean;              // Campo desabilitado
}
```

## Propriedades do Componente

### Inputs
- `config: JustificationConfig` - Configuração do campo
- `errorMessage?: string` - Mensagem de erro personalizada
- `value: string` - Valor do campo (usado com ngModel)

### Outputs
- `valueChange: EventEmitter<string>` - Emitido quando o valor muda
- `focus: EventEmitter<void>` - Emitido quando o campo recebe foco
- `blur: EventEmitter<void>` - Emitido quando o campo perde foco
- `input: EventEmitter<Event>` - Emitido a cada input do usuário

## Validadores Disponíveis

```typescript
import { JustificationValidators } from '../../core/justification-field.types';

// Validação de comprimento mínimo
const minLengthValidator = JustificationValidators.minLength(10);

// Validação para não aceitar apenas espaços
const notOnlySpacesValidator = JustificationValidators.notOnlySpaces();

// Validação de palavras proibidas
const forbiddenWordsValidator = JustificationValidators.forbiddenWords(['spam', 'teste']);

// Validação de formato profissional
const professionalFormatValidator = JustificationValidators.professionalFormat();
```

## Exemplos de Uso Completos

### Exemplo 1: Modal de Bloqueio de Usuário

```typescript
// Component
export class UserManagementComponent {
  justificationText = '';
  
  justificationConfig: JustificationConfig = {
    ...JustificationPresets.userBlock,
    helpText: 'Esta ação será registrada no histórico do usuário.'
  };
  
  onBlockUser() {
    if (this.justificationText.trim().length < 10) {
      // Mostrar erro
      return;
    }
    // Processar bloqueio
  }
}
```

```html
<!-- Template -->
<div class="modal-body">
  <div class="user-info">
    <p>Bloqueando usuário: <strong>{{ selectedUser.name }}</strong></p>
  </div>
  
  <app-justification-field
    [(ngModel)]="justificationText"
    [config]="justificationConfig">
  </app-justification-field>
</div>

<div class="modal-actions">
  <button (click)="closeModal()">Cancelar</button>
  <button 
    (click)="onBlockUser()" 
    [disabled]="!justificationText.trim()">
    Confirmar Bloqueio
  </button>
</div>
```

### Exemplo 2: Aprovação de Documento

```typescript
export class DocumentApprovalComponent {
  approvalText = '';
  
  approvalConfig: JustificationConfig = {
    ...JustificationPresets.documentApproval,
    size: 'large',
    helpText: 'Descreva os critérios utilizados para aprovação.'
  };
}
```

### Exemplo 3: Configuração Totalmente Personalizada

```typescript
export class CustomFormComponent {
  feedbackText = '';
  
  customConfig: JustificationConfig = {
    label: 'Observações Adicionais',
    placeholder: 'Compartilhe suas observações sobre este processo...',
    maxLength: 1000,
    required: false,
    rows: 6,
    size: 'large',
    helpText: 'Suas observações nos ajudam a melhorar nossos processos.'
  };
  
  onFeedbackChange(value: string) {
    console.log('Feedback atualizado:', value);
  }
}
```

## Estilos e Temas

O componente suporta diferentes temas e tamanhos:

### Tamanhos Disponíveis
- `small`: Campo compacto para espaços reduzidos
- `medium`: Tamanho padrão (default)
- `large`: Campo expandido para textos longos

### Modo Escuro
O componente automaticamente se adapta ao modo escuro quando a classe `dark-mode` está presente no body.

## Acessibilidade

O componente inclui:
- Labels apropriados para screen readers
- Indicação visual de campos obrigatórios
- Estados de foco bem definidos
- Mensagens de erro acessíveis

## Migração de Campos Existentes

Para migrar um campo de justificativa existente:

1. **Remova o HTML manual:**
```html
<!-- ANTES -->
<div class="justification-field">
  <label>
    Justificativa <span class="required">*</span>
    <textarea [(ngModel)]="text" placeholder="..."></textarea>
    <div class="counter">{{ text.length }}/500</div>
  </label>
</div>
```

2. **Substitua pelo componente:**
```html
<!-- DEPOIS -->
<app-justification-field
  [(ngModel)]="text"
  [config]="justificationConfig">
</app-justification-field>
```

3. **Configure no TypeScript:**
```typescript
justificationConfig: JustificationConfig = {
  label: 'Justificativa',
  placeholder: '...',
  required: true,
  maxLength: 500
};
```

## Troubleshooting

### Problema: Componente não aparece
**Solução:** Verifique se o `JustificationFieldComponent` está importado no array `imports` do seu componente.

### Problema: ngModel não funciona
**Solução:** Certifique-se de que o `FormsModule` está importado.

### Problema: Estilos não aplicados
**Solução:** Verifique se não há conflitos de CSS e se o componente está sendo usado corretamente.

---

## Suporte

Para dúvidas ou problemas com o componente, consulte os exemplos acima ou verifique a implementação em `gestao-motoristas.component.ts` como referência.