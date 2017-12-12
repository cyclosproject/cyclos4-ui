import { Input, OnInit } from '@angular/core';
import { ControlValueAccessor, FormControl, ControlContainer } from '@angular/forms';

/**
 * Base class for custom form controls
 */
export abstract class BaseControlComponent<T> implements OnInit, ControlValueAccessor {

  @Input() disabled: boolean;
  @Input() formControl: FormControl;
  @Input() formControlName: string;

  private _value: T;

  private changeCallback = (_: any) => {};
  protected touchedCallback = () => {};

  constructor(protected controlContainer: ControlContainer) {
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
        this.value = value;
      }
    });
  }

  get value(): T {
    return this._value;
  }

  set value(value: T) {
    this._value = value;
    this.changeCallback(value);
  }

  writeValue(obj: any): void {
    this.value = obj;
  }

  registerOnChange(fn: any): void {
    this.changeCallback = fn;
  }

  registerOnTouched(fn: any): void {
    this.touchedCallback = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.onDisabledChange(isDisabled);
  }

  protected abstract onDisabledChange(isDisabled: boolean): void;

}
