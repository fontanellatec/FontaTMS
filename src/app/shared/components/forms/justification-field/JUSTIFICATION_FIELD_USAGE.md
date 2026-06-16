# JustificationField Component - Guia de Uso

## Visão Geral

O `JustificationFieldComponent` é um componente reutilizável para campos de justificativa com visual moderno e funcionalidades avançadas como contador de caracteres, validação e diferentes configurações pré-definidas.

## Localização dos Arquivos

```text
src/app/shared/components/forms/justification-field/
├── justification-field.component.ts      # Componente principal
├── justification-field.component.scss    # Estilos do componente
├── justification-field.component.html    # Template HTML
└── JUSTIFICATION_FIELD_USAGE.md          # Este guia de uso

src/app/core/types/
└── justification-field.types.ts          # Interfaces, presets e validadores
```

## Como Usar

### 1. Importação Básica

```typescript
import { JustificationFieldComponent } from '../../shared/components/forms/justification-field/justification-field.component';
import { JustificationConfig, JustificationPresets } from '../../core/types/justification-field.types';

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
import { JustificationValidators } from '../../core/types/justification-field.types';

// Validação de comprimento mínimo
const minLengthValidator = JustificationValidators.minLength(10);

// Validação para não aceitar apenas espaços
const notOnlySpacesValidator = JustificationValidators.notOnlySpaces();

// Validação de palavras proibidas
const forbiddenWordsValidator = JustificationValidators.forbiddenWords(['spam', 'teste']);

// Validação de formato profissional
const professionalFormatValidator = JustificationValidators.professionalFormat();
```
