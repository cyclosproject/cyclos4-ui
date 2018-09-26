import {
  Component, Input, Output, EventEmitter, ChangeDetectionStrategy, SkipSelf, Host,
  Optional, ViewChild, ElementRef
} from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlContainer } from '@angular/forms';
import { BaseFormFieldComponent } from 'app/shared/base-form-field.component';

/**
 * Component used to display an regular input field.
 */
@Component({
  selector: 'input-field',
  templateUrl: 'input-field.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: InputFieldComponent, multi: true }
  ]
})
export class InputFieldComponent
  extends BaseFormFieldComponent<string> {

  /** HTML input type */
  @Input() type = 'text';

  /** A placeholder to be shown inside the component */
  @Input() placeholder = '';

  /** Name of the autocomplete value for the HTML input */
  @Input() autocomplete = '';

  /** A mask (pattern) to be applied to the field */
  @Input() mask: string;

  @Output() enter = new EventEmitter<string>();
  @Output() onblur = new EventEmitter<FocusEvent>();
  @Output() onfocus = new EventEmitter<FocusEvent>();

  @ViewChild('input') inputRef: ElementRef;

  constructor(
    @Optional() @Host() @SkipSelf() controlContainer: ControlContainer) {
    super(controlContainer);
  }

  get input(): HTMLInputElement {
    return this.inputRef ? this.inputRef.nativeElement : null;
  }

  onValueInitialized(value: string) {
    // As a workaround to https://github.com/angular/angular/issues/13792, manually update the input value
    const input = this.input;
    if (input) {
      input.value = value;
    }
  }

  onDisabledChange(isDisabled: boolean): void {
    if (this.inputRef && this.inputRef.nativeElement) {
      this.inputRef.nativeElement.disabled = isDisabled;
    }
  }

  protected getFocusableControl() {
    return (<any>(this.inputRef || {})).nativeElement;
  }

  protected getDisabledValue(): string {
    return this.value;
  }

}
