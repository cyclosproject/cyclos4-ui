import {
  ChangeDetectorRef, Component, ElementRef, Host, Injector, Input, OnChanges,
  OnInit, Optional, SimpleChanges, SkipSelf, ViewChild,
} from '@angular/core';
import {
  AbstractControl, ControlContainer, FormControl, NG_VALIDATORS,
  NG_VALUE_ACCESSOR, ValidationErrors, Validator,
} from '@angular/forms';
import { CustomFieldSizeEnum } from 'app/api/models';
import { BaseFormFieldComponent } from 'app/shared/base-form-field.component';
import { empty, truthyAttr } from 'app/shared/helper';
import { LayoutService } from 'app/shared/layout.service';
import { BehaviorSubject } from 'rxjs';

/**
 * Renders a widget for a decimal field
 */
@Component({
  selector: 'decimal-field',
  templateUrl: 'decimal-field.component.html',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: DecimalFieldComponent, multi: true },
    { provide: NG_VALIDATORS, useExisting: DecimalFieldComponent, multi: true },
  ],
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
   * Align text to left or right
   */
  @Input() textRight = true;

  /**
   * Fixed values minimum range (min & max required)
   */
  @Input() minRange: number;

  /**
   * Fixed values maximum range (min & max required)
   */
  @Input() maxRange: number;

  /** Text to show when there is a fixed value range and value is custom (outside range) */
  @Input() customValueLabel: '';

  /** Text to show when component is disabled and value is empty  */
  @Input() emptyLabel: '';

  /** If true the value will be always negative */
  private _negative: boolean | string = false;
  @Input() get negative(): boolean | string {
    return this._negative;
  }
  set negative(show: boolean | string) {
    this._negative = truthyAttr(show);
  }

  @ViewChild('inputField') private inputRef: ElementRef;

  internalControl: FormControl;
  fixedValuesControl: FormControl;

  fixedValues: string[];
  useCustom$ = new BehaviorSubject<boolean>(true);

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
    return empty(value) ? null : this.format.numberToFixed(this.negative ? this.toNegative(value) : value, this.scale);
  }

  toNegative(value: string): string {
    if (value) {
      if (!value.startsWith('-')) {
        return '-' + value;
      }
    }
    return value;
  }

  get input(): HTMLInputElement {
    return this.inputRef ? this.inputRef.nativeElement : null;
  }

  onValueInitialized(value: string) {
    if (this.fixedValuesControl) {
      const str = this.format.numberToFixed(value, this.scale);
      if (this.fixedValues.indexOf(str) !== -1) {
        this.fixedValuesControl.setValue(str);
      }
    }

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
    this.addSub(this.internalControl.valueChanges.subscribe((input: string) => this.updateInternalControl(input)));

    if (this.minRange && this.maxRange) {
      this.fixedValuesControl = new FormControl();
      this.fixedValues = [];
      for (let index = this.minRange; index <= this.maxRange; index++) {
        this.fixedValues.push(this.format.numberToFixed(index, this.scale));
      }
      this.addSub(this.fixedValuesControl.valueChanges.subscribe((input: string) => {
        if (input === 'custom') {
          this.internalControl.setValue(null);
          this.useCustom = true;
          setTimeout(() => this.inputRef.nativeElement.focus(), 100);
        } else {
          this.internalControl.setValue(input);
          this.onBlur();
          this.useCustom = false;
        }
      }));
    }
  }

  private updateInternalControl(input: string) {
    if (empty(input)) {
      this.value = null;
    } else {
      if (this.format.decimalSeparator !== '.') {
        input = input.replace(this.format.decimalSeparator, '.');
      }
      this.value = this.format.numberToFixed(input, this.scale);
    }
    this.formControl.markAsTouched();
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

  get useCustom() {
    return this.useCustom$.value;
  }

  set useCustom(value: boolean) {
    this.useCustom$.next(value);
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
        number: true,
      };
    }
    return null;
  }

}
