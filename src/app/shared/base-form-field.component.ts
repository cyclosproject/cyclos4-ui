import { Input, HostBinding, InjectionToken } from '@angular/core';
import { ControlContainer } from '@angular/forms';
import { BaseControlComponent } from 'app/shared/base-control.component';
import { nextId, blank } from 'app/shared/helper';
import { CustomFieldSizeEnum } from 'app/api/models';
import { ValueFormat } from 'app/shared/value-format';

/** Injection token for the form field itself */
export const FORM_FIELD = new InjectionToken<BaseFormFieldComponent<any>>('FormField');

export type FieldLabelPosition = 'side' | 'above' | 'auto';

/**
 * Base class for custom form controls
 */
export abstract class BaseFormFieldComponent<T> extends BaseControlComponent<T> {

  @HostBinding('class.w-100') classW100 = true;
  @HostBinding('class.d-block') classDBlock = true;
  @HostBinding('class.any-label-value') get classAnyLabelValue() {
    return !blank(this.label);
  }

  protected _id: string;

  /** The main HTML element id */
  @Input() set id(id: string) {
    this._id = id;
  }
  get id(): string {
    if (this._id == null) {
      this._id = nextId();
    }
    return this._id;
  }

  /** Expose this reference as self to access in templates */
  get self(): BaseFormFieldComponent<T> {
    return this;
  }

  /** Easily copy attributes from a form field to another one */
  @Input() set copyFrom(other: BaseFormFieldComponent<any>) {
    this._id = other._id;
    this.name = other.name;
    this.label = other.label;
    this.labelPosition = other.labelPosition;
    this.fieldSize = other.fieldSize;
    this.required = other.required;
    // We cannot copy formControl because the [formControl] directive is required to trigger NG_VALUE_ACCESSOR
  }

  /** The HTML input name */
  @Input() name = '';

  /** The label to display */
  @Input() label: string;

  /** Whether to visually present a required marker next to the label */
  @Input() required: boolean | string;

  /** Where to place the label */
  @Input() labelPosition: FieldLabelPosition = 'auto';

  /** Defines how read-only values are rendered */
  disabledFormat: ValueFormat = 'plain';

  /** The field size */
  private _fieldSize = CustomFieldSizeEnum.FULL;
  @Input() get fieldSize(): CustomFieldSizeEnum {
    return this._fieldSize;
  }
  set fieldSize(size: CustomFieldSizeEnum) {
    this._fieldSize = CustomFieldSizeEnum.values().includes(size) ? size : CustomFieldSizeEnum.FULL;
  }

  constructor(protected controlContainer: ControlContainer) {
    super(controlContainer);
  }

  /** Focus the current control */
  focus() {
    try {
      this.getFocusableControl().focus();
    } catch (e) {
      // Ignore
    }
  }

  /**
   * Must be implemented to return the object with the focus method.
   * When null will never get focus.
   */
  protected abstract getFocusableControl(): any;

  /**
   * Returns the value displayed when the field is disabled
   */
  get disabledValue(): string {
    return this.getDisabledValue();
  }

  /**
   * Must be implemented to return the value displayed when the field is disabled.
   */
  protected abstract getDisabledValue(): string;

}
