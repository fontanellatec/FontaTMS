import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JustificationConfig } from './justification-field.types';

@Component({
  selector: 'app-justification-field',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => JustificationFieldComponent),
      multi: true
    }
  ],
  template: `
    <div class="justification-field">
      <label class="field-label">
        <span class="label-text">
          {{ config.label || 'Justificativa' }}
          <span class="required" *ngIf="config.required !== false">*</span>
        </span>
        <p class="help-text" *ngIf="config.helpText">{{ config.helpText }}</p>
        <div class="textarea-container" [class.error]="hasError">
          <textarea 
            [(ngModel)]="value"
            [placeholder]="config.placeholder || 'Digite a justificativa...'"
            class="justification-textarea"
            [maxlength]="config.maxLength || 500"
            [rows]="config.rows || 4"
            [style.min-height]="config.minHeight || '120px'"
            (input)="onInput($event)"
            (blur)="onBlur()"
            (focus)="onFocus()">
          </textarea>
          <div class="character-counter" *ngIf="config.showCounter !== false">
            <span class="counter-text" [class.warning]="isNearLimit" [class.error]="isOverLimit">
              {{ value?.length || 0 }}/{{ config.maxLength || 500 }}
            </span>
          </div>
        </div>
        <div class="error-message" *ngIf="errorMessage">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          {{ errorMessage }}
        </div>
      </label>
    </div>
  `,
  styleUrls: ['./justification-field.component.scss']
})
export class JustificationFieldComponent implements ControlValueAccessor {
  @Input() config: JustificationConfig = {};
  @Input() errorMessage: string = '';
  @Output() valueChange = new EventEmitter<string>();
  @Output() focus = new EventEmitter<void>();
  @Output() blur = new EventEmitter<void>();

  value: string = '';
  private onChange = (value: string) => {};
  private onTouched = () => {};

  get hasError(): boolean {
    return !!this.errorMessage;
  }

  get isNearLimit(): boolean {
    const maxLength = this.config.maxLength || 500;
    const currentLength = this.value?.length || 0;
    return currentLength > maxLength * 0.8;
  }

  get isOverLimit(): boolean {
    const maxLength = this.config.maxLength || 500;
    const currentLength = this.value?.length || 0;
    return currentLength > maxLength;
  }

  onInput(event: any): void {
    this.value = event.target.value;
    this.onChange(this.value);
    this.valueChange.emit(this.value);
  }

  onFocus(): void {
    this.focus.emit();
  }

  onBlur(): void {
    this.onTouched();
    this.blur.emit();
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    this.value = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    // Implementar se necessário
  }
}