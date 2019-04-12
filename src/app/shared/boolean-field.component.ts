import {
  ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Host, Input,
  Optional, Output, SkipSelf, ViewChild, Injector
} from '@angular/core';
import { ControlContainer, NG_VALUE_ACCESSOR } from '@angular/forms';
import { BaseFormFieldComponent } from 'app/shared/base-form-field.component';
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
    injector: Injector,
    @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
    public layout: LayoutService) {
    super(injector, controlContainer);
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
    return bool ? this.i18n.general.yes : this.i18n.general.no;
  }
}
