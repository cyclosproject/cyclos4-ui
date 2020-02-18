import { ChangeDetectionStrategy, Component, OnInit, Injector, Optional, Host, SkipSelf, ViewChild } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlContainer, FormControl } from '@angular/forms';
import { BaseFormFieldComponent } from 'app/shared/base-form-field.component';
import { InputFieldComponent } from 'app/shared/input-field.component';

/**
 * Field used to enter multiple string values, e.g: a keywords field. The value is an array with each string entered.
 */
@Component({
  selector: 'text-selection-field',
  templateUrl: 'text-selection-field.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: TextSelectionFieldComponent, multi: true }
  ]
})
export class TextSelectionFieldComponent
  extends BaseFormFieldComponent<string[]> implements OnInit {

  @ViewChild('inputField', { static: false }) inputField: InputFieldComponent;

  inputFieldControl = new FormControl(null);

  constructor(
    injector: Injector,
    @Optional() @Host() @SkipSelf() controlContainer: ControlContainer) {
    super(injector, controlContainer);
  }

  ngOnInit() {
    super.ngOnInit();
  }

  protected getDisabledValue(): string {
    return (this.value || []).join(', ');
  }

  protected getFocusableControl() {
    throw this.inputField;
  }

  add() {
    const nativeInput = this.inputField.input;
    const str = nativeInput.value;
    if (!str) {
      return;
    }
    const current = this.value || [];
    current.push(str);
    this.value = current;
    nativeInput.value = null;
  }

  remove(str: String) {
    if (str) {
      this.value = this.value.filter(s => s !== str);
    }
  }

}
