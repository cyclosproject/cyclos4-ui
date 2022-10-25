import { Directive, ElementRef, Injector, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ControlContainer } from '@angular/forms';
import { BaseFormFieldWithOptionsComponent } from 'app/shared/base-form-field-with-options.component';
import { FieldOption, fieldOptionMatches } from 'app/shared/field-option';
import { empty, truthyAttr } from 'app/shared/helper';
import { LayoutService } from 'app/core/layout.service';
import { Escape } from 'app/core/shortcut.service';
import { BsDropdownDirective } from 'ngx-bootstrap/dropdown';
import { BehaviorSubject, Subscription } from 'rxjs';

/**
 * Base class for single / multi selection fields
 */
@Directive()
export abstract class BaseSelectionFieldComponent<T> extends BaseFormFieldWithOptionsComponent<T> implements OnInit, OnDestroy {
  /** When set, the displayed text */
  @Input() display: string;

  _dropdownOnRight: boolean | string = false;
  @Input() get dropdownOnRight(): boolean | string {
    return this._dropdownOnRight;
  }
  set dropdownOnRight(flag: boolean | string) {
    this._dropdownOnRight = truthyAttr(flag);
  }

  @ViewChild('toggleButton') toggleRef: ElementRef;
  @ViewChild('dropdown') dropdown: BsDropdownDirective;

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
    controlContainer: ControlContainer,
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
    return ((this.toggleRef || {}) as any).nativeElement;
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

    const toggle = this.toggleRef.nativeElement as HTMLElement;
    const rect = toggle.getBoundingClientRect();
    const docHeight = (window.innerHeight || document.documentElement.clientHeight);
    this.dropdown.dropup = rect.bottom > docHeight - 100;

    // To manipulate the menu, we need to give time to ngx-bootstrap to append it to the body
    setTimeout(() => {
      const menu = document.getElementById(this.dropdownMenuId);

      // Workaround: ngx-bootstrap sets top sometimes when we set dropup, which causes a position error
      menu.style.top = '';

      // Make sure the menu is at least the same width as the container
      const container = this.toggleRef.nativeElement as HTMLElement;
      menu.style.minWidth = `${container.getBoundingClientRect().width}px`;
      menu.style.visibility = 'visible';
    });
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

  resolveStyle(option: FieldOption, hasCategory: boolean) {
    return option.style + ' level' + (hasCategory ? option.level || 0 : 0);
  }

  /**
   * Must be implemented to indicate whether the field has an empty option in the beginning.
   */
  protected abstract hasEmptyOption(): boolean;
}
