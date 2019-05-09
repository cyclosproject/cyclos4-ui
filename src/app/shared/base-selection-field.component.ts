import { ControlContainer } from '@angular/forms';
import { BaseFormFieldWithOptionsComponent } from 'app/shared/base-form-field-with-options.component';
import { ViewChild, ElementRef, OnDestroy, OnInit, Input, Injector } from '@angular/core';
import { BsDropdownDirective } from 'ngx-bootstrap/dropdown';
import { BehaviorSubject, Subscription } from 'rxjs';
import { empty } from 'app/shared/helper';
import { FieldOption, fieldOptionMatches } from 'app/shared/field-option';
import { LayoutService } from 'app/shared/layout.service';
import { Escape } from 'app/shared/shortcut.service';

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

  layout: LayoutService;

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
    this.layout = injector.get(LayoutService);
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
    this.layout.setFocusTrap(this.dropdownMenuId);
    this.addShortcut(Escape, () => this.close());

    const toggle = <HTMLElement>this.toggleRef.nativeElement;
    const rect = toggle.getBoundingClientRect();
    const docHeight = (window.innerHeight || document.documentElement.clientHeight);
    this.dropdown.dropup = rect.bottom > docHeight - 100;
    // Workaround: ngx-bootstrap sets top sometimes when we set dropup, which causes a position error
    setTimeout(() => this.menuRef.nativeElement.style.top = '', 1);
  }

  onHidden() {
    this.layout.setFocusTrap(null);
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

  get dropdownMenuId() {
    return `dropdown-menu-${this.id}`;
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
