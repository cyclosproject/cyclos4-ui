import {
  ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Host, Injector,
  Input, Optional, Output, SkipSelf, ViewChild, HostBinding,
} from '@angular/core';
import { ControlContainer, NG_VALUE_ACCESSOR } from '@angular/forms';
import { BaseFormFieldComponent } from 'app/shared/base-form-field.component';
import { LayoutService } from 'app/core/layout.service';
import { truthyAttr } from 'app/shared/helper';

/**
 * Field used to edit a boolean
 */
@Component({
  selector: 'boolean-field',
  templateUrl: 'boolean-field.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: BooleanFieldComponent, multi: true },
  ],
})
export class BooleanFieldComponent
  extends BaseFormFieldComponent<boolean | string> {

  /** Whether the value type is boolean or string */
  @Input() type: 'boolean' | 'string' = 'boolean';
  @Output() click = new EventEmitter<Event>();
  @ViewChild('checkbox') checkbox: ElementRef;
  _switch: boolean | string = false;
  @HostBinding('class.switch') @Input() get switch(): boolean | string {
    return this._switch;
  }
  set switch(flag: boolean | string) {
    this._switch = truthyAttr(flag);
  }

  constructor(
    injector: Injector,
    @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
    public layout: LayoutService) {
    super(injector, controlContainer);
    this.labelPosition = 'sideForced';
  }

  preprocessValue(value: any): boolean | string {
    const bool = this.isTrue(value);
    return this.type === 'boolean' ? bool : String(bool);
  }

  onDisabledChange(isDisabled: boolean): void {
    if (this.checkbox && this.checkbox.nativeElement) {
      this.checkbox.nativeElement.disabled = isDisabled;
    }
  }

  toggle() {
    const value = this.value;
    const bool = value === true || value === 'true';
    this.value = this.type === 'boolean' ? !bool : String(!bool);
  }

  isTrue(value: any): boolean {
    return value === true || value === 'true';
  }

  protected getFocusableControl() {
    return this.checkbox.nativeElement;
  }

  protected getDisabledValue(): string {
    const bool = this.value === true || this.value === 'true';
    return bool ? this.i18n.general.yes : this.i18n.general.no;
  }
}
