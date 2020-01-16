import {
  ChangeDetectorRef, Component, ElementRef, Host, Injector, Input, OnChanges,
  OnInit, Optional, SimpleChanges, SkipSelf, ViewChild
} from '@angular/core';
import {
  AbstractControl, ControlContainer, FormControl, NG_VALIDATORS,
  NG_VALUE_ACCESSOR, ValidationErrors, Validator
} from '@angular/forms';
import { CustomFieldSizeEnum } from 'app/api/models';
import { BaseFormFieldComponent } from 'app/shared/base-form-field.component';
import { empty } from 'app/shared/helper';
import { LayoutService } from 'app/shared/layout.service';

/**
 * Renders a widget for a decimal field
 */
@Component({
  selector: 'decimal-field',
  templateUrl: 'decimal-field.component.html',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: DecimalFieldComponent, multi: true },
    { provide: NG_VALIDATORS, useExisting: DecimalFieldComponent, multi: true }
  ]
})
export class DecimalFieldComponent extends BaseFormFieldComponent<string>
  implements Validator, OnInit, OnChanges {

  constructor(
    injector: Injector,
    @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
    public layout: LayoutService,
    private changeDetector: ChangeDetectorRef) {
    super(injector, controlContainer);
  }

  /** Text to show as prefix */
  @Input() prefix: string;

  /** Text to show as suffix */
  @Input() suffix: string;

  /**
   * Aligh text to left or right
   */
  @Input() textRight = true;

  /** Text to show when component is disabled and value is empty  */
  @Input() emptyLabel: '';

  @ViewChild('inputField', { static: false }) private inputRef: ElementRef;

  internalControl: FormControl;

  private _scale = 0;
  private autoSize = false;

  @Input() get scale(): number {
    return this._scale;
  }
  set scale(scale: number) {
    if (scale !== this._scale) {
      this._scale = scale;
      if (this.inputRef) {
        this.setInternalControlValue();
      }
    }
  }

  preprocessValue(value: string): string {
    if (value === undefined) {
      // If we don't do this, values parsed as undefined (invalid) become null (valid, but empty)
      return undefined;
    }
    return empty(value) ? null : this.format.numberToFixed(value, this.scale);
  }

  get input(): HTMLInputElement {
    return this.inputRef ? this.inputRef.nativeElement : null;
  }

  onValueInitialized(value: string) {
    this.setInternalControlValue();

    // As a workaround to https://github.com/angular/angular/issues/13792, manually update the input value
    const input = this.input;
    if (input) {
      input.value = value;
    }
  }

  ngOnInit() {
    super.ngOnInit();
    if (this.fieldSize == null) {
      this.autoSize = true;
      this.fieldSize = this.prefix && this.suffix ? CustomFieldSizeEnum.MEDIUM : CustomFieldSizeEnum.SMALL;
    }
    this.internalControl = new FormControl();
    this.addSub(this.internalControl.valueChanges.subscribe((input: string) => {
      if (empty(input)) {
        this.value = null;
      } else {
        if (this.format.decimalSeparator !== '.') {
          input = input.replace(this.format.decimalSeparator, '.');
        }
        this.value = this.format.numberToFixed(input, this.scale);
      }
      this.formControl.markAsTouched();
    }));
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.autoSize && (changes.prefix || changes.suffix)) {
      this.fieldSize = this.prefix && this.suffix ? CustomFieldSizeEnum.MEDIUM : CustomFieldSizeEnum.SMALL;
      this.changeDetector.detectChanges();
    }
  }

  onBlur() {
    this.setInternalControlValue();
    this.notifyTouched();
  }

  private setInternalControlValue() {
    const value = this.value;
    if (!empty(value)) {
      let input = this.format.numberToFixed(value, this.scale);
      if (this.format.decimalSeparator !== '.') {
        input = input.replace('.', this.format.decimalSeparator);
      }
      this.internalControl.setValue(input);
    } else {
      this.internalControl.setValue(null);
    }
  }

  onDisabledChange(isDisabled: boolean): void {
    if (this.inputRef && this.inputRef.nativeElement) {
      this.inputRef.nativeElement.disabled = isDisabled;
    }
  }

  protected getFocusableControl() {
    return this.inputRef ? this.inputRef.nativeElement : null;
  }

  protected getDisabledValue(): string {
    const value = this.format.formatAsNumber(this.value, this.scale);
    return empty(value) ? this.emptyLabel : (this.prefix || '') + value + (this.suffix || '');
  }

  // Validator methods
  validate(c: AbstractControl): ValidationErrors {
    if (empty(this.internalControl.value)) {
      // When the input text is empty, assume empty
      return null;
    }
    const value = c.value;
    // We're validating a value that was already passed to format.numberToFixed
    if (value === undefined) {
      return {
        number: true
      };
    }
    return null;
  }

}
