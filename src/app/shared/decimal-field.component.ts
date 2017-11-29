import { Component, OnInit, Input, Output, ViewChild, EventEmitter, forwardRef, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
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
  constructor(
    private formatService: FormatService
  ) { }

  @Input() focused: boolean | string;
  @Input() prefix: string;
  @Input() suffix: string;
  @Input() required: boolean;
  @Input() placeholder: string;
  @Input() disabled: boolean;
  decimalSeparator: string;

  @Output() change: EventEmitter<string> = new EventEmitter();
  @Output() blur: EventEmitter<string> = new EventEmitter();

  private _integerPart: string;
  private _decimalPart: string;
  private _scale = 0;

  @ViewChild('integerField')
  private integerField: ElementRef;
  @ViewChild('decimalField')
  private decimalField: ElementRef;


  private changeCallback = (_: any) => { };
  private touchedCallback = () => { };

  @Input()
  get value(): string {
    if (this._integerPart == null || this._integerPart === '') {
      return null;
    }
    return this._scale === 0
      ? this._integerPart
      : this._integerPart + '.' + this._decimalPart;
  }
  set value(value: string) {
    value = this.formatService.numberToFixed(value, this._scale);
    if (this.value === value) {
      // Nothing changed
      return;
    }
    if (this._scale === 0) {
      this._integerPart = value;
      this._decimalPart = null;
    } else {
      const pos = value == null ? -1 : value.indexOf('.');
      this._integerPart = pos < 0 ? value : value.substr(0, pos);
      this._decimalPart = pos < 0 ? '0'.repeat(this.scale) : value.substr(pos + 1);
    }
    this.emitValue();
  }

  @Input()
  get integerPart(): string | number {
    return this._integerPart;
  }
  set integerPart(integerPart: string | number) {
    if (this._integerPart === integerPart) {
      // No changes
      return;
    }
    if (typeof integerPart === 'number') {
      this._integerPart = String(integerPart);
    } else if (typeof integerPart === 'string'
      && integerPart.match(/^[0-9]*$/)) {
      this._integerPart = integerPart;
    } else {
      this._integerPart = null;
    }
    this.emitValue();
  }

  @Input() @Output()
  get decimalPart(): string | number {
    return this._decimalPart;
  }
  set decimalPart(decimalPart: string | number) {
    if (this._decimalPart === decimalPart) {
      // No changes
      return;
    }
    if (typeof decimalPart === 'number') {
      this._decimalPart = String(decimalPart);
    } else if (typeof decimalPart === 'string'
      && decimalPart.match(/^[0-9]*$/)) {
      this._decimalPart = decimalPart;
    } else {
      this._decimalPart = null;
    }
    this.emitValue();
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

  ngOnInit() {
    this.decimalSeparator = this.formatService.decimalSeparator;
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
    const dec = (this._decimalPart || '');
    if (dec.length < this._scale) {
      this._decimalPart = dec + '0'.repeat(this._scale - dec.length);
      this.emitValue();
    } else if (dec.length > this._scale) {
      this._decimalPart = dec.substr(0, this._scale);
      this.emitValue();
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
