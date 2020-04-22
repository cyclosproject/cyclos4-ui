import { Directive, HostBinding, InjectionToken, Injector, Input } from '@angular/core';
import { ControlContainer } from '@angular/forms';
import { CustomFieldSizeEnum } from 'app/api/models';
import { BaseControlComponent } from 'app/shared/base-control.component';
import { blank, focus, nextId } from 'app/shared/helper';
import { ValueFormat } from 'app/shared/value-format';

/** Injection token for the form field itself */
export const FORM_FIELD = new InjectionToken<BaseFormFieldComponent<any>>('FormField');

export type FieldLabelPosition
  /** Always on side, even on xxs */
  = 'sideForced'

  /** Above on xxs, on side otherwise */
  | 'side'

  /** Always above */
  | 'above'

  /** Above up to xs, on side otherwise */
  | 'auto';

/**
 * Base class for custom form controls
 */
@Directive()
export abstract class BaseFormFieldComponent<T> extends BaseControlComponent<T> {

  @HostBinding('class.form-field') classFormField = true;
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
  private _fieldSize: CustomFieldSizeEnum;
  @Input() get fieldSize(): CustomFieldSizeEnum {
    return this._fieldSize;
  }
  set fieldSize(size: CustomFieldSizeEnum) {
    this._fieldSize = size;
  }

  constructor(injector: Injector, protected controlContainer: ControlContainer) {
    super(injector, controlContainer);
  }

  /** Focus the current control */
  focus() {
    focus(this.getFocusableControl(), true);
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
