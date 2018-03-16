import {
  Component, Input, Output, ViewChild, EventEmitter, forwardRef,
  ElementRef, ChangeDetectionStrategy, SkipSelf, Host, Optional
} from '@angular/core';
import {
  NG_VALUE_ACCESSOR, FormControl, ControlContainer,
  FormGroup, FormBuilder, Validators
} from '@angular/forms';
import { FormatService } from 'app/core/format.service';
import { BaseControlComponent } from 'app/shared/base-control.component';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

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
export class DecimalFieldComponent extends BaseControlComponent<string> {
  @Input() name: string;
  @Input() focused: boolean | string;
  @Input() prefix: string;
  @Input() suffix: string;
  @Input() required: boolean;
  @Input() placeholder: string;
  @Input() privacyControl: FormControl;

  @Output() change: EventEmitter<string> = new EventEmitter();
  @Output() blur: EventEmitter<string> = new EventEmitter();

  /** This is the internal form, holding both integer and decimal parts */
  form: FormGroup;
  private _scale = 0;

  @ViewChild('integerField')
  private integerField: ElementRef;
  @ViewChild('decimalField')
  private decimalField: ElementRef;

  decimalSeparator = new BehaviorSubject<string>(null);

  constructor(
    @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
    private formatService: FormatService,
    formBuilder: FormBuilder
  ) {
    super(controlContainer);
    this.form = formBuilder.group({
      'integer': [null, Validators.required],
      'decimal': null,
    });
    this.form.valueChanges.subscribe(value => {
      const integer = (this.formatService.numberToFixed(value.integer, 0) || '').substr(0, 15);
      const decimal = this.decimalPart(value.decimal);
      let newValue: string;
      if (integer === '') {
        newValue = null;
      } else if (this.scale === 0) {
        newValue = integer;
      } else {
        newValue = `${integer}.${decimal}`;
      }
      this.value = newValue;
      const currValue = this.form.value;
      const currInteger = currValue.integer == null ? '' : String(currValue.integer);
      const currDecimal = currValue.decimal == null ? '' : String(currValue.decimal);
      if (currInteger !== integer || currDecimal !== decimal.substr(0, currDecimal.length)) {
        this.form.setValue({ integer: integer, decimal: decimal });
      }
    });
  }

  ngOnInit() {
    super.ngOnInit();
    const init = () => this.decimalSeparator.next(this.formatService.decimalSeparator);
    if (this.formatService.decimalSeparator) {
      init();
    } else {
      this.formatService.materialDateFormats.subscribe(init);
    }
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

  get decimalWidth(): number {
    const scale = this.scale;
    if (scale === 0) {
      return 0;
    }
    return 10 + (this.suffix || '').trim().length * 9 + this.scale * 9;
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

  onKeyUp(event: KeyboardEvent) {
    if (event.key === this.decimalSeparator.value) {
      this.decimalField.nativeElement.focus();
    }
  }

  private decimalPart(raw: any): string {
    let decimalPart = raw == null ? '' : String(raw);
    if (decimalPart.length < this._scale) {
      decimalPart = decimalPart + '0'.repeat(this._scale - decimalPart.length);
    } else if (decimalPart.length > this._scale) {
      decimalPart = decimalPart.substr(0, this._scale);
    }
    return decimalPart;
  }

  private adjustDecimalPart(): void {
    const value = this.form.value;
    const raw = value.decimal == null ? null : String(value.decimal);
    const decimalPart = this.decimalPart(raw);
    if (raw !== decimalPart) {
      this.form.patchValue({
        decimal: decimalPart
      });
    }
  }

  onDisabledChange(isDisabled: boolean) {
    if (this.integerField) {
      this.integerField.nativeElement.disabled = isDisabled;
    }
    if (this.decimalField) {
      this.decimalField.nativeElement.disabled = isDisabled;
    }
  }
}
