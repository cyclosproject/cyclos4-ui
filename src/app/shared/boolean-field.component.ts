import {
  Component, Input, forwardRef, Provider, ChangeDetectionStrategy, SkipSelf, Host, Optional, ViewChild, ElementRef, EventEmitter, Output
} from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlContainer } from '@angular/forms';
import { BaseControlComponent } from 'app/shared/base-control.component';
import { nextId } from 'app/shared/helper';
import { BaseFormFieldComponent, FORM_FIELD } from 'app/shared/base-form-field.component';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { LayoutService } from 'app/shared/layout.service';

/**
 * Field used to edit a boolean
 */
@Component({
  selector: 'boolean-field',
  templateUrl: 'boolean-field.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: BooleanFieldComponent, multi: true }
  ]
})
export class BooleanFieldComponent
  extends BaseFormFieldComponent<boolean | string> {

  /** Whether the value type is boolean or string */
  @Input() type: 'boolean' | 'string' = 'boolean';
  @Output() click = new EventEmitter<MouseEvent>();
  @ViewChild('checkbox') checkbox: ElementRef;

  constructor(
    @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
    private i18n: I18n,
    public layout: LayoutService) {
    super(controlContainer);
  }

  preprocessValue(value: any): boolean | string {
    const bool = value === true || value === 'true';
    return this.type === 'boolean' ? bool : String(bool);
  }

  onDisabledChange(isDisabled: boolean): void {
    if (this.checkbox && this.checkbox.nativeElement) {
      this.checkbox.nativeElement.disabled = isDisabled;
    }
  }

  protected getFocusableControl() {
    return this.checkbox.nativeElement;
  }

  protected getDisabledValue(): string {
    const bool = this.value === true || this.value === 'true';
    return bool ? this.i18n('Yes') : this.i18n('No');
  }
}
