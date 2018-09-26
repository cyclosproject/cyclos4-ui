import { ControlContainer } from '@angular/forms';
import { BaseFormFieldWithOptionsComponent } from 'app/shared/base-form-field-with-options.component';
import { ViewChild, ElementRef, OnDestroy, OnInit, Input } from '@angular/core';
import { BsDropdownDirective } from 'ngx-bootstrap/dropdown';
import { BehaviorSubject, Subscription } from 'rxjs';
import { empty } from 'app/shared/helper';
import { FieldOption } from 'app/shared/field-option';

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

  constructor(protected controlContainer: ControlContainer) {
    super(controlContainer);
  }

  ngOnInit() {
    super.ngOnInit();
    this.valueSub = this.formControl.valueChanges.subscribe(() => this.updateDisplay());
  }

  onValueInitialized() {
    this.updateDisplay();
  }

  ngOnDestroy(): void {
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
    if (!empty(selected) && selected.includes(option.value)) {
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
}
