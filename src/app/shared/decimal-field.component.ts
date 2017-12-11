import { 
  Component, OnInit, Input, Output, ViewChild, EventEmitter, forwardRef,
  ElementRef, ChangeDetectionStrategy, SkipSelf, Host, Optional
} from '@angular/core';
import {
  NG_VALUE_ACCESSOR, ControlValueAccessor, FormControl, ControlContainer,
  FormGroup, FormBuilder, Validators
} from '@angular/forms';
import { FormatService } from 'app/core/format.service';

// Definition of the exported NG_VALUE_ACCESSOR provider
export const DECIMAL_FIELD_VALUE_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => DecimalFieldComponent),
  multi: true
};

/**
 * Renders a widget for a decimal field
 */
@Component({
  selector: 'decimal-field',
  templateUrl: 'decimal-field.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DECIMAL_FIELD_VALUE_ACCESSOR]
})
export class DecimalFieldComponent implements OnInit, ControlValueAccessor {
  @Input() formControl: FormControl;
  @Input() formControlName: string;

  @Input() focused: boolean | string;
  @Input() prefix: string;
  @Input() suffix: string;
  @Input() required: boolean;
  @Input() placeholder: string;
  @Input() disabled: boolean;
  decimalSeparator: string;

  @Output() change: EventEmitter<string> = new EventEmitter();
  @Output() blur: EventEmitter<string> = new EventEmitter();

  /** This is the internal form, holding both integer and decimal parts */
  form: FormGroup;
  private _scale = 0;

  @ViewChild('integerField')
  private integerField: ElementRef;
  @ViewChild('decimalField')
  private decimalField: ElementRef;

  private changeCallback = (_: any) => { };
  private touchedCallback = () => { };

  constructor(
    @Optional() @Host() @SkipSelf()
    private controlContainer: ControlContainer,
    private formatService: FormatService,
    formBuilder: FormBuilder
  ) {
    this.form = formBuilder.group({
      'integer': [null, Validators.required],
      'decimal': null,
    });
  }

  ngOnInit() {
    this.decimalSeparator = this.formatService.decimalSeparator;

    if (this.controlContainer && this.formControlName) {
      const control = this.controlContainer.control.get(this.formControlName);
      if (control instanceof FormControl) {
        this.formControl = control;
      }
    }
  }

  @Input()
  get value(): string {
    const value = this.form.value;
    const integerPart = value.integer;

    if (integerPart == null || integerPart === '') {
      return null;
    }
    return this._scale === 0
      ? integerPart
      : integerPart + '.' + value.decimal;
  }
  set value(value: string) {
    value = this.formatService.numberToFixed(value, this._scale);
    if (this.value === value) {
      // Nothing changed
      return;
    }
    let integerPart: string;
    let decimalPart: string;
    if (this._scale === 0) {
      integerPart = value;
      decimalPart = null;
    } else {
      const pos = value == null ? -1 : value.indexOf('.');
      integerPart = pos < 0 ? value : value.substr(0, pos);
      decimalPart = pos < 0 ? '0'.repeat(this.scale) : value.substr(pos + 1);
    }
    this.form.setValue({
      integer: integerPart,
      decimal: decimalPart
    });
  }

  @Input()
  set scale(scale: number) {
    if (scale !== this._scale) {
      this._scale = scale;
      this.adjustDecimalPart();
    }
  }

  get scale(): number {
    return this._scale;
  }

  private emitValue(): void {
    this.change.emit(this.value);
    this.changeCallback(this.value);
  }

  focus() {
    this.integerField.nativeElement.focus();
  }

  onBlur(event) {
    this.adjustDecimalPart();
    if (this.touchedCallback) {
      this.touchedCallback();
    }
    this.blur.emit(event);
  }

  private adjustDecimalPart(): void {
    let decimalPart = (this.form.value.decimal || '');
    let changed = false;
    if (decimalPart.length < this._scale) {
      decimalPart = decimalPart + '0'.repeat(this._scale - decimalPart.length);
      changed = true;
    } else if (decimalPart.length > this._scale) {
      decimalPart = decimalPart.substr(0, this._scale);
      changed = true;
    }
    if (changed) {
      this.form.patchValue({
        decimal: decimalPart
      });
    }
  }

  // ControlValueAccessor methods
  writeValue(obj: any): void {
    this.value = obj;
  }
  registerOnChange(fn: any): void {
    this.changeCallback = fn;
  }
  registerOnTouched(fn: any): void {
    this.touchedCallback = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (this.integerField) {
      this.integerField.nativeElement.disabled = isDisabled;
    }
    if (this.decimalField) {
      this.decimalField.nativeElement.disabled = isDisabled;
    }
  }
}
