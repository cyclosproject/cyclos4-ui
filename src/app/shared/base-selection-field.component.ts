import { ControlContainer } from '@angular/forms';
import { BaseFormFieldWithOptionsComponent } from 'app/shared/base-form-field-with-options.component';
import { ViewChild, ElementRef, OnDestroy, OnInit, Input, Injector } from '@angular/core';
import { BsDropdownDirective } from 'ngx-bootstrap/dropdown';
import { BehaviorSubject, Subscription } from 'rxjs';
import { empty } from 'app/shared/helper';
import { FieldOption, fieldOptionMatches } from 'app/shared/field-option';

const PageSize = 7;

/**
 * Base class for single / multi selection fields
 */
export abstract class BaseSelectionFieldComponent<T> extends BaseFormFieldWithOptionsComponent<T> implements OnInit, OnDestroy {
  /** When set, the displayed text */
  @Input() display: string;

  @ViewChild('toggleButton') toggleRef: ElementRef;
  @ViewChild('dropdown') dropdown: BsDropdownDirective;
  @ViewChild('dropDownMenu') menuRef: ElementRef;
  display$ = new BehaviorSubject('');
  valueSub: Subscription;
  openSub: Subscription;

  _optionIndex = -1;

  get optionIndex() {
    return this._optionIndex;
  }

  set optionIndex(index: number) {
    const options = this.allOptions;
    if (this.hasEmptyOption) {
      options.unshift(null);
    }
    if (options.length === 0) {
      this._optionIndex = -1;
      return;
    }
    this._optionIndex = Math.max(0, Math.min(index, options.length - 1));
    const option = options[this._optionIndex];
    this.focusOption(option);
  }

  constructor(
    injector: Injector,
    controlContainer: ControlContainer
  ) {
    super(injector, controlContainer);
  }

  ngOnInit() {
    super.ngOnInit();
    this.valueSub = this.formControl.valueChanges.subscribe(() => this.updateDisplay());
  }

  onValueInitialized() {
    this.updateDisplay();
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    this.valueSub.unsubscribe();
  }

  protected updateDisplay() {
    this.display$.next(empty(this.display) ? this.getDisplay() : this.display);
  }

  protected abstract getDisplay(): string;

  protected getFocusableControl() {
    return (<any>(this.toggleRef || {})).nativeElement;
  }

  addOption(option: FieldOption) {
    super.addOption(option);
    const selected = this.selectedValues;
    if (!empty(selected) && selected.findIndex(s => fieldOptionMatches(option, s)) >= 0) {
      this.updateDisplay();
    }
  }

  onShown() {
    const toggle = <HTMLElement>this.toggleRef.nativeElement;
    const rect = toggle.getBoundingClientRect();
    const docHeight = (window.innerHeight || document.documentElement.clientHeight);
    this.dropdown.dropup = rect.bottom > docHeight - 100;
    // Workaround: ngx-bootstrap sets top sometimes when we set dropup, which causes a position error
    setTimeout(() => this.menuRef.nativeElement.style.top = '', 1);

    const shortcuts = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', 'Escape'];
    this.addShortcut(shortcuts, event => {
      if (event.key === 'Escape') {
        this.close();
        return;
      }
      if (this.optionIndex < 0) {
        this.optionIndex = 0;
        return;
      }
      switch (event.key) {
        case 'ArrowUp':
          this.optionIndex = this.optionIndex - 1;
          break;
        case 'ArrowDown':
          this.optionIndex = this.optionIndex + 1;
          break;
        case 'PageUp':
          this.optionIndex = this.optionIndex - PageSize;
          break;
        case 'PageDown':
          this.optionIndex = this.optionIndex + PageSize;
          break;
        case 'Home':
          this.optionIndex = 0;
          break;
        case 'End':
          this.optionIndex = Number.MAX_SAFE_INTEGER;
          break;
      }
    });

    // Select the correct option
    setTimeout(() => {
      const selected = this.selectedOptions;
      if (empty(selected)) {
        this.optionIndex = 0;
      } else {
        let index = Math.max(0, this.allOptions.indexOf(selected[0]));
        if (this.hasEmptyOption()) {
          index++;
        }
        this.optionIndex = index;
      }
    }, 5);
  }

  onFocus() {
    const shortcuts = ['Space', 'Enter', 'ArrowDown', 'ArrowUp'];
    this.openSub = this.addShortcut(shortcuts, () => {
      this.open();
    });
  }

  onBlur() {
    if (this.openSub) {
      this.openSub.unsubscribe();
      this.openSub = null;
    }
  }

  onHidden() {
    this.clearShortcuts();
  }

  onDisabledChange(isDisabled: boolean): void {
    if (this.toggleRef && this.toggleRef.nativeElement) {
      this.toggleRef.nativeElement.disabled = isDisabled;
    }
  }

  close() {
    this.dropdown.hide();
  }

  open() {
    this.dropdown.show();
  }

  /**
   * Must be implemented to focus the option widget with the given index
   * @param option The option to be focused
   * @param index The option index
   */
  // protected abstract focusOption(option: FieldOption, index: number);

  protected focusOption(option: FieldOption) {
    const id = this.id + '_' + (option ? option.value : '');
    const element = document.getElementById(id);
    if (element) {
      element.focus();
    }
  }

  /**
   * Must be implemented to indicate whether the field has an empty option in the beginning.
   */
  protected abstract hasEmptyOption(): boolean;
}
