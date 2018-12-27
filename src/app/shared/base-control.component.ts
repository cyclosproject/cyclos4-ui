import { EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ControlContainer, ControlValueAccessor, FormControl } from '@angular/forms';
import { ApiHelper } from 'app/shared/api-helper';
import { empty } from 'app/shared/helper';
import { Observable, Subscription } from 'rxjs';
import { isEqual } from 'lodash';

/**
 * Base class for custom form controls
 */
export abstract class BaseControlComponent<T> implements OnInit, OnDestroy, ControlValueAccessor {

  @Input() disabled: boolean;
  @Input() formControl: FormControl;
  @Input() formControlName: string;
  @Output() disabledChange = new EventEmitter<boolean>();

  ApiHelper = ApiHelper;

  private _value: T;
  private subs: Subscription[] = [];

  protected changeCallback = (_: any) => { };
  protected touchedCallback = () => { };
  protected validatorChange = () => { };


  constructor(protected controlContainer: ControlContainer) {
  }

  protected addSub(sub: Subscription) {
    this.subs.push(sub);
  }

  ngOnInit() {
    if (this.controlContainer && this.formControlName) {
      const control = this.controlContainer.control.get(this.formControlName);
      if (control instanceof FormControl) {
        this.formControl = control;
      }
    }
    if (this.formControl == null) {
      throw new Error(`No formControl could be resolved for ${this.constructor.name}`);
    }
    this.formControl.valueChanges.subscribe(value => {
      if (this.value !== value) {
        this.setValue(value, false);
      }
    });
  }

  ngOnDestroy() {
    this.subs.forEach(sub => sub.unsubscribe());
    this.subs = [];
  }

  get value(): T {
    return this._value;
  }

  /**
   * Preprocesses and sets the given value, notifying changes if it has changed
   */
  set value(value: T) {
    const preprocessed = this.preprocessValue(value);
    if (preprocessed instanceof Observable) {
      this.addSub(preprocessed.subscribe(val => {
        this.setValue(val, this._value !== val);
      }));
    } else {
      this.setValue(preprocessed, this._value !== preprocessed && !isEqual(this._value, preprocessed));
    }
  }

  setValue(value: T, notifyChanges = true) {
    this._value = value;
    if (notifyChanges) {
      this.notifyValueChange(this._value);
    }
  }

  writeValue(obj: any): void {
    const doInitialize = (value: T) => {
      this._value = value;
      this.onValueInitialized(this._value);
      if (empty(this._value) !== empty(obj) && this._value !== obj) {
        if (this.formControl != null) {
          // If the value was already modified, notify the new value
          this.notifyValueChange(this._value);
          this.formControl.setValue(this._value);
        }
      }
    };
    const preprocessed = this.preprocessValue(obj);
    if (preprocessed instanceof Observable) {
      this.addSub(preprocessed.subscribe(value => {
        doInitialize(value);
      }));
    } else {
      doInitialize(preprocessed);
    }
  }

  /**
   * May be overridden to preprocess a raw value being set, converting it to the expected format.
   * Can also return an observable, that will actually set the value once it is properly converted
   * @param value The raw value
   */
  protected preprocessValue(value: any): T | Observable<T> {
    return value;
  }

  protected onValueInitialized(_value: T) {
  }

  registerOnChange(fn: any): void {
    this.changeCallback = fn;
  }
  registerOnTouched(fn: any): void {
    this.touchedCallback = fn;
  }
  registerOnValidatorChange(fn: () => void): void {
    this.validatorChange = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.disabledChange.emit(isDisabled);
    this.onDisabledChange(isDisabled);
  }

  notifyTouched() {
    this.touchedCallback();
  }

  notifyValueChange(value: T) {
    this.changeCallback(value);
  }

  protected onDisabledChange(_isDisabled: boolean): void {
  }

}
