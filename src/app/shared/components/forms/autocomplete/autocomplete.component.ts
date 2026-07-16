import { Component, Input, OnInit, OnDestroy, forwardRef, ElementRef, HostListener, ViewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Observable, Subscription, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, tap, finalize } from 'rxjs/operators';
import { AutocompleteSearchService } from '@core/services/autocomplete-search.service';

@Component({
  selector: 'app-autocomplete',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AutocompleteComponent),
      multi: true
    }
  ],
  templateUrl: './autocomplete.component.html',
  styleUrls: ['./autocomplete.component.scss']
})
export class AutocompleteComponent implements OnInit, OnDestroy, ControlValueAccessor {
  @Input() label: string = '';
  @Input() placeholder: string = 'Pesquise ou selecione...';
  @Input() searchFn?: (term: string) => Observable<{ value: any; label: string; subtitle?: string }[]>;
  @Input() searchType?: 'veiculo' | 'coordenador' | 'motorista' | 'cidade';
  @Input() options: { value: any; label: string; subtitle?: string }[] = [];
  @Input() debounceTimeMs: number = 300;

  @ViewChild('inputEl') inputEl!: ElementRef<HTMLInputElement>;
  @ViewChild('dropdownEl') dropdownEl?: ElementRef<HTMLDivElement>;

  value: any = null;
  searchTerm: string = '';
  displayLabel: string = '';
  filteredOptions: { value: any; label: string; subtitle?: string }[] = [];
  isOpen: boolean = false;
  isLoading: boolean = false;
  activeIndex: number = -1;

  private searchTerm$ = new Subject<string>();
  private searchSubscription?: Subscription;
  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(
    private elementRef: ElementRef,
    private searchService: AutocompleteSearchService
  ) {}

  ngOnInit(): void {
    this.searchSubscription = this.searchTerm$
      .pipe(
        debounceTime(this.debounceTimeMs),
        distinctUntilChanged(),
        switchMap((term: string) => {
          // Trava de mínimo 3 caracteres para efetuar a busca
          if (!term || term.length < 3) {
            this.isLoading = false;
            return of([]);
          }

          this.isLoading = true;
          this.isOpen = true;

          if (this.searchType) {
            return this.searchService.search(this.searchType, term).pipe(
              finalize(() => {
                this.isLoading = false;
              })
            );
          } else if (this.searchFn) {
            return this.searchFn(term).pipe(
              finalize(() => {
                this.isLoading = false;
              })
            );
          } else {
            // Filtragem local
            const termLower = term.toLowerCase();
            const results = this.options.filter(opt =>
              opt.label.toLowerCase().includes(termLower) ||
              (opt.subtitle && opt.subtitle.toLowerCase().includes(termLower))
            );
            this.isLoading = false;
            return of(results);
          }
        })
      )
      .subscribe({
        next: (results) => {
          this.filteredOptions = results || [];
          this.activeIndex = -1;
        },
        error: (err) => {
          console.error('Erro na busca do autocomplete:', err);
          this.filteredOptions = [];
          this.isLoading = false;
        }
      });
  }

  ngOnDestroy(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  // Escutar clique fora do componente para fechar o dropdown
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeDropdown();
    }
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const term = target.value;
    this.searchTerm = term;
    
    // Se o usuário limpar o texto, removemos a seleção
    if (!term) {
      this.clearSelection();
      this.isOpen = false;
    } else if (term.length >= 3) {
      this.isOpen = true;
      this.searchTerm$.next(term);
    } else {
      this.isOpen = false;
      this.filteredOptions = [];
    }
  }

  onFocus(): void {
    this.onTouched();
    // Apenas busca e abre se tiver pelo menos 3 caracteres digitados
    if (this.searchTerm && this.searchTerm.length >= 3) {
      this.isOpen = true;
      this.searchTerm$.next(this.searchTerm);
    }
  }

  selectOption(option: { value: any; label: string; subtitle?: string }): void {
    this.value = option.value;
    this.displayLabel = option.label;
    this.searchTerm = option.label;
    this.onChange(this.value);
    this.closeDropdown();
  }

  clearSelection(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.value = null;
    this.displayLabel = '';
    this.searchTerm = '';
    this.filteredOptions = [];
    this.onChange(null);
    this.activeIndex = -1;
    this.closeDropdown();
  }

  closeDropdown(): void {
    this.isOpen = false;
    this.activeIndex = -1;
    // Se não há valor selecionado, limpa o termo digitado. Caso contrário, restaura o rótulo selecionado.
    if (this.value === null || this.value === undefined || this.value === '') {
      this.searchTerm = '';
    } else {
      this.searchTerm = this.displayLabel;
    }
  }

  // Manipulação de eventos de teclado para navegação acessível e premium
  onKeyDown(event: KeyboardEvent): void {
    if (!this.isOpen) {
      if ((event.key === 'ArrowDown' || event.key === 'Enter') && this.searchTerm.length >= 3) {
        this.isOpen = true;
        this.searchTerm$.next(this.searchTerm);
        event.preventDefault();
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (this.filteredOptions.length > 0) {
          this.activeIndex = (this.activeIndex + 1) % this.filteredOptions.length;
          setTimeout(() => this.adjustScroll());
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (this.filteredOptions.length > 0) {
          this.activeIndex = this.activeIndex <= 0 
            ? this.filteredOptions.length - 1 
            : this.activeIndex - 1;
          setTimeout(() => this.adjustScroll());
        }
        break;
      case 'Enter':
        event.preventDefault();
        if (this.activeIndex >= 0 && this.activeIndex < this.filteredOptions.length) {
          this.selectOption(this.filteredOptions[this.activeIndex]);
        }
        break;
      case 'Escape':
        event.preventDefault();
        this.closeDropdown();
        this.inputEl.nativeElement.blur();
        break;
      case 'Tab':
        this.closeDropdown();
        break;
    }
  }

  // ControlValueAccessor
  writeValue(value: any): void {
    this.value = value;
    if (value === null || value === undefined || value === '') {
      this.displayLabel = '';
      this.searchTerm = '';
    } else {
      const found = this.options.find(opt => opt.value === value);
      if (found) {
        this.displayLabel = found.label;
        this.searchTerm = found.label;
      } else {
        if (typeof value === 'string' && value.includes('||')) {
          const parts = value.split('||');
          this.displayLabel = parts[1] || value;
          this.searchTerm = parts[1] || value;
        } else {
          this.displayLabel = value;
          this.searchTerm = value;
        }
      }
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    if (this.inputEl) {
      this.inputEl.nativeElement.disabled = isDisabled;
    }
  }

  private adjustScroll(): void {
    if (!this.dropdownEl) return;
    const dropdown = this.dropdownEl.nativeElement;
    const options = dropdown.querySelectorAll('.autocomplete-option');
    const activeOption = options[this.activeIndex] as HTMLElement;

    if (!activeOption) return;

    const dropdownHeight = dropdown.clientHeight;
    const dropdownScrollTop = dropdown.scrollTop;
    const optionTop = activeOption.offsetTop;
    const optionHeight = activeOption.clientHeight;

    if (optionTop < dropdownScrollTop) {
      dropdown.scrollTop = optionTop;
    } else if (optionTop + optionHeight > dropdownScrollTop + dropdownHeight) {
      dropdown.scrollTop = optionTop + optionHeight - dropdownHeight;
    }
  }
}
