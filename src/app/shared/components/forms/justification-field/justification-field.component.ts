import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JustificationConfig } from '../../../../core/types/justification-field.types';

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
  templateUrl: './justification-field.component.html',
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
    const currentLength = this.value.length;
    return currentLength > maxLength * 0.8;
  }

  get isOverLimit(): boolean {
    const maxLength = this.config.maxLength || 500;
    const currentLength = this.value.length;
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
