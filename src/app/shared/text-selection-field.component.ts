import { ChangeDetectionStrategy, Component, Host, Injector, OnInit, Optional, SkipSelf, ViewChild } from '@angular/core';
import { ControlContainer, FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';
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
    { provide: NG_VALUE_ACCESSOR, useExisting: TextSelectionFieldComponent, multi: true },
  ],
})
export class TextSelectionFieldComponent
  extends BaseFormFieldComponent<string[]> implements OnInit {

  @ViewChild('inputField') inputField: InputFieldComponent;

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

  remove(str: string) {
    if (str) {
      this.value = this.value.filter(s => s !== str);
    }
  }

}
